const bcrypt = require('bcryptjs');
const {
  findEmployeeForAuthIdentity,
  getEmployeeById,
  updateEmployeeLastLogin,
  updateEmployeePasswordHash
} = require('../db/employees');
const { addSecurityAuditEvent } = require('../db/auth-security');
const {
  toAppUser,
  setCurrentUser,
  clearCurrentUser,
  getCurrentUser,
  assertPermission,
  hasPermission
} = require('./session');
const { normalizeEmail, isProtectedEmail } = require('./protected-accounts');

const LOGIN_RATE = { maxFails: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 };
const SETUP_RATE = { maxFails: 5, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 };

const runtimeLimiter = {
  login: new Map(),
  setup: new Map()
};

const nowIso = () => new Date().toISOString();
const nowMs = () => Date.now();
const normalizeIdentity = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const isPrivilegedRole = (role) => role === 'admin' || role === 'developer' || role === 'owner';
const readPasswordHash = (row) => row?.password_hash ?? row?.passwordHash ?? null;
const isUserActive = (row) => Number(row?.is_active ?? row?.isActive ?? row?.actif ?? 0) === 1;
const isProtectedUser = (row) => Number(row?.is_protected_account ?? row?.isProtectedAccount ?? 0) === 1 || isProtectedEmail(row?.email);
const mustSetupPassword = (row) => {
  const hasPasswordHash = !!readPasswordHash(row);
  if (!hasPasswordHash) return true;
  const flagged = Number(row?.must_setup_password ?? row?.mustSetupPassword ?? 0) === 1;
  // Non-protected users still authenticate with username/password even if a legacy flag stayed at 1.
  if (!isProtectedUser(row)) return false;
  return flagged;
};

const hashPassword = (password) => bcrypt.hashSync(password, 10);
const verifyPassword = (plainText, passwordHash) => {
  if (!plainText || !passwordHash) return false;
  return bcrypt.compareSync(plainText, passwordHash);
};

const passwordPolicyMessage = 'Mot de passe invalide: minimum 10 caracteres avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractere special.';

const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') return { ok: false, message: passwordPolicyMessage };
  if (password.length < 10) return { ok: false, message: passwordPolicyMessage };
  if (!/[A-Z]/.test(password)) return { ok: false, message: passwordPolicyMessage };
  if (!/[a-z]/.test(password)) return { ok: false, message: passwordPolicyMessage };
  if (!/[0-9]/.test(password)) return { ok: false, message: passwordPolicyMessage };
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, message: passwordPolicyMessage };
  return { ok: true };
};

const trimLimiterBucket = (bucket, windowMs) => {
  const cutoff = nowMs() - windowMs;
  bucket.fails = bucket.fails.filter((timestamp) => timestamp >= cutoff);
};

const getLimiterBucket = (store, key) => {
  const normalizedKey = key || 'unknown';
  if (!store.has(normalizedKey)) {
    store.set(normalizedKey, { fails: [], blockedUntil: 0 });
  }
  return store.get(normalizedKey);
};

const checkRateLimit = (store, key, config) => {
  const bucket = getLimiterBucket(store, key);
  trimLimiterBucket(bucket, config.windowMs);
  if (bucket.blockedUntil > nowMs()) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - nowMs()) / 1000)
    };
  }
  return { blocked: false, retryAfterSeconds: 0 };
};

const recordFailure = (store, key, config) => {
  const bucket = getLimiterBucket(store, key);
  trimLimiterBucket(bucket, config.windowMs);
  bucket.fails.push(nowMs());
  if (bucket.fails.length >= config.maxFails) {
    bucket.blockedUntil = nowMs() + config.blockMs;
    bucket.fails = [];
  }
};

const clearFailures = (store, key) => {
  const bucket = getLimiterBucket(store, key);
  bucket.fails = [];
  bucket.blockedUntil = 0;
};

const toAuditPayload = (ctx = {}) => ({
  userId: ctx.userId ?? null,
  eventType: ctx.eventType,
  emailAttempted: ctx.emailAttempted ?? null,
  success: !!ctx.success,
  ip: ctx.ip ?? null,
  userAgent: ctx.userAgent ?? null,
  details: ctx.details ?? null
});

const audit = (db, ctx) => {
  try {
    addSecurityAuditEvent(db, toAuditPayload(ctx));
  } catch (error) {
    console.error('[auth:audit] failed', error);
  }
};

const maskEmail = (email) => {
  const normalized = normalizeEmail(email);
  const [name, domain] = normalized.split('@');
  if (!name || !domain) return '***';
  const start = name.slice(0, 2);
  return `${start}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
};

const beginLogin = async (db, identity, password, context = {}) => {
  const normalizedIdentity = normalizeIdentity(identity);
  console.log('[auth-web] login requested');
  console.log('[auth-web] identity received', {
    identity: normalizedIdentity || null,
    type: normalizedIdentity.includes('@') ? 'email' : 'username'
  });
  const limiter = checkRateLimit(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
  if (limiter.blocked) {
    console.warn('[auth-web] login failed: blocked_temporarily', { retryAfterSeconds: limiter.retryAfterSeconds });
    return { status: 'blocked_temporarily', retryAfterSeconds: limiter.retryAfterSeconds };
  }

  if (!normalizedIdentity || !password) {
    recordFailure(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
    console.warn('[auth-web] login failed: missing_identity_or_password');
    return { status: 'invalid_credentials' };
  }

  const row = findEmployeeForAuthIdentity(db, normalizedIdentity);
  console.log('[auth-web] account found:', row ? 'yes' : 'no');
  if (!row || !isUserActive(row)) {
    recordFailure(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
    audit(db, {
      eventType: 'auth_login_failed',
      emailAttempted: normalizedIdentity.includes('@') ? normalizedIdentity : null,
      success: false,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { reason: 'user_not_found_or_inactive' }
    });
    console.warn('[auth-web] login failed: user_not_found_or_inactive');
    return { status: 'invalid_credentials' };
  }

  console.log('[auth-web] account type:', isProtectedUser(row) ? 'protected' : 'employee');
  const usingEmail = normalizedIdentity.includes('@');
  if (usingEmail && !isProtectedUser(row)) {
    recordFailure(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
    audit(db, {
      userId: row.id,
      eventType: 'auth_login_failed',
      emailAttempted: row.email_normalized ?? normalizedIdentity,
      success: false,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { reason: 'email_login_forbidden_for_non_protected' }
    });
    console.warn('[auth-web] login failed: email_login_forbidden_for_non_protected');
    return { status: 'invalid_credentials' };
  }

  if (mustSetupPassword(row)) {
    if (isProtectedUser(row)) {
      console.warn('[auth-web] login failed: must_setup_password');
      return {
        status: 'must_setup_password',
        maskedEmail: maskEmail(row.email)
      };
    }
    recordFailure(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
    console.warn('[auth-web] login failed: non_protected_without_ready_password');
    return { status: 'invalid_credentials' };
  }

  const passwordValid = verifyPassword(password, row.password_hash);
  console.log('[auth-web] password valid:', passwordValid ? 'yes' : 'no');
  if (!passwordValid) {
    recordFailure(runtimeLimiter.login, normalizedIdentity, LOGIN_RATE);
    audit(db, {
      userId: row.id,
      eventType: 'auth_login_failed',
      emailAttempted: row.email_normalized ?? null,
      success: false,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { reason: 'password_invalid' }
    });
    console.warn('[auth-web] login failed: password_invalid');
    return { status: 'invalid_credentials' };
  }

  clearFailures(runtimeLimiter.login, normalizedIdentity);

  const appUser = toAppUser(row);
  setCurrentUser(appUser);
  try {
    updateEmployeeLastLogin(db, row.id, nowIso());
  } catch (error) {
    // Do not block login if telemetry update fails (readonly DB, transient lock, etc.).
    console.warn('[auth-web] login metadata update failed', {
      userId: row.id,
      reason: error instanceof Error ? error.message : 'UNKNOWN'
    });
  }
  audit(db, {
    userId: row.id,
    eventType: 'auth_login_success',
    emailAttempted: row.email_normalized ?? null,
    success: true,
    ip: context.ip,
    userAgent: context.userAgent
  });

  console.log('[auth-web] login success', { userId: row.id, role: row.role });
  return { status: 'success', user: appUser };
};

const setupProtectedPassword = (db, email, newPassword, context = {}) => {
  const normalizedEmail = normalizeEmail(email);
  console.log('[auth] protected password setup requested', { email: normalizedEmail || null });

  const limiter = checkRateLimit(runtimeLimiter.setup, normalizedEmail, SETUP_RATE);
  if (limiter.blocked) {
    console.warn('[auth] protected password setup failed: blocked_temporarily', {
      email: normalizedEmail || null,
      retryAfterSeconds: limiter.retryAfterSeconds
    });
    return { ok: false, status: 'blocked_temporarily', retryAfterSeconds: limiter.retryAfterSeconds };
  }

  if (!normalizedEmail || !isProtectedEmail(normalizedEmail)) {
    recordFailure(runtimeLimiter.setup, normalizedEmail, SETUP_RATE);
    console.warn('[auth] protected password setup failed: forbidden', { email: normalizedEmail || null });
    return { ok: false, status: 'forbidden', message: 'Email non autorise pour creation initiale.' };
  }

  let user = null;
  try {
    user = findEmployeeForAuthIdentity(db, normalizedEmail);
  } catch (error) {
    console.error('[auth] protected password setup failed: account lookup error', error);
    return {
      ok: false,
      status: 'operation_failed',
      message: 'Erreur interne lors de la recherche du compte protege.'
    };
  }

  const found = !!user && normalizeEmail(user.email) === normalizedEmail;
  console.log('[auth] protected account found:', found ? 'yes' : 'no');

  if (!found || !isProtectedUser(user) || !isUserActive(user)) {
    recordFailure(runtimeLimiter.setup, normalizedEmail, SETUP_RATE);
    console.warn('[auth] protected password setup failed: invalid_credentials', {
      email: normalizedEmail,
      found,
      isProtected: !!user && isProtectedUser(user),
      isActive: !!user && isUserActive(user)
    });
    return { ok: false, status: 'invalid_credentials', message: 'Compte protege introuvable ou inactif.' };
  }

  const alreadyConfigured = !mustSetupPassword(user);
  console.log('[auth] protected account already initialized:', alreadyConfigured ? 'yes' : 'no');
  if (alreadyConfigured) {
    console.warn('[auth] protected password setup failed: already_configured', { email: normalizedEmail });
    return { ok: false, status: 'already_configured', message: 'Le mot de passe est deja configure.' };
  }

  const policy = validatePasswordStrength(newPassword);
  console.log('[auth] password policy valid:', policy.ok ? 'yes' : 'no');
  if (!policy.ok) {
    console.warn('[auth] protected password setup failed: weak_password', { email: normalizedEmail });
    return { ok: false, status: 'weak_password', message: policy.message };
  }

  let updated = false;
  try {
    updated = updateEmployeePasswordHash(db, user.id, hashPassword(newPassword), { mustSetupPassword: false });
  } catch (error) {
    console.error('[auth] protected password setup failed: password update error', error);
    return {
      ok: false,
      status: 'operation_failed',
      message: 'Erreur interne lors de la mise a jour du mot de passe.'
    };
  }

  if (!updated) {
    console.warn('[auth] protected password setup failed: operation_failed', { email: normalizedEmail });
    return { ok: false, status: 'operation_failed', message: 'Impossible de definir le mot de passe.' };
  }

  clearFailures(runtimeLimiter.setup, normalizedEmail);
  audit(db, {
    userId: user.id,
    eventType: 'auth_setup_password_completed',
    emailAttempted: user.email,
    success: true,
    ip: context.ip,
    userAgent: context.userAgent
  });

  console.log('[auth] protected password setup success', { email: normalizedEmail });
  return { ok: true, status: 'completed' };
};

const resetPassword = (db, employeeId, newPassword) => {
  assertPermission('manageEmployees');

  const current = getCurrentUser();
  const target = getEmployeeById(db, employeeId);
  if (!current || !target) {
    return false;
  }

  if (target.isProtectedAccount) {
    return false;
  }

  const policy = validatePasswordStrength(newPassword);
  if (!policy.ok) {
    return false;
  }

  if (!employeeId || !newPassword) {
    return false;
  }

  if (!isPrivilegedRole(current.role) && current.role !== 'admin') {
    return false;
  }

  return updateEmployeePasswordHash(db, employeeId, hashPassword(newPassword), { mustSetupPassword: false });
};

const login = (db, username, password, context = {}) => beginLogin(db, username, password, context).then((result) => {
  if (result?.status === 'success') {
    return result.user;
  }
  return null;
});

const logout = () => {
  clearCurrentUser();
  return true;
};

module.exports = {
  beginLogin,
  setupProtectedPassword,
  login,
  logout,
  resetPassword,
  getCurrentUser,
  assertPermission,
  hasPermission,
  hashPassword,
  validatePasswordStrength
};
