const { randomUUID } = require('crypto');
const {
  PLACEHOLDER_IMAGE,
  normalizeStoredProductImageRef,
  normalizeText,
  normalizeTag,
  normalizeMetadataKind,
  normalizeActor,
  sortColors,
  normalizeColor,
  normalizeColorArray,
  isTrue
} = require('../shared/product-write.shared');

const upsertProductMetadata = (db, kind, value, now = new Date().toISOString()) => {
  const normalizedKind = normalizeMetadataKind(kind);
  if (!normalizedKind) {
    return { ok: false, message: 'PRODUCT_METADATA_KIND_INVALID' };
  }

  const normalizedValue = normalizeTag(value);
  if (!normalizedValue) {
    return { ok: false, message: 'PRODUCT_METADATA_VALUE_REQUIRED' };
  }

  const existing = db.prepare(`
    SELECT 1
    FROM product_catalog_metadata
    WHERE kind = ? AND value = ?
    LIMIT 1
  `).get(normalizedKind, normalizedValue);

  db.prepare(`
    INSERT INTO product_catalog_metadata (kind, value, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(kind, value) DO UPDATE SET
      updated_at = excluded.updated_at
  `).run(normalizedKind, normalizedValue, now, now);

  return {
    ok: true,
    kind: normalizedKind,
    value: normalizedValue,
    alreadyExists: !!existing
  };
};

const upsertProduct = (db, product) => {
  if (!product || !product.id) return false;

  db.prepare(`
    INSERT INTO products (
      id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
    ) VALUES (
      @id, @reference, @label, @description, @category, @serie, @unit, @image_url, @low_stock_threshold, @last_updated, @price_ttc
    )
    ON CONFLICT(id) DO UPDATE SET
      reference = excluded.reference,
      label = excluded.label,
      description = excluded.description,
      category = excluded.category,
      serie = excluded.serie,
      unit = excluded.unit,
      image_url = excluded.image_url,
      low_stock_threshold = excluded.low_stock_threshold,
      last_updated = excluded.last_updated,
      price_ttc = excluded.price_ttc
  `).run({
    id: product.id,
    reference: normalizeText(product.reference),
    label: normalizeText(product.label),
    description: normalizeText(product.description ?? ''),
    category: normalizeTag(product.category),
    serie: normalizeTag(product.serie),
    unit: normalizeText(product.unit, 'piece'),
    image_url: normalizeStoredProductImageRef(product.image_url) || PLACEHOLDER_IMAGE,
    low_stock_threshold: Math.max(0, Number(product.low_stock_threshold ?? 0) || 0),
    last_updated: product.last_updated ?? new Date().toISOString(),
    price_ttc: Number.isFinite(product.price_ttc) ? Number(product.price_ttc) : null
  });

  return true;
};

const toPrice = (value, { allowZero = false } = {}) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return null;
  if (allowZero ? next < 0 : next <= 0) return null;
  return next;
};

const getProductColors = (db, productId) => {
  const stockColors = db.prepare(`
    SELECT color
    FROM stock
    WHERE product_id = ?
    GROUP BY color
  `).all(productId).map((row) => normalizeColor(row.color)).filter(Boolean);

  if (stockColors.length) {
    return sortColors(Array.from(new Set(stockColors)));
  }

  const variantColors = db.prepare(`
    SELECT color
    FROM product_variants
    WHERE product_id = ?
    GROUP BY color
  `).all(productId).map((row) => normalizeColor(row.color)).filter(Boolean);

  return sortColors(Array.from(new Set(variantColors)));
};

const getVariantRow = (db, productId, color) => db.prepare(`
  SELECT id, product_id, color, price, stock
  FROM product_variants
  WHERE product_id = ? AND color = ?
  LIMIT 1
`).get(productId, color);

const ensureVariantRow = (db, productId, color) => {
  const existing = getVariantRow(db, productId, color);
  if (existing) return existing;

  const product = db.prepare('SELECT id, price_ttc FROM products WHERE id = ?').get(productId);
  if (!product) return null;

  const stockRow = db.prepare('SELECT qty FROM stock WHERE product_id = ? AND color = ?').get(productId, color);
  const now = new Date().toISOString();
  const fallbackPrice = Number(product.price_ttc ?? 0) || 0;
  const fallbackStock = Number(stockRow?.qty ?? 0) || 0;

  db.prepare(`
    INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), productId, color, fallbackPrice, fallbackStock, now);

  return getVariantRow(db, productId, color);
};

const recalcBaseProductPrice = (db, productId) => {
  const average = db.prepare(`
    SELECT AVG(NULLIF(price, 0)) AS avg_price
    FROM product_variants
    WHERE product_id = ?
  `).get(productId);

  const nextPrice = Number(average?.avg_price ?? 0) || 0;
  db.prepare(`
    UPDATE products
    SET price_ttc = ?, last_updated = ?
    WHERE id = ?
  `).run(nextPrice, new Date().toISOString(), productId);
};

const updateVariantPriceWithHistory = (db, productId, colorInput, nextPrice, changedBy = 'erp-user', options = {}) => {
  if (!productId) return false;

  const color = normalizeColor(colorInput);
  if (!color) return false;

  const validatedPrice = toPrice(nextPrice, { allowZero: !!options.allowZero });
  if (validatedPrice === null) return false;

  const existingVariant = ensureVariantRow(db, productId, color);
  if (!existingVariant) return false;

  const previousPrice = Number(existingVariant.price ?? 0) || 0;
  if (Math.abs(previousPrice - validatedPrice) < 0.000001) return true;

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE product_variants
      SET price = ?, updated_at = ?
      WHERE product_id = ? AND color = ?
    `).run(validatedPrice, now, productId, color);

    db.prepare(`
      INSERT INTO price_history (id, product_id, color, old_price, new_price, changed_at, changed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), productId, color, previousPrice, validatedPrice, now, normalizeActor(changedBy));

    recalcBaseProductPrice(db, productId);
  });

  tx();
  return true;
};

const createProduct = (db, payload) => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, message: 'INVALID_PAYLOAD' };
  }

  const label = normalizeText(payload.label);
  if (!label) {
    return { ok: false, message: 'PRODUCT_LABEL_REQUIRED' };
  }

  const category = normalizeTag(payload.category, 'accessoire') || 'accessoire';
  const serie = normalizeTag(payload.serie, '40') || '40';
  const unit = normalizeText(payload.unit, 'piece');
  const reference = normalizeText(payload.reference, label);
  const description = normalizeText(payload.description ?? '', '');
  const colors = normalizeColorArray(payload.colors);

  if (!colors.length) {
    return { ok: false, message: 'PRODUCT_COLORS_REQUIRED' };
  }

  const lowStockThreshold = Math.max(0, Number(payload.lowStockThreshold ?? 0) || 0);
  const priceTtc = Number.isFinite(Number(payload.priceTtc)) ? Number(payload.priceTtc) : 0;
  const normalizedImageRef = normalizeStoredProductImageRef(payload.imageRef ?? payload.image_url) || PLACEHOLDER_IMAGE;
  const now = new Date().toISOString();
  const id = randomUUID();

  const existingReference = db.prepare(`
    SELECT id
    FROM products
    WHERE lower(reference) = lower(?)
      AND COALESCE(is_deleted, 0) = 0
    LIMIT 1
  `).get(reference);
  if (existingReference) {
    return { ok: false, message: 'PRODUCT_REFERENCE_ALREADY_EXISTS' };
  }

  const tx = db.transaction(() => {
    upsertProductMetadata(db, 'category', category, now);
    upsertProductMetadata(db, 'serie', serie, now);

    db.prepare(`
      INSERT INTO products (
        id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
      ) VALUES (
        @id, @reference, @label, @description, @category, @serie, @unit, @image_url, @low_stock_threshold, @last_updated, @price_ttc
      )
    `).run({
      id,
      reference,
      label,
      description,
      category,
      serie,
      unit,
      image_url: normalizedImageRef,
      low_stock_threshold: lowStockThreshold,
      last_updated: now,
      price_ttc: priceTtc
    });

    const insertStockStmt = db.prepare(`
      INSERT INTO stock (product_id, color, qty)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, color) DO NOTHING
    `);
    const insertVariantStmt = db.prepare(`
      INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
      VALUES (?, ?, ?, ?, 0, ?)
      ON CONFLICT(product_id, color) DO UPDATE SET
        updated_at = excluded.updated_at
    `);

    colors.forEach((color) => {
      upsertProductMetadata(db, 'color', color, now);
      insertStockStmt.run(id, color, 0);
      insertVariantStmt.run(randomUUID(), id, color, priceTtc, now);
    });
  });

  tx();
  return { ok: true, id };
};

const updateProduct = (db, productId, payload) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, message: 'INVALID_PAYLOAD' };
  }

  const existing = db.prepare(`
    SELECT id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, price_ttc
    FROM products
    WHERE id = ?
      AND COALESCE(is_archived, 0) = 0
      AND COALESCE(is_deleted, 0) = 0
    LIMIT 1
  `).get(productId);
  if (!existing) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  const label = normalizeText(payload.label ?? existing.label);
  if (!label) {
    return { ok: false, message: 'PRODUCT_LABEL_REQUIRED' };
  }

  const reference = normalizeText(payload.reference ?? existing.reference, label);
  const duplicate = db.prepare(`
    SELECT id
    FROM products
    WHERE lower(reference) = lower(?)
      AND id <> ?
      AND COALESCE(is_deleted, 0) = 0
    LIMIT 1
  `).get(reference, productId);
  if (duplicate) {
    return { ok: false, message: 'PRODUCT_REFERENCE_ALREADY_EXISTS' };
  }

  const category = normalizeTag(payload.category ?? existing.category, 'accessoire') || 'accessoire';
  const serie = normalizeTag(payload.serie ?? existing.serie, '40') || '40';
  const unit = normalizeText(payload.unit ?? existing.unit, 'piece');
  const description = normalizeText(payload.description ?? existing.description ?? '', '');
  const lowStockThreshold = Math.max(0, Number(payload.lowStockThreshold ?? existing.low_stock_threshold ?? 0) || 0);
  const imageRef = normalizeStoredProductImageRef(
    payload.imageRef ?? payload.image_url ?? existing.image_url
  ) || PLACEHOLDER_IMAGE;
  const priceTtc = Number.isFinite(Number(payload.priceTtc))
    ? Number(payload.priceTtc)
    : (Number(existing.price_ttc ?? 0) || 0);

  const currentColors = getProductColors(db, productId);
  const requestedColors = normalizeColorArray(payload.colors);
  const nextColors = requestedColors.length ? requestedColors : currentColors;
  if (!nextColors.length) {
    return { ok: false, message: 'PRODUCT_COLORS_REQUIRED' };
  }

  const removedColors = currentColors.filter((color) => !nextColors.includes(color));
  const addedColors = nextColors.filter((color) => !currentColors.includes(color));

  const blockedColor = removedColors.find((color) => {
    const row = db.prepare(`
      SELECT qty
      FROM stock
      WHERE product_id = ? AND color = ?
      LIMIT 1
    `).get(productId, color);
    return (Number(row?.qty ?? 0) || 0) > 0;
  });
  if (blockedColor) {
    return { ok: false, message: `PRODUCT_COLOR_HAS_STOCK:${blockedColor}` };
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    upsertProductMetadata(db, 'category', category, now);
    upsertProductMetadata(db, 'serie', serie, now);

    db.prepare(`
      UPDATE products
      SET
        reference = @reference,
        label = @label,
        description = @description,
        category = @category,
        serie = @serie,
        unit = @unit,
        image_url = @image_url,
        low_stock_threshold = @low_stock_threshold,
        price_ttc = @price_ttc,
        last_updated = @last_updated
      WHERE id = @id
    `).run({
      id: productId,
      reference,
      label,
      description,
      category,
      serie,
      unit,
      image_url: imageRef,
      low_stock_threshold: lowStockThreshold,
      price_ttc: priceTtc,
      last_updated: now
    });

    addedColors.forEach((color) => {
      upsertProductMetadata(db, 'color', color, now);
      db.prepare(`
        INSERT INTO stock (product_id, color, qty)
        VALUES (?, ?, 0)
        ON CONFLICT(product_id, color) DO NOTHING
      `).run(productId, color);

      db.prepare(`
        INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
        VALUES (?, ?, ?, ?, 0, ?)
        ON CONFLICT(product_id, color) DO UPDATE SET
          updated_at = excluded.updated_at
      `).run(randomUUID(), productId, color, priceTtc, now);
    });

    removedColors.forEach((color) => {
      db.prepare('DELETE FROM stock WHERE product_id = ? AND color = ?').run(productId, color);
      db.prepare('DELETE FROM product_variants WHERE product_id = ? AND color = ?').run(productId, color);
    });

    nextColors.forEach((color) => {
      upsertProductMetadata(db, 'color', color, now);
    });
  });

  tx();
  return {
    ok: true,
    id: productId,
    addedColors,
    removedColors
  };
};

const archiveProduct = (db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existing = db.prepare(`
    SELECT id, is_archived, is_deleted
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);

  if (!existing || isTrue(existing.is_deleted)) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (isTrue(existing.is_archived)) {
    return { ok: true, alreadyArchived: true };
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE products
    SET
      is_archived = 1,
      archived_at = ?,
      last_updated = ?
    WHERE id = ?
  `).run(now, now, productId);

  return { ok: true, id: productId };
};

const purgeProduct = (db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existing = db.prepare(`
    SELECT id, is_archived, is_deleted
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);
  if (!existing) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }
  if (isTrue(existing.is_deleted)) {
    return { ok: false, message: 'PRODUCT_ALREADY_PURGED' };
  }

  if (!isTrue(existing.is_archived)) {
    return { ok: false, message: 'PRODUCT_PURGE_REQUIRES_ARCHIVED' };
  }

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
    db.prepare('DELETE FROM price_history WHERE product_id = ?').run(productId);
    db.prepare('DELETE FROM stock WHERE product_id = ?').run(productId);
    db.prepare(`
      UPDATE products
      SET
        is_deleted = 1,
        is_archived = 1,
        deleted_at = ?,
        archived_at = COALESCE(archived_at, ?),
        last_updated = ?
      WHERE id = ?
    `).run(now, now, now, productId);
  });

  tx();
  return { ok: true, id: productId };
};

const restoreProduct = (db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existing = db.prepare(`
    SELECT id, is_archived, is_deleted
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);

  if (!existing || isTrue(existing.is_deleted)) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (!isTrue(existing.is_archived)) {
    return { ok: true, alreadyActive: true };
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE products
    SET
      is_archived = 0,
      archived_at = NULL,
      last_updated = ?
    WHERE id = ?
  `).run(now, productId);

  return { ok: true, id: productId };
};

module.exports = {
  upsertProductMetadata,
  createProduct,
  updateProduct,
  updateVariantPriceWithHistory,
  upsertProduct,
  archiveProduct,
  purgeProduct,
  restoreProduct
};
