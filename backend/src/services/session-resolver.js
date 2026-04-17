const { verifyJwt } = require('./jwt.service');
const { getEmployeeAuthRowById } = require('../repositories/employees.runtime.repository');
const { toAppUser } = require('./auth-session.service');

/**
 * Resolves a Bearer token to a live user object.
 *
 * Flow:
 *   1. Verify JWT signature + expiry → extract userId (payload.sub)
 *   2. Reload the employee row from DB (permissions always fresh)
 *   3. Build AppUser via toAppUser; reject if inactive
 *
 * `sessions` parameter removed — tokens are stateless JWT, no in-memory store needed.
 */
const createSessionResolver = ({ getDb }) => async (token) => {
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload?.sub) return null;

  const row = await getEmployeeAuthRowById(getDb(), payload.sub);
  const user = toAppUser(row);
  if (!user || !user.isActive) return null;

  return user;
};

module.exports = { createSessionResolver };
