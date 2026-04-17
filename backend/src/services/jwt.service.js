const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

/**
 * Sign a new JWT for an authenticated user.
 * Payload: { sub: userId, role, sid: sessionId }
 * Expiry: 8 hours — survives a full working day without re-login.
 */
const createJwt = (userId, role) => {
  const sid = crypto.randomUUID?.() ?? crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { sub: userId, role, sid },
    getSecret(),
    { algorithm: 'HS256', expiresIn: '8h' }
  );
};

/**
 * Verify a JWT and return the decoded payload, or null if invalid / expired.
 * Never throws — callers treat null as "unauthenticated".
 */
const verifyJwt = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }
};

module.exports = { createJwt, verifyJwt };
