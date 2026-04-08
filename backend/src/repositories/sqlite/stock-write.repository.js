const { randomUUID } = require('crypto');

const toSafeQty = (qty) => Math.max(0, Number(qty) || 0);
const normalizeMovementReason = (reason) => (typeof reason === 'string' ? reason.trim() : '');

const getActiveProduct = (db, productId) => db.prepare(`
  SELECT id
  FROM products
  WHERE id = ?
    AND COALESCE(is_archived, 0) = 0
    AND COALESCE(is_deleted, 0) = 0
  LIMIT 1
`).get(productId);

const updateProductTimestamp = (db, productId) => {
  db.prepare('UPDATE products SET last_updated = ? WHERE id = ?')
    .run(new Date().toISOString(), productId);
};

const getCurrentStockQty = (db, productId, color) => {
  const current = db.prepare('SELECT qty FROM stock WHERE product_id = ? AND color = ?')
    .get(productId, color);
  return Number(current?.qty ?? 0) || 0;
};

const syncVariantStock = (db, productId, color, qty) => {
  const safeQty = toSafeQty(qty);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
    VALUES (
      lower(hex(randomblob(16))),
      @productId,
      @color,
      COALESCE((SELECT price FROM product_variants WHERE product_id = @productId AND color = @color), COALESCE((SELECT price_ttc FROM products WHERE id = @productId), 0)),
      @stock,
      @updatedAt
    )
    ON CONFLICT(product_id, color) DO UPDATE SET
      stock = excluded.stock,
      updated_at = excluded.updated_at
  `).run({ productId, color, stock: safeQty, updatedAt: now });
};

const hasMovementsTable = (db) => !!db.prepare(`
  SELECT 1
  FROM sqlite_master
  WHERE type = 'table' AND name = ?
  LIMIT 1
`).get('movements');

const getMovementColumnSet = (db) => {
  if (!hasMovementsTable(db)) {
    return new Set();
  }

  return new Set(
    db.prepare('PRAGMA table_info(movements)').all().map((column) => column.name)
  );
};

const insertMovementAudit = (db, movement, currentUser) => {
  const movementColumns = getMovementColumnSet(db);
  if (!movementColumns.size) {
    throw new Error('movements table is missing');
  }

  const actorName = currentUser?.nom || currentUser?.username || 'unknown';
  const payload = {
    id: movement.id || randomUUID(),
    product_id: movement.itemId,
    reference: movement.reference ?? null,
    label: movement.label ?? null,
    category: movement.category ?? null,
    serie: movement.serie ?? null,
    color: movement.color,
    type: movement.type,
    delta: Number(movement.delta) || 0,
    before: Number(movement.before) || 0,
    after: Number(movement.after) || 0,
    reason: typeof movement.reason === 'string' ? movement.reason.trim() : '',
    actor: actorName,
    at: movement.at ?? new Date().toISOString()
  };

  const columns = [
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
    payload.employee_id = currentUser?.id ?? null;
    columns.push('employee_id');
  }

  if (movementColumns.has('employee_name')) {
    payload.employee_name = actorName;
    columns.push('employee_name');
  }

  if (movementColumns.has('username')) {
    payload.username = currentUser?.username ?? null;
    columns.push('username');
  }

  db.prepare(`
    INSERT INTO movements (${columns.join(', ')})
    VALUES (${columns.map((column) => `@${column}`).join(', ')})
  `).run(payload);
};

const normalizeMovementType = (type, signedDelta) => {
  if (type === 'IN' || type === 'OUT' || type === 'ADJUST') {
    return type;
  }

  return signedDelta >= 0 ? 'IN' : 'OUT';
};

const setStockQty = (db, productId, color, qty) => {
  if (!getActiveProduct(db, productId)) {
    return false;
  }

  const safeQty = toSafeQty(qty);
  db.prepare(`
    INSERT INTO stock (product_id, color, qty)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id, color) DO UPDATE SET qty = excluded.qty
  `).run(productId, color, safeQty);

  syncVariantStock(db, productId, color, safeQty);
  updateProductTimestamp(db, productId);
  return true;
};

const incrementStockQty = (db, productId, color, delta) => {
  if (!getActiveProduct(db, productId)) {
    return false;
  }

  const nextQty = toSafeQty(getCurrentStockQty(db, productId, color) + (Number(delta) || 0));
  db.prepare(`
    INSERT INTO stock (product_id, color, qty)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id, color) DO UPDATE SET qty = excluded.qty
  `).run(productId, color, nextQty);

  syncVariantStock(db, productId, color, nextQty);
  updateProductTimestamp(db, productId);
  return true;
};

const applyStockMovement = (db, movement, currentUser) => {
  if (!movement || !movement.itemId || !movement.color) {
    return false;
  }

  const product = db.prepare(`
    SELECT id, reference, label, category, serie
    FROM products
    WHERE id = ?
      AND COALESCE(is_archived, 0) = 0
    LIMIT 1
  `).get(movement.itemId);

  if (!product) {
    return false;
  }

  const rawDelta = Number(movement.delta) || 0;
  let signedDelta = rawDelta;
  if (movement.type === 'IN') {
    signedDelta = Math.abs(rawDelta);
  } else if (movement.type === 'OUT') {
    signedDelta = -Math.abs(rawDelta);
  }

  const beforeQty = getCurrentStockQty(db, movement.itemId, movement.color);
  const afterQty = toSafeQty(beforeQty + signedDelta);
  const appliedDelta = afterQty - beforeQty;
  const movementType = normalizeMovementType(movement.type, appliedDelta);

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO stock (product_id, color, qty)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, color) DO UPDATE SET qty = excluded.qty
    `).run(movement.itemId, movement.color, afterQty);

    syncVariantStock(db, movement.itemId, movement.color, afterQty);
    updateProductTimestamp(db, movement.itemId);
    insertMovementAudit(db, {
      ...movement,
      id: movement.id || randomUUID(),
      reference: movement.reference ?? product.reference ?? null,
      label: movement.label ?? product.label ?? null,
      category: movement.category ?? product.category ?? null,
      serie: movement.serie ?? product.serie ?? null,
      type: movementType,
      delta: appliedDelta,
      before: beforeQty,
      after: afterQty,
      reason: normalizeMovementReason(movement.reason),
      at: movement.at ?? new Date().toISOString()
    }, currentUser);
  });

  tx();
  return true;
};

module.exports = {
  setStockQty,
  incrementStockQty,
  applyStockMovement
};
