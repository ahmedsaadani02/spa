const sqliteRepository = require('./auth-security.repository');
const postgresRepository = require('./postgres/auth-security.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('auth-security');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('auth-security');
    return true;
  }
  return false;
};

module.exports = {
  cleanupExpiredChallenges(db) {
    return usePostgres() ? postgresRepository.cleanupExpiredChallenges(db) : sqliteRepository.cleanupExpiredChallenges(db);
  },
  createAuthChallenge(db, payload) {
    return usePostgres() ? postgresRepository.createAuthChallenge(db, payload) : sqliteRepository.createAuthChallenge(db, payload);
  },
  getAuthChallengeById(db, challengeId) {
    return usePostgres() ? postgresRepository.getAuthChallengeById(db, challengeId) : sqliteRepository.getAuthChallengeById(db, challengeId);
  },
  invalidateActiveChallenges(db, userId, purpose) {
    return usePostgres()
      ? postgresRepository.invalidateActiveChallenges(db, userId, purpose)
      : sqliteRepository.invalidateActiveChallenges(db, userId, purpose);
  },
  markAuthChallengeUsed(db, challengeId) {
    return usePostgres()
      ? postgresRepository.markAuthChallengeUsed(db, challengeId)
      : sqliteRepository.markAuthChallengeUsed(db, challengeId);
  },
  incrementAuthChallengeAttempt(db, challengeId) {
    return usePostgres()
      ? postgresRepository.incrementAuthChallengeAttempt(db, challengeId)
      : sqliteRepository.incrementAuthChallengeAttempt(db, challengeId);
  },
  updateAuthChallengeAttempts(db, challengeId, attemptsCount) {
    return usePostgres()
      ? postgresRepository.updateAuthChallengeAttempts(db, challengeId, attemptsCount)
      : sqliteRepository.updateAuthChallengeAttempts(db, challengeId, attemptsCount);
  },
  addSecurityAuditEvent(db, payload) {
    return usePostgres() ? postgresRepository.addSecurityAuditEvent(db, payload) : sqliteRepository.addSecurityAuditEvent(db, payload);
  },
  countRecentSecurityEvents(db, filter) {
    return usePostgres()
      ? postgresRepository.countRecentSecurityEvents(db, filter)
      : sqliteRepository.countRecentSecurityEvents(db, filter);
  },
  listRecentSecurityEvents(db, limit) {
    return usePostgres()
      ? postgresRepository.listRecentSecurityEvents(db, limit)
      : sqliteRepository.listRecentSecurityEvents(db, limit);
  }
};
