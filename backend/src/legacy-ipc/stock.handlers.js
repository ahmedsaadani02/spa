const { randomUUID } = require('crypto');
const { listProducts } = require('./products.handlers');
const { assertPermission, getCurrentUser, hasPermission } = require('../services/auth-session.service');
const { resolveProductImageUrl } = require('../utils/product-images');

const getStockRows = (db) => db.prepare('SELECT product_id, color, qty FROM stock').all();

const buildStockItems = (db) => {
  const products = listProducts(db);
  const stockRows = getStockRows(db);
  const stockMap = new Map();
  stockRows.forEach((row) => {
    const key = row.product_id;
    if (!stockMap.has(key)) {
      stockMap.set(key, {});
    }
    stockMap.get(key)[row.color] = row.qty;
  });

  return products.map((product) => ({
    id: product.id,
    reference: product.reference,
    label: product.label,
    description: product.description ?? '',
    category: product.category,
    serie: product.serie,
    unit: product.unit,
    imageUrl: resolveProductImageUrl(product.image_url),
    quantities: stockMap.get(product.id) ?? {},
    lowStockThreshold: product.low_stock_threshold,
    lastUpdated: product.last_updated ?? new Date().toISOString()
  }));
};

const updateProductTimestamp = (db, productId) => {
  db.prepare('UPDATE products SET last_updated = ? WHERE id = ?')
    .run(new Date().toISOString(), productId);
};

const getActiveProduct = (db, productId) => db.prepare(`
  SELECT id
  FROM products
  WHERE id = ?
    AND COALESCE(is_archived, 0) = 0
    AND COALESCE(is_deleted, 0) = 0
  LIMIT 1
`).get(productId);

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

const insertMovementAudit = (db, movement, currentUser) => {
  const movementColumns = getMovementColumnSet(db);
  if (!movementColumns.size) {
    throw new Error('movements table is missing');
  }

  const actorName = currentUser?.nom || currentUser?.username || 'unknown';
  const now = movement.at ?? new Date().toISOString();

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
    at: now
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

  const sql = `
    INSERT INTO movements (${columns.join(', ')})
    VALUES (${columns.map((column) => `@${column}`).join(', ')})
  `;
  db.prepare(sql).run(payload);
};

const syncVariantStock = (db, productId, color, qty) => {
  const safeQty = Math.max(0, Number(qty) || 0);
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

const setStockQty = (db, productId, color, qty) => {
  if (!getActiveProduct(db, productId)) {
    return false;
  }
  const safeQty = Math.max(0, Number(qty) || 0);
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
  const current = db.prepare('SELECT qty FROM stock WHERE product_id = ? AND color = ?')
    .get(productId, color);
  const next = Math.max(0, (Number(current?.qty ?? 0) || 0) + (Number(delta) || 0));
  db.prepare(`
    INSERT INTO stock (product_id, color, qty)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id, color) DO UPDATE SET qty = excluded.qty
  `).run(productId, color, next);
  syncVariantStock(db, productId, color, next);
  updateProductTimestamp(db, productId);
  return true;
};

const normalizeMovementType = (type, signedDelta) => {
  if (type === 'IN' || type === 'OUT' || type === 'ADJUST') {
    return type;
  }
  return signedDelta >= 0 ? 'IN' : 'OUT';
};

const assertAnyPermission = (permissionKeys) => {
  const allowed = permissionKeys.some((permissionKey) => hasPermission(permissionKey));
  if (!allowed) {
    throw new Error('FORBIDDEN');
  }
};

const inferMovementPermission = (movement) => {
  const movementType = String(movement?.type ?? '').trim().toUpperCase();
  if (movementType === 'ADJUST') return 'adjustStock';
  if (movementType === 'OUT') return 'removeStock';
  if (movementType === 'IN') return 'addStock';
  const signedDelta = Number(movement?.delta ?? 0);
  return signedDelta < 0 ? 'removeStock' : 'addStock';
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

  const current = db.prepare('SELECT qty FROM stock WHERE product_id = ? AND color = ?')
    .get(movement.itemId, movement.color);
  const beforeQty = Number(current?.qty ?? 0) || 0;
  const afterQty = Math.max(0, beforeQty + signedDelta);
  const appliedDelta = afterQty - beforeQty;
  const movementType = normalizeMovementType(movement.type, appliedDelta);

  const tx = db.transaction(() => {
    setStockQty(db, movement.itemId, movement.color, afterQty);
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
      reason: movement.reason ?? 'stock:update',
      at: movement.at ?? new Date().toISOString()
    }, currentUser);
  });

  tx();
  return true;
};

const registerStockHandlers = (ipcMain, getDb) => {
  ipcMain.handle('stock:getAll', () => {
    try {
      assertPermission('viewStock');
      return getStockRows(getDb());
    } catch (error) {
      console.error('[stock:getAll] error', error);
      return [];
    }
  });

  ipcMain.handle('stock:items', () => {
    try {
      assertPermission('viewStock');
      return buildStockItems(getDb());
    } catch (error) {
      console.error('[stock:items] error', error);
      return [];
    }
  });

  ipcMain.handle('stock:setQty', (event, productId, color, qty) => {
    try {
      assertAnyPermission(['adjustStock', 'manageStock']);
      if (!productId || !color) return false;
      return setStockQty(getDb(), productId, color, qty);
    } catch (error) {
      console.error('[stock:setQty] error', error);
      return false;
    }
  });

  ipcMain.handle('stock:increment', (event, productId, color, delta) => {
    try {
      assertAnyPermission(['addStock', 'manageStock']);
      if (!productId || !color) return false;
      return incrementStockQty(getDb(), productId, color, delta);
    } catch (error) {
      console.error('[stock:increment] error', error);
      return false;
    }
  });

  ipcMain.handle('stock:decrement', (event, productId, color, delta) => {
    try {
      assertAnyPermission(['removeStock', 'manageStock']);
      if (!productId || !color) return false;
      const safeDelta = Math.abs(Number(delta) || 0);
      return incrementStockQty(getDb(), productId, color, -safeDelta);
    } catch (error) {
      console.error('[stock:decrement] error', error);
      return false;
    }
  });

  ipcMain.handle('stock:applyMovement', (event, movement) => {
    try {
      assertAnyPermission([inferMovementPermission(movement), 'manageStock']);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return false;
      }
      return applyStockMovement(getDb(), movement, currentUser);
    } catch (error) {
      console.error('[stock:applyMovement] error', error);
      return false;
    }
  });
};

module.exports = {
  registerStockHandlers,
  getStockRows,
  buildStockItems,
  setStockQty,
  incrementStockQty,
  applyStockMovement,
  assertAnyPermission,
  inferMovementPermission
};
