const hasTable = (db, tableName) => !!db.prepare(`
  SELECT 1
  FROM sqlite_master
  WHERE type = 'table' AND name = ?
  LIMIT 1
`).get(tableName);

const getMovementColumnSet = (db) => {
  if (!hasTable(db, 'movements')) {
    return new Set();
  }

  const columns = db.prepare('PRAGMA table_info(movements)').all();
  return new Set(columns.map((column) => column.name));
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const listMovements = (db) => {
  const movementColumns = getMovementColumnSet(db);
  const actorSql = movementColumns.has('employee_name')
    ? 'COALESCE(employee_name, actor) AS actor'
    : 'actor';
  const employeeIdSql = movementColumns.has('employee_id')
    ? 'employee_id AS employeeId'
    : 'NULL AS employeeId';
  const usernameSql = movementColumns.has('username')
    ? 'username'
    : 'NULL AS username';

  return db.prepare(`
    SELECT
      id,
      product_id AS itemId,
      reference,
      label,
      category,
      serie,
      color,
      type,
      delta,
      before,
      after,
      reason,
      ${actorSql},
      ${employeeIdSql},
      ${usernameSql},
      at
    FROM movements
    ORDER BY at DESC
  `).all().map((row) => ({
    ...row,
    delta: toNumber(row.delta),
    before: toNumber(row.before),
    after: toNumber(row.after)
  }));
};

module.exports = {
  listMovements
};
