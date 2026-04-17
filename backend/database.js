/**
 * Legacy database stub — application is fully on PostgreSQL.
 * This module remains for compatibility with server.js which passes `db`
 * to legacy-ipc handlers; all active code paths use the postgres repositories.
 */
const nullDb = {
  prepare: () => ({ run: () => {}, get: () => null, all: () => [] }),
  exec: () => {},
  pragma: () => {},
  close: () => {}
};

module.exports = nullDb;
