const crypto = require('crypto');

const createId = () => crypto.randomUUID?.() ?? `auth_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();

const parseJson = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const rowToChallenge = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    purpose: row.purpose,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at ?? null,
    attemptsCount: Number(row.attempts_count ?? 0) || 0,
    maxAttempts: Number(row.max_attempts ?? 5) || 5,
    createdAt: row.created_at,
    requestedIp: row.requested_ip ?? null,
    requestedUserAgent: row.requested_user_agent ?? null
  };
};

const cleanupExpiredChallenges = (db) => {
  db.prepare(`
    DELETE FROM auth_challenges
    WHERE used_at IS NOT NULL
       OR datetime(expires_at) < datetime('now', '-2 days')
  `).run();
};

const createAuthChallenge = (db, payload) => {
  const now = nowIso();
  const id = payload.id || createId();

  db.prepare(`
    INSERT INTO auth_challenges (
      id, user_id, purpose, code_hash, expires_at, used_at,
      attempts_count, max_attempts, created_at, requested_ip, requested_user_agent
    ) VALUES (
      @id, @user_id, @purpose, @code_hash, @expires_at, NULL,
      0, @max_attempts, @created_at, @requested_ip, @requested_user_agent
    )
  `).run({
    id,
    user_id: payload.userId,
    purpose: payload.purpose,
    code_hash: payload.codeHash,
    expires_at: payload.expiresAt,
    max_attempts: Number(payload.maxAttempts ?? 5) || 5,
    created_at: now,
    requested_ip: payload.requestedIp ?? null,
    requested_user_agent: payload.requestedUserAgent ?? null
  });

  return getAuthChallengeById(db, id);
};

const getAuthChallengeById = (db, challengeId) => {
  if (!challengeId) return null;
  const row = db.prepare(`
    SELECT
      id, user_id, purpose, code_hash, expires_at, used_at,
      attempts_count, max_attempts, created_at, requested_ip, requested_user_agent
    FROM auth_challenges
    WHERE id = ?
    LIMIT 1
  `).get(challengeId);
  return rowToChallenge(row);
};

const invalidateActiveChallenges = (db, userId, purpose) => {
  db.prepare(`
    UPDATE auth_challenges
    SET used_at = @usedAt
    WHERE user_id = @userId
      AND purpose = @purpose
      AND used_at IS NULL
      AND datetime(expires_at) >= datetime('now')
  `).run({
    usedAt: nowIso(),
    userId,
    purpose
  });
};

const markAuthChallengeUsed = (db, challengeId) => {
  const result = db.prepare(`
    UPDATE auth_challenges
    SET used_at = @usedAt
    WHERE id = @id
      AND used_at IS NULL
  `).run({
    id: challengeId,
    usedAt: nowIso()
  });
  return result.changes > 0;
};

const incrementAuthChallengeAttempt = (db, challengeId) => {
  db.prepare(`
    UPDATE auth_challenges
    SET attempts_count = attempts_count + 1
    WHERE id = @id
  `).run({ id: challengeId });

  return getAuthChallengeById(db, challengeId);
};

const updateAuthChallengeAttempts = (db, challengeId, attemptsCount) => {
  db.prepare(`
    UPDATE auth_challenges
    SET attempts_count = @attempts
    WHERE id = @id
  `).run({
    id: challengeId,
    attempts: Number(attemptsCount) || 0
  });
};

const addSecurityAuditEvent = (db, payload) => {
  const id = payload.id || createId();
  db.prepare(`
    INSERT INTO security_audit_log (
      id, user_id, event_type, email_attempted, success,
      ip, user_agent, details, created_at
    ) VALUES (
      @id, @user_id, @event_type, @email_attempted, @success,
      @ip, @user_agent, @details, @created_at
    )
  `).run({
    id,
    user_id: payload.userId ?? null,
    event_type: payload.eventType,
    email_attempted: payload.emailAttempted ?? null,
    success: payload.success ? 1 : 0,
    ip: payload.ip ?? null,
    user_agent: payload.userAgent ?? null,
    details: payload.details ? JSON.stringify(payload.details) : null,
    created_at: payload.createdAt ?? nowIso()
  });
};

const countRecentSecurityEvents = (db, filter) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS total
    FROM security_audit_log
    WHERE event_type = @eventType
      AND datetime(created_at) >= datetime(@since)
      AND (@emailAttempted IS NULL OR email_attempted = @emailAttempted)
      AND (@ip IS NULL OR ip = @ip)
  `).get({
    eventType: filter.eventType,
    since: filter.since,
    emailAttempted: filter.emailAttempted ?? null,
    ip: filter.ip ?? null
  });

  return Number(row?.total ?? 0) || 0;
};

const listRecentSecurityEvents = (db, limit = 100) => db.prepare(`
  SELECT
    id, user_id, event_type, email_attempted, success,
    ip, user_agent, details, created_at
  FROM security_audit_log
  ORDER BY datetime(created_at) DESC
  LIMIT ?
`).all(Number(limit) || 100).map((row) => ({
  id: row.id,
  userId: row.user_id ?? null,
  eventType: row.event_type,
  emailAttempted: row.email_attempted ?? null,
  success: Number(row.success) === 1,
  ip: row.ip ?? null,
  userAgent: row.user_agent ?? null,
  details: parseJson(row.details),
  createdAt: row.created_at
}));

module.exports = {
  cleanupExpiredChallenges,
  createAuthChallenge,
  getAuthChallengeById,
  invalidateActiveChallenges,
  markAuthChallengeUsed,
  incrementAuthChallengeAttempt,
  updateAuthChallengeAttempts,
  addSecurityAuditEvent,
  countRecentSecurityEvents,
  listRecentSecurityEvents
};
