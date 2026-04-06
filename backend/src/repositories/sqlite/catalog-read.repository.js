const { resolveProductImageUrl } = require('../../utils/product-images');

const DEFAULT_COLORS = ['blanc', 'gris', 'noir'];

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

const normalizeColor = (value) => {
  const color = normalizeTag(value);
  return color || null;
};

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

const hasTable = (db, tableName) => !!db.prepare(`
  SELECT 1
  FROM sqlite_master
  WHERE type = 'table' AND name = ?
  LIMIT 1
`).get(tableName);

const hasColumn = (db, tableName, columnName) => {
  if (!hasTable(db, tableName)) return false;
  const columns = db.prepare(`PRAGMA table_info("${String(tableName).replace(/"/g, '""')}")`).all();
  return columns.some((column) => column.name === columnName);
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toColorKey = (value) => String(value ?? '')
  .trim()
  .toLowerCase();

const listProducts = (db) => db.prepare(`
  SELECT id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
  FROM products
  WHERE COALESCE(is_archived, 0) = 0
    AND COALESCE(is_deleted, 0) = 0
  ORDER BY reference
`).all();

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
    const kind = normalizeTag(row?.kind);
    const value = normalizeTag(row?.value);
    if (!kind || !value) return;
    if (kind === 'category') {
      metadataCategories.push(value);
      return;
    }
    if (kind === 'serie' || kind === 'series') {
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

const getInventoryResponse = (db) => {
  const includeDeletedFilter = hasColumn(db, 'products', 'is_deleted');
  const products = db.prepare(`
    SELECT
      p.id,
      p.reference,
      p.label,
      p.description,
      p.category,
      p.serie,
      p.unit,
      p.image_url,
      p.low_stock_threshold,
      p.last_updated,
      p.price_ttc
    FROM products p
    WHERE COALESCE(p.is_archived, 0) = 0
      ${includeDeletedFilter ? 'AND COALESCE(p.is_deleted, 0) = 0' : ''}
    ORDER BY p.label
  `).all();

  const stockRows = hasTable(db, 'stock')
    ? db.prepare('SELECT product_id, color, qty FROM stock').all()
    : [];
  const variantRows = hasTable(db, 'product_variants')
    ? db.prepare('SELECT product_id, color, price FROM product_variants').all()
    : [];

  const qtyByProduct = new Map();
  stockRows.forEach((row) => {
    const productId = row?.product_id;
    const color = toColorKey(row?.color);
    if (!productId || !color) return;
    const entry = qtyByProduct.get(productId) ?? {};
    entry[color] = toNumber(entry[color]) + toNumber(row?.qty);
    qtyByProduct.set(productId, entry);
  });

  const priceByProduct = new Map();
  variantRows.forEach((row) => {
    const productId = row?.product_id;
    const color = toColorKey(row?.color);
    if (!productId || !color) return;
    const entry = priceByProduct.get(productId) ?? {};
    entry[color] = toNumber(row?.price);
    priceByProduct.set(productId, entry);
  });

  const items = products.map((row) => {
    const fallbackPrice = toNumber(row.price_ttc);
    const quantities = { ...(qtyByProduct.get(row.id) ?? {}) };
    const prices = { ...(priceByProduct.get(row.id) ?? {}) };

    const stockColors = Object.keys(quantities).map((color) => toColorKey(color)).filter(Boolean);
    const variantColors = Object.keys(prices).map((color) => toColorKey(color)).filter(Boolean);
    const colors = Array.from(new Set([...stockColors, ...variantColors]));
    const sortedColors = colors.sort((a, b) => a.localeCompare(b, 'fr'));

    const quantityByColor = {};
    const priceByColor = {};
    const valueByColor = {};

    let qtyTotal = 0;
    let totalValue = 0;
    let hasAllPrices = sortedColors.length > 0;

    sortedColors.forEach((color) => {
      const qty = toNumber(quantities[color]);
      const unit = toNumber(prices[color]) || fallbackPrice;
      const colorValue = qty * unit;

      quantityByColor[color] = qty;
      priceByColor[color] = unit;
      valueByColor[color] = colorValue;

      qtyTotal += qty;
      totalValue += colorValue;
      if (unit <= 0) {
        hasAllPrices = false;
      }
    });

    const weightedPrice = qtyTotal > 0 ? totalValue / qtyTotal : Math.max(...Object.values(priceByColor), 0);

    return {
      product: {
        id: row.id,
        reference: row.reference,
        label: row.label,
        description: row.description ?? '',
        category: row.category,
        serie: row.serie,
        unit: row.unit,
        imageUrl: resolveProductImageUrl(row.image_url),
        lowStockThreshold: row.low_stock_threshold,
        lastUpdated: row.last_updated,
        priceTtc: row.price_ttc
      },
      qtyBlanc: toNumber(quantityByColor.blanc),
      qtyGris: toNumber(quantityByColor.gris),
      qtyNoir: toNumber(quantityByColor.noir),
      qtyTotal,
      quantityByColor,
      unitPrice: weightedPrice,
      priceByColor,
      valueByColor,
      totalValue,
      priceStatus: hasAllPrices ? 'ok' : 'missing'
    };
  });

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  return { items, totalValue };
};

module.exports = {
  DEFAULT_COLORS,
  listProducts,
  listArchivedProducts,
  getProductMetadata,
  getStockRows,
  buildStockItems,
  getInventoryResponse
};
