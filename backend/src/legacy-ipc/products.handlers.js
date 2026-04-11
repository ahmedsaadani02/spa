const { randomUUID } = require('crypto');
const path = require('path');
const BrowserWindow = null;
const dialog = null;
const { assertPermission, getCurrentUser, hasPermission } = require('../services/auth-session.service');
const {
  PLACEHOLDER_IMAGE,
  normalizeStoredProductImageRef,
  resolveProductImageUrl,
  copyProductImageToStore,
  getProductsImagesDirectory
} = require('../utils/product-images');
const {
  listProducts: listProductsRead,
  listArchivedProducts: listArchivedProductsRead,
  getProductMetadata: getProductMetadataRead
} = require('../repositories/catalog-read.runtime.repository');
const { getPriceHistory: getPriceHistoryRead } = require('../repositories/price-history-read.runtime.repository');
const {
  upsertProductMetadata: upsertProductMetadataWrite,
  createProduct: createProductWrite,
  updateProduct: updateProductWrite,
  updateVariantPriceWithHistory: updateVariantPriceWithHistoryWrite,
  upsertProduct: upsertProductWrite,
  archiveProduct: archiveProductWrite,
  purgeProduct: purgeProductWrite,
  restoreProduct: restoreProductWrite
} = require('../repositories/product-write.runtime.repository');

const DEFAULT_COLORS = ['blanc', 'gris', 'noir'];
const PRIVILEGED_ROLES = new Set(['admin', 'developer', 'owner']);
const PRODUCT_METADATA_KINDS = new Set(['category', 'serie', 'color']);

const normalizeText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return (trimmed || fallback).normalize('NFC');
};

const normalizeTag = (value, fallback = '') => {
  const normalized = normalizeText(value, fallback)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || fallback;
};

const registerHandle = (ipcMain, channel, handler) => {
  try {
    ipcMain.removeHandler(channel);
  } catch {
    // ignore: channel may not be registered yet
  }
  ipcMain.handle(channel, handler);
};

const assertProductCatalogPermission = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!PRIVILEGED_ROLES.has(currentUser.role) && !hasPermission('manageStock')) {
    throw new Error('FORBIDDEN');
  }
  return currentUser;
};

const assertCanEditStockProduct = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!PRIVILEGED_ROLES.has(currentUser.role) && !hasPermission('editStockProduct')) {
    throw new Error('FORBIDDEN');
  }
  return currentUser;
};

const assertCanArchiveStockProduct = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!PRIVILEGED_ROLES.has(currentUser.role) && !hasPermission('archiveStockProduct')) {
    throw new Error('FORBIDDEN');
  }
  return currentUser;
};

const listProducts = (db) => db.prepare(`
  SELECT id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
  FROM products
  WHERE COALESCE(is_archived, 0) = 0
    AND COALESCE(is_deleted, 0) = 0
  ORDER BY reference
`).all();

const sortColors = (colors) => {
  const priority = new Map(DEFAULT_COLORS.map((color, index) => [color, index]));
  return [...colors].sort((a, b) => {
    const aOrder = priority.has(a) ? priority.get(a) : Number.MAX_SAFE_INTEGER;
    const bOrder = priority.has(b) ? priority.get(b) : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return Number(aOrder) - Number(bOrder);
    }
    return a.localeCompare(b);
  });
};

const listArchivedProducts = (db) => {
  const products = db.prepare(`
    SELECT id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, archived_at, price_ttc
    FROM products
    WHERE COALESCE(is_archived, 0) = 1
      AND COALESCE(is_deleted, 0) = 0
    ORDER BY datetime(archived_at) DESC, reference
  `).all();

  if (!products.length) {
    return [];
  }

  const colorRows = db.prepare(`
    SELECT product_id, color
    FROM stock
    WHERE product_id IN (
      SELECT id
      FROM products
      WHERE COALESCE(is_archived, 0) = 1
        AND COALESCE(is_deleted, 0) = 0
    )
    GROUP BY product_id, color
  `).all();

  const colorsByProduct = new Map();
  colorRows.forEach((row) => {
    if (!row?.product_id || !row?.color) return;
    const list = colorsByProduct.get(row.product_id) ?? [];
    list.push(String(row.color));
    colorsByProduct.set(row.product_id, list);
  });

  return products.map((row) => ({
    ...row,
    colors: sortColors(Array.from(new Set(colorsByProduct.get(row.id) ?? [])))
  }));
};

const getProductMetadata = (db) => {
  const categories = db.prepare(`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND trim(category) <> ''
      AND COALESCE(is_deleted, 0) = 0
    ORDER BY category
  `).all().map((row) => normalizeTag(row.category)).filter(Boolean);

  const series = db.prepare(`
    SELECT DISTINCT serie
    FROM products
    WHERE serie IS NOT NULL AND trim(serie) <> ''
      AND COALESCE(is_deleted, 0) = 0
    ORDER BY serie
  `).all().map((row) => normalizeTag(row.serie)).filter(Boolean);

  const stockColors = db.prepare(`
    SELECT DISTINCT color
    FROM stock
    WHERE color IS NOT NULL AND trim(color) <> ''
  `).all().map((row) => normalizeTag(row.color)).filter(Boolean);

  const variantColors = db.prepare(`
    SELECT DISTINCT color
    FROM product_variants
    WHERE color IS NOT NULL AND trim(color) <> ''
  `).all().map((row) => normalizeTag(row.color)).filter(Boolean);

  const metadataRows = db.prepare(`
    SELECT kind, value
    FROM product_catalog_metadata
    WHERE value IS NOT NULL AND trim(value) <> ''
  `).all();

  const metadataCategories = [];
  const metadataSeries = [];
  const metadataColors = [];

  metadataRows.forEach((row) => {
    const kind = normalizeMetadataKind(row?.kind);
    const value = normalizeTag(row?.value);
    if (!kind || !value) return;
    if (kind === 'category') {
      metadataCategories.push(value);
      return;
    }
    if (kind === 'serie') {
      metadataSeries.push(value);
      return;
    }
    if (kind === 'color') {
      metadataColors.push(value);
    }
  });

  const colors = sortColors(Array.from(new Set([
    ...DEFAULT_COLORS,
    ...stockColors,
    ...variantColors,
    ...metadataColors
  ])));

  return {
    categories: Array.from(new Set([...categories, ...metadataCategories])),
    series: Array.from(new Set([...series, ...metadataSeries])),
    colors
  };
};

const normalizeActor = (value) => {
  if (typeof value !== 'string') return 'erp-user';
  const trimmed = value.trim();
  return trimmed || 'erp-user';
};

const normalizeColor = (value) => {
  const color = normalizeTag(value);
  return color || null;
};

const normalizeColorArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }
  const uniqueColors = new Set();
  values.forEach((value) => {
    const color = normalizeColor(value);
    if (color) {
      uniqueColors.add(color);
    }
  });
  return sortColors(Array.from(uniqueColors));
};

const normalizeMetadataKind = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'series') return 'serie';
  return PRODUCT_METADATA_KINDS.has(normalized) ? normalized : null;
};

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

const toPrice = (value, { allowZero = false } = {}) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return null;
  if (allowZero ? next < 0 : next <= 0) return null;
  return next;
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
  const id = randomUUID();

  db.prepare(`
    INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, productId, color, fallbackPrice, fallbackStock, now);

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

const getPriceHistory = (db, productId, colorInput) => {
  if (!productId) return [];

  const color = normalizeColor(colorInput);
  if (!color) return [];

  return db.prepare(`
    SELECT id, product_id, color, old_price, new_price, changed_at, changed_by
    FROM price_history
    WHERE product_id = ? AND color = ?
    ORDER BY datetime(changed_at) DESC, rowid DESC
  `).all(productId, color).map((row) => ({
    id: row.id,
    productId: row.product_id,
    color: row.color,
    oldPrice: Number(row.old_price ?? 0) || 0,
    newPrice: Number(row.new_price ?? 0) || 0,
    changedAt: row.changed_at,
    changedBy: row.changed_by
  }));
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
    SELECT id, reference, label, is_archived, is_deleted
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);

  if (!existing) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }
  if (Number(existing.is_deleted ?? 0) === 1) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (Number(existing.is_archived ?? 0) === 1) {
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

  if (!existing) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }
  if (Number(existing.is_deleted ?? 0) === 1) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (Number(existing.is_archived ?? 0) === 0) {
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
  if (Number(existing.is_deleted ?? 0) === 1) {
    return { ok: false, message: 'PRODUCT_ALREADY_PURGED' };
  }

  if (Number(existing.is_archived ?? 0) !== 1) {
    return { ok: false, message: 'PRODUCT_PURGE_REQUIRES_ARCHIVED' };
  }

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    // Keep movement history intact while removing product from active/archive catalog views.
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

const upsertProduct = (db, product) => {
  if (!product || !product.id) return false;
  const stmt = db.prepare(`
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
  `);
  stmt.run({
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

const registerProductsHandlers = (ipcMain, getDb) => {
  console.log('[ipc] registering products handlers');

  registerHandle(ipcMain, 'products:list', async () => {
    try {
      assertPermission('viewStock');
      return (await listProductsRead(getDb())).map((row) => ({
        ...row,
        image_url: resolveProductImageUrl(row.image_url)
      }));
    } catch (error) {
      console.error('[products:list] error', error);
      return [];
    }
  });

  registerHandle(ipcMain, 'products:listArchived', async () => {
    try {
      assertProductCatalogPermission();
      return (await listArchivedProductsRead(getDb())).map((row) => ({
        ...row,
        image_url: resolveProductImageUrl(row.image_url)
      }));
    } catch (error) {
      console.error('[products:listArchived] error', error);
      return [];
    }
  });

  registerHandle(ipcMain, 'products:metadata', async () => {
    try {
      assertPermission('viewStock');
      return await getProductMetadataRead(getDb());
    } catch (error) {
      console.error('[products:metadata] error', error);
      return { categories: [], series: [], colors: DEFAULT_COLORS };
    }
  });

  registerHandle(ipcMain, 'products:addMetadata', async (event, kind, value) => {
    try {
      assertProductCatalogPermission();
      return await upsertProductMetadataWrite(getDb(), kind, value);
    } catch (error) {
      console.error('[products:addMetadata] error', error);
      return { ok: false, message: error.message || 'PRODUCT_METADATA_ADD_FAILED' };
    }
  });

  const selectImageHandler = async (event) => {
    try {
      console.log('[ipc] products:select-image invoked');
      assertProductCatalogPermission();
      if (!dialog) {
        return { canceled: true, error: 'IMAGE_SELECTION_UNAVAILABLE', message: 'Selection image indisponible hors Electron.' };
      }
      const browserWindow = BrowserWindow?.fromWebContents?.(event?.sender) || null;
      const result = await dialog.showOpenDialog(browserWindow, {
        title: 'Selectionner une image produit',
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }
        ]
      });

      if (result.canceled || !result.filePaths.length) {
        return { canceled: true };
      }

      const sourcePath = result.filePaths[0];
      const sourceName = path.basename(sourcePath, path.extname(sourcePath));
      const imageRef = copyProductImageToStore(sourcePath, sourceName);
      const storedFileName = path.basename(imageRef);
      const storedAbsolutePath = path.join(getProductsImagesDirectory(), storedFileName);
      const imageUrl = resolveProductImageUrl(imageRef);
      console.log('[ipc] products:select-image copied', {
        sourcePath,
        imageRef,
        storedAbsolutePath,
        imageUrl
      });
      return {
        canceled: false,
        imageRef,
        imageUrl,
        fileName: storedFileName
      };
    } catch (error) {
      const code = error?.message || 'IMAGE_SELECTION_FAILED';
      console.error('[products:select-image] error', error);
      if (code === 'INVALID_IMAGE_EXTENSION') {
        return { canceled: true, error: code, message: 'Format non supporte. Utilisez png, jpg, jpeg ou webp.' };
      }
      if (code === 'IMAGE_NOT_FOUND') {
        return { canceled: true, error: code, message: 'Le fichier selectionne est introuvable.' };
      }
      return { canceled: true, error: 'IMAGE_SELECTION_FAILED', message: 'Echec de la selection d image.' };
    }
  };
  registerHandle(ipcMain, 'products:select-image', selectImageHandler);
  console.log('[ipc] products:select-image registered');

  registerHandle(ipcMain, 'products:create', async (event, payload) => {
    try {
      console.log('[ipc] products:create invoked', {
        reference: payload?.reference,
        label: payload?.label,
        category: payload?.category,
        serie: payload?.serie,
        colors: payload?.colors
      });
      assertProductCatalogPermission();
      const result = await createProductWrite(getDb(), payload);
      if (!result?.ok) {
        console.warn('[products:create] rejected', result?.message, payload?.reference, payload?.label);
      }
      return result;
    } catch (error) {
      console.error('[products:create] error', error);
      return { ok: false, message: error.message || 'PRODUCT_CREATE_FAILED' };
    }
  });
  console.log('[ipc] products:create registered');

  registerHandle(ipcMain, 'products:update', async (event, productId, payload) => {
    try {
      assertCanEditStockProduct();
      return await updateProductWrite(getDb(), productId, payload);
    } catch (error) {
      console.error('[products:update] error', error);
      return { ok: false, message: error.message || 'PRODUCT_UPDATE_FAILED' };
    }
  });

  registerHandle(ipcMain, 'products:upsert', async (event, product) => {
    try {
      assertProductCatalogPermission();
      return await upsertProductWrite(getDb(), product);
    } catch (error) {
      console.error('[products:upsert] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'products:delete', async (event, id) => {
    try {
      assertCanArchiveStockProduct();
      return (await archiveProductWrite(getDb(), id)).ok;
    } catch (error) {
      console.error('[products:delete] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'products:archive', async (event, productId) => {
    try {
      assertCanArchiveStockProduct();
      console.log('[ipc] products:archive invoked', { productId });
      return await archiveProductWrite(getDb(), productId);
    } catch (error) {
      console.error('[products:archive] error', error);
      return { ok: false, message: error.message || 'PRODUCT_ARCHIVE_FAILED' };
    }
  });
  console.log('[ipc] products:archive registered');

  registerHandle(ipcMain, 'products:restore', async (event, productId) => {
    try {
      assertProductCatalogPermission();
      return await restoreProductWrite(getDb(), productId);
    } catch (error) {
      console.error('[products:restore] error', error);
      return { ok: false, message: error.message || 'PRODUCT_RESTORE_FAILED' };
    }
  });

  registerHandle(ipcMain, 'products:purge', async (event, productId) => {
    try {
      assertProductCatalogPermission();
      return await purgeProductWrite(getDb(), productId);
    } catch (error) {
      console.error('[products:purge] error', error);
      return { ok: false, message: error.message || 'PRODUCT_PURGE_FAILED' };
    }
  });

  registerHandle(ipcMain, 'products:updatePrice', async (event, productId, color, newPrice, changedBy) => {
    try {
      assertProductCatalogPermission();
      const db = getDb();
      const currentUser = getCurrentUser();
      const actor = currentUser?.username ?? changedBy;
      return await updateVariantPriceWithHistoryWrite(db, productId, color, newPrice, actor);
    } catch (error) {
      console.error('[products:updatePrice] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'products:priceHistory', async (event, productId, color) => {
    try {
      assertPermission('viewStock');
      return await getPriceHistoryRead(getDb(), productId, color);
    } catch (error) {
      console.error('[products:priceHistory] error', error);
      return [];
    }
  });

  registerHandle(ipcMain, 'products:restorePrice', async (event, productId, color, targetPrice, changedBy) => {
    try {
      assertProductCatalogPermission();
      const db = getDb();
      const currentUser = getCurrentUser();
      const actor = currentUser?.username ?? changedBy;
      return await updateVariantPriceWithHistoryWrite(db, productId, color, targetPrice, actor, { allowZero: true });
    } catch (error) {
      console.error('[products:restorePrice] error', error);
      return false;
    }
  });

  console.log('[ipc] products handlers ready');
};

module.exports = {
  registerProductsHandlers,
  listProducts,
  listArchivedProducts,
  getProductMetadata,
  upsertProductMetadata,
  createProduct,
  updateProduct,
  upsertProduct,
  archiveProduct,
  restoreProduct,
  purgeProduct,
  updateVariantPriceWithHistory,
  getPriceHistory,
  assertProductCatalogPermission
  ,assertCanEditStockProduct
  ,assertCanArchiveStockProduct
};
