const { randomUUID } = require('crypto');
const { withClient } = require('../../db/postgres');

const toSafeQty = (qty) => Math.max(0, Number(qty) || 0);
const normalizeMovementReason = (reason) => (typeof reason === 'string' ? reason.trim() : '');

const withStockWriteTransaction = async (productId, color, resolveNextQty) => {
  return withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    const activeProductResult = await exec(
      `
        SELECT id
        FROM products
        WHERE id = $1
          AND COALESCE(is_archived, FALSE) = FALSE
          AND COALESCE(is_deleted, FALSE) = FALSE
        LIMIT 1
      `,
      [productId]
    );

    if (activeProductResult.rows.length === 0) {
      return false;
    }

    await client.query('BEGIN');
    try {
      const currentStockResult = await exec(
        `
          SELECT qty
          FROM stock
          WHERE product_id = $1 AND color = $2
          LIMIT 1
        `,
        [productId, color]
      );

      const currentQty = Number(currentStockResult.rows[0]?.qty ?? 0) || 0;
      const nextQty = toSafeQty(resolveNextQty(currentQty));
      const now = new Date().toISOString();

      await exec(
        `
          INSERT INTO stock (product_id, color, qty)
          VALUES ($1, $2, $3)
          ON CONFLICT(product_id, color) DO UPDATE SET qty = EXCLUDED.qty
        `,
        [productId, color, nextQty]
      );

      await exec(
        `
          INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
          VALUES (
            $1,
            $2,
            $3,
            COALESCE((SELECT price FROM product_variants WHERE product_id = $2 AND color = $3), COALESCE((SELECT price_ttc FROM products WHERE id = $2), 0)),
            $4,
            $5
          )
          ON CONFLICT(product_id, color) DO UPDATE SET
            stock = EXCLUDED.stock,
            updated_at = EXCLUDED.updated_at
        `,
        [randomUUID(), productId, color, nextQty, now]
      );

      await exec(
        `
          UPDATE products
          SET last_updated = $1
          WHERE id = $2
        `,
        [now, productId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

const setStockQty = async (_db, productId, color, qty) => withStockWriteTransaction(
  productId,
  color,
  () => qty
);

const incrementStockQty = async (_db, productId, color, delta) => withStockWriteTransaction(
  productId,
  color,
  (currentQty) => currentQty + (Number(delta) || 0)
);

const normalizeMovementType = (type, signedDelta) => {
  if (type === 'IN' || type === 'OUT' || type === 'ADJUST') {
    return type;
  }

  return signedDelta >= 0 ? 'IN' : 'OUT';
};

const applyStockMovement = async (_db, movement, currentUser) => {
  if (!movement || !movement.itemId || !movement.color) {
    return false;
  }

  return withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    const productResult = await exec(
      `
        SELECT id, reference, label, category, serie
        FROM products
        WHERE id = $1
          AND COALESCE(is_archived, FALSE) = FALSE
        LIMIT 1
      `,
      [movement.itemId]
    );

    const product = productResult.rows[0] ?? null;
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

    await client.query('BEGIN');
    try {
      const currentStockResult = await exec(
        `
          SELECT qty
          FROM stock
          WHERE product_id = $1 AND color = $2
          LIMIT 1
        `,
        [movement.itemId, movement.color]
      );

      const beforeQty = Number(currentStockResult.rows[0]?.qty ?? 0) || 0;
      const afterQty = toSafeQty(beforeQty + signedDelta);
      const appliedDelta = afterQty - beforeQty;
      const movementType = normalizeMovementType(movement.type, appliedDelta);
      const actorName = currentUser?.nom || currentUser?.username || 'unknown';
      const now = new Date().toISOString();

      await exec(
        `
          INSERT INTO stock (product_id, color, qty)
          VALUES ($1, $2, $3)
          ON CONFLICT(product_id, color) DO UPDATE SET qty = EXCLUDED.qty
        `,
        [movement.itemId, movement.color, afterQty]
      );

      await exec(
        `
          INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
          VALUES (
            $1,
            $2,
            $3,
            COALESCE((SELECT price FROM product_variants WHERE product_id = $2 AND color = $3), COALESCE((SELECT price_ttc FROM products WHERE id = $2), 0)),
            $4,
            $5
          )
          ON CONFLICT(product_id, color) DO UPDATE SET
            stock = EXCLUDED.stock,
            updated_at = EXCLUDED.updated_at
        `,
        [randomUUID(), movement.itemId, movement.color, afterQty, now]
      );

      await exec(
        `
          UPDATE products
          SET last_updated = $1
          WHERE id = $2
        `,
        [now, movement.itemId]
      );

      await exec(
        `
          INSERT INTO movements (
            id,
            product_id,
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
            actor,
            employee_id,
            employee_name,
            username,
            at
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17
          )
        `,
        [
          movement.id || randomUUID(),
          movement.itemId,
          movement.reference ?? product.reference ?? null,
          movement.label ?? product.label ?? null,
          movement.category ?? product.category ?? null,
          movement.serie ?? product.serie ?? null,
          movement.color,
          movementType,
          appliedDelta,
          beforeQty,
          afterQty,
          normalizeMovementReason(movement.reason),
          actorName,
          currentUser?.id ?? null,
          actorName,
          currentUser?.username ?? null,
          movement.at ?? now
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

module.exports = {
  setStockQty,
  incrementStockQty,
  applyStockMovement
};
