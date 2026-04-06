const crypto = require('crypto');
const { one, many, exec } = require('./shared');

const createId = () => crypto.randomUUID?.() ?? `auth_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();

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

const cleanupExpiredChallenges = async () => {
  await exec(`
    DELETE FROM auth_challenges
    WHERE used_at IS NOT NULL
       OR expires_at < (NOW() - INTERVAL '2 days')
  `);
};

const createAuthChallenge = async (_db, payload) => {
  const now = nowIso();
  const id = payload.id || createId();

  await exec(
    `
      INSERT INTO auth_challenges (
        id, user_id, purpose, code_hash, expires_at, used_at,
        attempts_count, max_attempts, created_at, requested_ip, requested_user_agent
      ) VALUES (
        $1, $2, $3, $4, $5, NULL,
        0, $6, $7, $8, $9
      )
    `,
    [
      id,
      payload.userId,
      payload.purpose,
      payload.codeHash,
      payload.expiresAt,
      Number(payload.maxAttempts ?? 5) || 5,
      now,
      payload.requestedIp ?? null,
      payload.requestedUserAgent ?? null
    ]
  );

  return getAuthChallengeById(null, id);
};

const getAuthChallengeById = async (_db, challengeId) => {
  if (!challengeId) return null;
  const row = await one(
    `
      SELECT
        id, user_id, purpose, code_hash, expires_at, used_at,
        attempts_count, max_attempts, created_at, requested_ip, requested_user_agent
      FROM auth_challenges
      WHERE id = $1
      LIMIT 1
    `,
    [challengeId]
  );
  return rowToChallenge(row);
};

const invalidateActiveChallenges = async (_db, userId, purpose) => {
  await exec(
    `
      UPDATE auth_challenges
      SET used_at = $1
      WHERE user_id = $2
        AND purpose = $3
        AND used_at IS NULL
        AND expires_at >= NOW()
    `,
    [nowIso(), userId, purpose]
  );
};

const markAuthChallengeUsed = async (_db, challengeId) => {
  const result = await exec(
    `
      UPDATE auth_challenges
      SET used_at = $1
      WHERE id = $2
        AND used_at IS NULL
    `,
    [nowIso(), challengeId]
  );
  return Number(result.rowCount ?? 0) > 0;
};

const incrementAuthChallengeAttempt = async (_db, challengeId) => {
  await exec(
    `
      UPDATE auth_challenges
      SET attempts_count = attempts_count + 1
      WHERE id = $1
    `,
    [challengeId]
  );
  return getAuthChallengeById(null, challengeId);
};

const updateAuthChallengeAttempts = async (_db, challengeId, attemptsCount) => {
  await exec(
    `
      UPDATE auth_challenges
      SET attempts_count = $1
      WHERE id = $2
    `,
    [Number(attemptsCount) || 0, challengeId]
  );
};

const addSecurityAuditEvent = async (_db, payload) => {
  const id = payload.id || createId();
  await exec(
    `
      INSERT INTO security_audit_log (
        id, user_id, event_type, email_attempted, success,
        ip, user_agent, details, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9
      )
    `,
    [
      id,
      payload.userId ?? null,
      payload.eventType,
      payload.emailAttempted ?? null,
      !!payload.success,
      payload.ip ?? null,
      payload.userAgent ?? null,
      payload.details ?? null,
      payload.createdAt ?? nowIso()
    ]
  );
};

const countRecentSecurityEvents = async (_db, filter) => {
  const row = await one(
    `
      SELECT COUNT(*) AS total
      FROM security_audit_log
      WHERE event_type = $1
        AND created_at >= $2
        AND ($3::text IS NULL OR email_attempted = $3)
        AND ($4::text IS NULL OR ip = $4)
    `,
    [filter.eventType, filter.since, filter.emailAttempted ?? null, filter.ip ?? null]
  );

  return Number(row?.total ?? 0) || 0;
};

const listRecentSecurityEvents = async (_db, limit = 100) => {
  const rows = await many(
    `
      SELECT
        id, user_id, event_type, email_attempted, success,
        ip, user_agent, details, created_at
      FROM security_audit_log
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [Number(limit) || 100]
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id ?? null,
    eventType: row.event_type,
    emailAttempted: row.email_attempted ?? null,
    success: row.success === true,
    ip: row.ip ?? null,
    userAgent: row.user_agent ?? null,
    details: row.details ?? null,
    createdAt: row.created_at
  }));
};

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
