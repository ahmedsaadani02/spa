const { randomUUID } = require('crypto');
const { query, withClient } = require('../../db/postgres');
const {
  PLACEHOLDER_IMAGE,
  normalizeStoredProductImageRef,
  isFullProductImageUrl,
  sanitizeImageInput,
  normalizeText,
  normalizeTag,
  normalizeMetadataKind,
  normalizeActor,
  sortColors,
  normalizeColor,
  normalizeColorArray,
  isTrue
} = require('../shared/product-write.shared');

const upsertProductMetadataWithExecutor = async (executor, kind, value, now = new Date().toISOString()) => {
  const normalizedKind = normalizeMetadataKind(kind);
  if (!normalizedKind) {
    return { ok: false, message: 'PRODUCT_METADATA_KIND_INVALID' };
  }

  const normalizedValue = normalizeTag(value);
  if (!normalizedValue) {
    return { ok: false, message: 'PRODUCT_METADATA_VALUE_REQUIRED' };
  }

  const existingResult = await executor(
    `
      SELECT 1
      FROM product_catalog_metadata
      WHERE kind = $1 AND value = $2
      LIMIT 1
    `,
    [normalizedKind, normalizedValue]
  );

  await executor(
    `
      INSERT INTO product_catalog_metadata (kind, value, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(kind, value) DO UPDATE SET
        updated_at = EXCLUDED.updated_at
    `,
    [normalizedKind, normalizedValue, now, now]
  );

  return {
    ok: true,
    kind: normalizedKind,
    value: normalizedValue,
    alreadyExists: existingResult.rows.length > 0
  };
};

const upsertProductMetadata = async (_db, kind, value, now = new Date().toISOString()) => (
  upsertProductMetadataWithExecutor((text, params) => query(text, params), kind, value, now)
);

const upsertProduct = async (_db, product) => {
  if (!product || !product.id) return false;

  // Sanitize image input - throws error if full URL
  let sanitizedImageUrl;
  try {
    sanitizedImageUrl = sanitizeImageInput(product.image_url);
  } catch (error) {
    console.error('[UPSERT_PRODUCT_IMAGE_SANITIZE_ERROR]', {
      message: error.message,
      productId: product.id,
      image_url: product.image_url
    });
    // For upsert, don't fail, just use null
    sanitizedImageUrl = null;
  }

  const normalizedImageRef = normalizeStoredProductImageRef(sanitizedImageUrl) || PLACEHOLDER_IMAGE;

  console.log('[UPSERT_PRODUCT_IMAGE_DEBUG]', {
    productId: product.id,
    original_image_url: product.image_url,
    sanitized: sanitizedImageUrl,
    normalized: normalizedImageRef,
    final_db_value: normalizedImageRef
  });

  await query(
    `
      INSERT INTO products (
        id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT(id) DO UPDATE SET
        reference = EXCLUDED.reference,
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        serie = EXCLUDED.serie,
        unit = EXCLUDED.unit,
        image_url = EXCLUDED.image_url,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        last_updated = EXCLUDED.last_updated,
        price_ttc = EXCLUDED.price_ttc
    `,
    [
      product.id,
      normalizeText(product.reference),
      normalizeText(product.label),
      normalizeText(product.description ?? ''),
      normalizeTag(product.category),
      normalizeTag(product.serie),
      normalizeText(product.unit, 'piece'),
      normalizedImageRef,
      Math.max(0, Number(product.low_stock_threshold ?? 0) || 0),
      product.last_updated ?? new Date().toISOString(),
      Number.isFinite(product.price_ttc) ? Number(product.price_ttc) : null
    ]
  );

  return true;
};

const toPrice = (value, { allowZero = false } = {}) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return null;
  if (allowZero ? next < 0 : next <= 0) return null;
  return next;
};

const getProductColors = async (executor, productId) => {
  const stockRows = await executor(
    `
      SELECT color
      FROM stock
      WHERE product_id = $1
      GROUP BY color
    `,
    [productId]
  );
  const stockColors = stockRows.rows.map((row) => normalizeColor(row.color)).filter(Boolean);
  if (stockColors.length) {
    return sortColors(Array.from(new Set(stockColors)));
  }

  const variantRows = await executor(
    `
      SELECT color
      FROM product_variants
      WHERE product_id = $1
      GROUP BY color
    `,
    [productId]
  );

  return sortColors(Array.from(new Set(
    variantRows.rows.map((row) => normalizeColor(row.color)).filter(Boolean)
  )));
};

const getVariantRow = async (executor, productId, color) => {
  const result = await executor(
    `
      SELECT id, product_id, color, price, stock
      FROM product_variants
      WHERE product_id = $1 AND color = $2
      LIMIT 1
    `,
    [productId, color]
  );
  return result.rows[0] ?? null;
};

const ensureVariantRow = async (executor, productId, color) => {
  const existing = await getVariantRow(executor, productId, color);
  if (existing) return existing;

  const productResult = await executor(
    'SELECT id, price_ttc FROM products WHERE id = $1 LIMIT 1',
    [productId]
  );
  const product = productResult.rows[0];
  if (!product) return null;

  const stockResult = await executor(
    'SELECT qty FROM stock WHERE product_id = $1 AND color = $2 LIMIT 1',
    [productId, color]
  );
  const stockRow = stockResult.rows[0];
  const now = new Date().toISOString();
  const fallbackPrice = Number(product.price_ttc ?? 0) || 0;
  const fallbackStock = Number(stockRow?.qty ?? 0) || 0;

  await executor(
    `
      INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(product_id, color) DO NOTHING
    `,
    [randomUUID(), productId, color, fallbackPrice, fallbackStock, now]
  );

  return getVariantRow(executor, productId, color);
};

const recalcBaseProductPrice = async (executor, productId) => {
  const averageResult = await executor(
    `
      SELECT AVG(NULLIF(price, 0)) AS avg_price
      FROM product_variants
      WHERE product_id = $1
    `,
    [productId]
  );

  const nextPrice = Number(averageResult.rows[0]?.avg_price ?? 0) || 0;
  await executor(
    `
      UPDATE products
      SET price_ttc = $1, last_updated = $2
      WHERE id = $3
    `,
    [nextPrice, new Date().toISOString(), productId]
  );
};

const updateVariantPriceWithHistory = async (_db, productId, colorInput, nextPrice, changedBy = 'erp-user', options = {}) => {
  if (!productId) return false;

  const color = normalizeColor(colorInput);
  if (!color) return false;

  const validatedPrice = toPrice(nextPrice, { allowZero: !!options.allowZero });
  if (validatedPrice === null) return false;

  return withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    await client.query('BEGIN');
    try {
      const existingVariant = await ensureVariantRow(exec, productId, color);
      if (!existingVariant) {
        await client.query('ROLLBACK');
        return false;
      }

      const previousPrice = Number(existingVariant.price ?? 0) || 0;
      if (Math.abs(previousPrice - validatedPrice) < 0.000001) {
        await client.query('COMMIT');
        return true;
      }

      const now = new Date().toISOString();

      await exec(
        `
          UPDATE product_variants
          SET price = $1, updated_at = $2
          WHERE product_id = $3 AND color = $4
        `,
        [validatedPrice, now, productId, color]
      );

      await exec(
        `
          INSERT INTO price_history (id, product_id, color, old_price, new_price, changed_at, changed_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [randomUUID(), productId, color, previousPrice, validatedPrice, now, normalizeActor(changedBy)]
      );

      await recalcBaseProductPrice(exec, productId);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

const createProduct = async (_db, payload) => {
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

  // Sanitize image input - throws error if full URL
  let sanitizedImageUrl;
  try {
    sanitizedImageUrl = sanitizeImageInput(payload.image_url) || sanitizeImageInput(payload.imageRef);
  } catch (error) {
    console.error('[CREATE_PRODUCT_IMAGE_SANITIZE_ERROR]', {
      message: error.message,
      payload: JSON.stringify(payload, null, 2)
    });
    return { ok: false, message: 'PRODUCT_IMAGE_URL_INVALID' };
  }

  const normalizedImageRef = normalizeStoredProductImageRef(sanitizedImageUrl) || PLACEHOLDER_IMAGE;

  console.log('[CREATE_PRODUCT_IMAGE_DEBUG]', {
    productId: id,
    original_image_url: payload.image_url,
    original_imageRef: payload.imageRef,
    sanitized: sanitizedImageUrl,
    normalized: normalizedImageRef,
    final_db_value: normalizedImageRef
  });
  const now = new Date().toISOString();
  const id = randomUUID();

  const existingReference = await query(
    `
      SELECT id
      FROM products
      WHERE lower(reference) = lower($1)
        AND COALESCE(is_deleted, FALSE) = FALSE
      LIMIT 1
    `,
    [reference]
  );
  if (existingReference.rows.length > 0) {
    return { ok: false, message: 'PRODUCT_REFERENCE_ALREADY_EXISTS' };
  }

  await withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    await client.query('BEGIN');
    try {
      await upsertProductMetadataWithExecutor(exec, 'category', category, now);
      await upsertProductMetadataWithExecutor(exec, 'serie', serie, now);

      await exec(
        `
          INSERT INTO products (
            id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `,
        [id, reference, label, description, category, serie, unit, normalizedImageRef, lowStockThreshold, now, priceTtc]
      );

      for (const color of colors) {
        await upsertProductMetadataWithExecutor(exec, 'color', color, now);
        await exec(
          `
            INSERT INTO stock (product_id, color, qty)
            VALUES ($1, $2, $3)
            ON CONFLICT(product_id, color) DO NOTHING
          `,
          [id, color, 0]
        );
        await exec(
          `
            INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
            VALUES ($1, $2, $3, $4, 0, $5)
            ON CONFLICT(product_id, color) DO UPDATE SET
              updated_at = EXCLUDED.updated_at
          `,
          [randomUUID(), id, color, priceTtc, now]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  return { ok: true, id };
};

const updateProduct = async (_db, productId, payload) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, message: 'INVALID_PAYLOAD' };
  }

  const existingResult = await query(
    `
      SELECT id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, price_ttc
      FROM products
      WHERE id = $1
        AND COALESCE(is_archived, FALSE) = FALSE
        AND COALESCE(is_deleted, FALSE) = FALSE
      LIMIT 1
    `,
    [productId]
  );
  const existing = existingResult.rows[0];
  if (!existing) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  const label = normalizeText(payload.label ?? existing.label);
  if (!label) {
    return { ok: false, message: 'PRODUCT_LABEL_REQUIRED' };
  }

  const reference = normalizeText(payload.reference ?? existing.reference, label);
  const duplicate = await query(
    `
      SELECT id
      FROM products
      WHERE lower(reference) = lower($1)
        AND id <> $2
        AND COALESCE(is_deleted, FALSE) = FALSE
      LIMIT 1
    `,
    [reference, productId]
  );
  if (duplicate.rows.length > 0) {
    return { ok: false, message: 'PRODUCT_REFERENCE_ALREADY_EXISTS' };
  }

  const category = normalizeTag(payload.category ?? existing.category, 'accessoire') || 'accessoire';
  const serie = normalizeTag(payload.serie ?? existing.serie, '40') || '40';
  const unit = normalizeText(payload.unit ?? existing.unit, 'piece');
  const description = normalizeText(payload.description ?? existing.description ?? '', '');
  const lowStockThreshold = Math.max(0, Number(payload.lowStockThreshold ?? existing.low_stock_threshold ?? 0) || 0);

  // Sanitize image input - throws error if full URL
  let sanitizedImageUrl;
  try {
    sanitizedImageUrl = sanitizeImageInput(payload.image_url) || sanitizeImageInput(payload.imageRef) || existing.image_url;
  } catch (error) {
    console.error('[UPDATE_PRODUCT_IMAGE_SANITIZE_ERROR]', {
      message: error.message,
      productId,
      payload: JSON.stringify(payload, null, 2)
    });
    return { ok: false, message: 'PRODUCT_IMAGE_URL_INVALID' };
  }

  const imageRef = normalizeStoredProductImageRef(sanitizedImageUrl) || PLACEHOLDER_IMAGE;

  console.log('[UPDATE_PRODUCT_IMAGE_DEBUG]', {
    productId,
    original_image_url: payload.image_url,
    original_imageRef: payload.imageRef,
    existing_image_url: existing.image_url,
    sanitized: sanitizedImageUrl,
    normalized: imageRef,
    final_db_value: imageRef
  });
  const priceTtc = Number.isFinite(Number(payload.priceTtc))
    ? Number(payload.priceTtc)
    : (Number(existing.price_ttc ?? 0) || 0);

  const currentColors = await getProductColors((text, params) => query(text, params), productId);
  const requestedColors = normalizeColorArray(payload.colors);
  const nextColors = requestedColors.length ? requestedColors : currentColors;
  if (!nextColors.length) {
    return { ok: false, message: 'PRODUCT_COLORS_REQUIRED' };
  }

  const removedColors = currentColors.filter((color) => !nextColors.includes(color));
  const addedColors = nextColors.filter((color) => !currentColors.includes(color));

  for (const color of removedColors) {
    const row = await query(
      `
        SELECT qty
        FROM stock
        WHERE product_id = $1 AND color = $2
        LIMIT 1
      `,
      [productId, color]
    );
    if ((Number(row.rows[0]?.qty ?? 0) || 0) > 0) {
      return { ok: false, message: `PRODUCT_COLOR_HAS_STOCK:${color}` };
    }
  }

  const now = new Date().toISOString();

  await withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    await client.query('BEGIN');
    try {
      await upsertProductMetadataWithExecutor(exec, 'category', category, now);
      await upsertProductMetadataWithExecutor(exec, 'serie', serie, now);

      await exec(
        `
          UPDATE products
          SET
            reference = $1,
            label = $2,
            description = $3,
            category = $4,
            serie = $5,
            unit = $6,
            image_url = $7,
            low_stock_threshold = $8,
            price_ttc = $9,
            last_updated = $10
          WHERE id = $11
        `,
        [reference, label, description, category, serie, unit, imageRef, lowStockThreshold, priceTtc, now, productId]
      );

      for (const color of addedColors) {
        await upsertProductMetadataWithExecutor(exec, 'color', color, now);
        await exec(
          `
            INSERT INTO stock (product_id, color, qty)
            VALUES ($1, $2, 0)
            ON CONFLICT(product_id, color) DO NOTHING
          `,
          [productId, color]
        );
        await exec(
          `
            INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
            VALUES ($1, $2, $3, $4, 0, $5)
            ON CONFLICT(product_id, color) DO UPDATE SET
              updated_at = EXCLUDED.updated_at
          `,
          [randomUUID(), productId, color, priceTtc, now]
        );
      }

      for (const color of removedColors) {
        await exec('DELETE FROM stock WHERE product_id = $1 AND color = $2', [productId, color]);
        await exec('DELETE FROM product_variants WHERE product_id = $1 AND color = $2', [productId, color]);
      }

      for (const color of nextColors) {
        await upsertProductMetadataWithExecutor(exec, 'color', color, now);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  return {
    ok: true,
    id: productId,
    addedColors,
    removedColors
  };
};

const archiveProduct = async (_db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existingResult = await query(
    `
      SELECT id, is_archived, is_deleted
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const existing = existingResult.rows[0];

  if (!existing || isTrue(existing.is_deleted)) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (isTrue(existing.is_archived)) {
    return { ok: true, alreadyArchived: true };
  }

  const now = new Date().toISOString();
  await query(
    `
      UPDATE products
      SET
        is_archived = TRUE,
        archived_at = $1,
        last_updated = $2
      WHERE id = $3
    `,
    [now, now, productId]
  );

  return { ok: true, id: productId };
};

const purgeProduct = async (_db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existingResult = await query(
    `
      SELECT id, is_archived, is_deleted
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const existing = existingResult.rows[0];
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

  await withClient(async (client) => {
    const exec = (text, params = []) => client.query(text, params);

    await client.query('BEGIN');
    try {
      await exec('DELETE FROM product_variants WHERE product_id = $1', [productId]);
      await exec('DELETE FROM price_history WHERE product_id = $1', [productId]);
      await exec('DELETE FROM stock WHERE product_id = $1', [productId]);
      await exec(
        `
          UPDATE products
          SET
            is_deleted = TRUE,
            is_archived = TRUE,
            deleted_at = $1,
            archived_at = COALESCE(archived_at, $2),
            last_updated = $3
          WHERE id = $4
        `,
        [now, now, now, productId]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  return { ok: true, id: productId };
};

const restoreProduct = async (_db, productId) => {
  if (!productId || typeof productId !== 'string') {
    return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
  }

  const existingResult = await query(
    `
      SELECT id, is_archived, is_deleted
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const existing = existingResult.rows[0];

  if (!existing || isTrue(existing.is_deleted)) {
    return { ok: false, message: 'PRODUCT_NOT_FOUND' };
  }

  if (!isTrue(existing.is_archived)) {
    return { ok: true, alreadyActive: true };
  }

  const now = new Date().toISOString();
  await query(
    `
      UPDATE products
      SET
        is_archived = FALSE,
        archived_at = NULL,
        last_updated = $1
      WHERE id = $2
    `,
    [now, productId]
  );

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
