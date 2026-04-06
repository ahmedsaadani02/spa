const { getEmployeeAuthRowById } = require('../repositories/employees.runtime.repository');
const { toAppUser } = require('./auth-session.service');

const createSessionResolver = ({ sessions, getDb }) => async (token) => {
  if (!token) return null;

  const session = sessions.get(token);
  if (!session?.userId) {
    return null;
  }

  const row = await getEmployeeAuthRowById(getDb(), session.userId);
  const user = toAppUser(row);
  if (!user || !user.isActive) {
    sessions.delete(token);
    return null;
  }

  return user;
};

module.exports = { createSessionResolver };
