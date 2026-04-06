const addMovement = (db, movement, currentUser) => {
  if (!movement || !movement.id) return false;
  if (!currentUser) return false;

  const hasMovementsTable = !!db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
    LIMIT 1
  `).get('movements');

  if (!hasMovementsTable) {
    return false;
  }

  const movementColumns = new Set(
    db.prepare('PRAGMA table_info(movements)').all().map((column) => column.name)
  );
  if (!movementColumns.size) {
    return false;
  }

  const actorName = currentUser.nom || currentUser.username || 'unknown';
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
    actor: actorName,
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
    payload.employee_name = actorName;
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

module.exports = {
  addMovement
};
