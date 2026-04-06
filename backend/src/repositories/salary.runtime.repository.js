const sqliteRepository = require('./salary.repository');
const postgresRepository = require('./postgres/salary.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('salary');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('salary');
    return true;
  }
  return false;
};

module.exports = {
  listAdvancesByEmployee(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.listAdvancesByEmployee(db, employeeId, month, year)
      : sqliteRepository.listAdvancesByEmployee(db, employeeId, month, year);
  },
  createAdvance(db, payload) {
    return usePostgres() ? postgresRepository.createAdvance(db, payload) : sqliteRepository.createAdvance(db, payload);
  },
  deleteAdvance(db, id) {
    return usePostgres() ? postgresRepository.deleteAdvance(db, id) : sqliteRepository.deleteAdvance(db, id);
  },
  getMonthlyAdvanceTotal(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.getMonthlyAdvanceTotal(db, employeeId, month, year)
      : sqliteRepository.getMonthlyAdvanceTotal(db, employeeId, month, year);
  },
  listBonusesByEmployee(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.listBonusesByEmployee(db, employeeId, month, year)
      : sqliteRepository.listBonusesByEmployee(db, employeeId, month, year);
  },
  createBonus(db, payload) {
    return usePostgres() ? postgresRepository.createBonus(db, payload) : sqliteRepository.createBonus(db, payload);
  },
  deleteBonus(db, id) {
    return usePostgres() ? postgresRepository.deleteBonus(db, id) : sqliteRepository.deleteBonus(db, id);
  },
  getMonthlyBonusTotal(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.getMonthlyBonusTotal(db, employeeId, month, year)
      : sqliteRepository.getMonthlyBonusTotal(db, employeeId, month, year);
  },
  listOvertimesByEmployee(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.listOvertimesByEmployee(db, employeeId, month, year)
      : sqliteRepository.listOvertimesByEmployee(db, employeeId, month, year);
  },
  createOvertime(db, payload) {
    return usePostgres() ? postgresRepository.createOvertime(db, payload) : sqliteRepository.createOvertime(db, payload);
  },
  deleteOvertime(db, id) {
    return usePostgres() ? postgresRepository.deleteOvertime(db, id) : sqliteRepository.deleteOvertime(db, id);
  },
  getMonthlyOvertimeTotals(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.getMonthlyOvertimeTotals(db, employeeId, month, year)
      : sqliteRepository.getMonthlyOvertimeTotals(db, employeeId, month, year);
  },
  getSalarySummary(db, employeeId, month, year) {
    return usePostgres()
      ? postgresRepository.getSalarySummary(db, employeeId, month, year)
      : sqliteRepository.getSalarySummary(db, employeeId, month, year);
  }
};
