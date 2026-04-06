const sqliteRepository = require('./employees.repository');
const postgresRepository = require('./postgres/employees.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('employees');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('employees');
    return true;
  }
  return false;
};

module.exports = {
  rowToEmployee: sqliteRepository.rowToEmployee,
  listEmployees(db) {
    return usePostgres() ? postgresRepository.listEmployees(db) : sqliteRepository.listEmployees(db);
  },
  searchEmployees(db, query) {
    return usePostgres() ? postgresRepository.searchEmployees(db, query) : sqliteRepository.searchEmployees(db, query);
  },
  getEmployeeById(db, id) {
    return usePostgres() ? postgresRepository.getEmployeeById(db, id) : sqliteRepository.getEmployeeById(db, id);
  },
  getEmployeeByEmailNormalized(db, email) {
    return usePostgres()
      ? postgresRepository.getEmployeeByEmailNormalized(db, email)
      : sqliteRepository.getEmployeeByEmailNormalized(db, email);
  },
  createEmployee(db, payload) {
    return usePostgres() ? postgresRepository.createEmployee(db, payload) : sqliteRepository.createEmployee(db, payload);
  },
  updateEmployee(db, id, payload) {
    return usePostgres() ? postgresRepository.updateEmployee(db, id, payload) : sqliteRepository.updateEmployee(db, id, payload);
  },
  deleteEmployee(db, id) {
    return usePostgres() ? postgresRepository.deleteEmployee(db, id) : sqliteRepository.deleteEmployee(db, id);
  },
  setEmployeeActive(db, id, actif) {
    return usePostgres() ? postgresRepository.setEmployeeActive(db, id, actif) : sqliteRepository.setEmployeeActive(db, id, actif);
  },
  findEmployeeForAuthIdentity(db, identity) {
    return usePostgres()
      ? postgresRepository.findEmployeeForAuthIdentity(db, identity)
      : sqliteRepository.findEmployeeForAuthIdentity(db, identity);
  },
  findEmployeeForAuthByUsername(db, username) {
    return usePostgres()
      ? postgresRepository.findEmployeeForAuthByUsername(db, username)
      : sqliteRepository.findEmployeeForAuthByUsername(db, username);
  },
  getEmployeeAuthRowById(db, id) {
    return usePostgres()
      ? postgresRepository.getEmployeeAuthRowById(db, id)
      : sqliteRepository.getEmployeeAuthRowById(db, id);
  },
  updateEmployeeLastLogin(db, employeeId, loggedAt) {
    return usePostgres()
      ? postgresRepository.updateEmployeeLastLogin(db, employeeId, loggedAt)
      : sqliteRepository.updateEmployeeLastLogin(db, employeeId, loggedAt);
  },
  updateEmployeePasswordHash(db, employeeId, passwordHash, options) {
    return usePostgres()
      ? postgresRepository.updateEmployeePasswordHash(db, employeeId, passwordHash, options)
      : sqliteRepository.updateEmployeePasswordHash(db, employeeId, passwordHash, options);
  }
};
