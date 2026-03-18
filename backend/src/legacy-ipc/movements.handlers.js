const { assertPermission, getCurrentUser } = require('../services/auth-session.service');

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
  `).all();
};

const addMovement = (db, movement, currentUser) => {
  if (!movement || !movement.id) return false;
  if (!currentUser) return false;

  const movementColumns = getMovementColumnSet(db);
  if (!movementColumns.size) {
    return false;
  }

  const payload = {
    id: movement.id,
    product_id: movement.itemId,
    reference: movement.reference,
    label: movement.label,
    category: movement.category,
    serie: movement.serie,
    color: movement.color,
    type: movement.type,
    delta: Number(movement.delta) || 0,
    before: Number(movement.before) || 0,
    after: Number(movement.after) || 0,
    reason: movement.reason ?? '',
    actor: currentUser.nom || currentUser.username || 'unknown',
    at: movement.at ?? new Date().toISOString()
  };

  const insertColumns = [
    'id',
    'product_id',
    'reference',
    'label',
    'category',
    'serie',
    'color',
    'type',
    'delta',
    'before',
    'after',
    'reason',
    'actor',
    'at'
  ];

  if (movementColumns.has('employee_id')) {
    payload.employee_id = currentUser.id;
    insertColumns.push('employee_id');
  }

  if (movementColumns.has('employee_name')) {
    payload.employee_name = currentUser.nom || currentUser.username || 'unknown';
    insertColumns.push('employee_name');
  }

  if (movementColumns.has('username')) {
    payload.username = currentUser.username;
    insertColumns.push('username');
  }

  db.prepare(`
    INSERT INTO movements (${insertColumns.join(', ')})
    VALUES (${insertColumns.map((column) => `@${column}`).join(', ')})
  `).run(payload);
  return true;
};

const registerMovementsHandlers = (ipcMain, getDb) => {
  ipcMain.handle('movements:list', () => {
    try {
      assertPermission('viewHistory');
      return listMovements(getDb());
    } catch (error) {
      console.error('[movements:list] error', error);
      return [];
    }
  });

  ipcMain.handle('movements:add', (event, movement) => {
    try {
      assertPermission('manageStock');
      return addMovement(getDb(), movement, getCurrentUser());
    } catch (error) {
      console.error('[movements:add] error', error);
      return false;
    }
  });
};

module.exports = {
  registerMovementsHandlers,
  listMovements,
  addMovement
};
