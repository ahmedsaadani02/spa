const { many } = require('./shared');
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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeColorKey = (value) => String(value ?? '')
  .trim()
  .toLowerCase();

const normalizeProductRow = (row) => ({
  ...row,
  low_stock_threshold: toNumber(row.low_stock_threshold),
  price_ttc: row.price_ttc == null ? null : toNumber(row.price_ttc),
  archived_at: row.archived_at ?? null,
  last_updated: row.last_updated ?? null
});

const listProducts = async () => {
  const rows = await many(`
    SELECT
      id,
      reference,
      label,
      description,
      category,
      serie,
      unit,
      image_url,
      low_stock_threshold,
      last_updated,
      price_ttc
    FROM products
    WHERE is_archived = FALSE
      AND is_deleted = FALSE
    ORDER BY reference
  `);

  return rows.map((row) => {
    try {
      return normalizeProductRow(row);
    } catch (error) {
      console.error('[REPO_PRODUCT_ROW_NORMALIZE_ERROR]', {
        productId: row.id,
        reference: row.reference,
        error: error.message,
        stack: error.stack
      });
      // Return row with safe defaults
      return {
        ...row,
        low_stock_threshold: 0,
        price_ttc: null,
        archived_at: null,
        last_updated: null
      };
    }
  });
};

const listArchivedProducts = async () => {
  const products = await many(`
    SELECT
      id,
      reference,
      label,
      description,
      category,
      serie,
      unit,
      image_url,
      low_stock_threshold,
      last_updated,
      archived_at,
      price_ttc
    FROM products
    WHERE is_archived = TRUE
      AND is_deleted = FALSE
    ORDER BY archived_at DESC NULLS LAST, reference
  `);

  if (!products.length) {
    return [];
  }

  const colorRows = await many(`
    SELECT s.product_id, s.color
    FROM stock s
    INNER JOIN products p ON p.id = s.product_id
    WHERE p.is_archived = TRUE
      AND p.is_deleted = FALSE
    GROUP BY s.product_id, s.color
  `);

  const colorsByProduct = new Map();
  colorRows.forEach((row) => {
    if (!row?.product_id || !row?.color) return;
    const list = colorsByProduct.get(row.product_id) ?? [];
    list.push(String(row.color));
    colorsByProduct.set(row.product_id, list);
  });

  return products.map((row) => {
    let normalizedRow;
    try {
      normalizedRow = normalizeProductRow(row);
    } catch (error) {
      console.error('[REPO_ARCHIVED_PRODUCT_ROW_NORMALIZE_ERROR]', {
        productId: row.id,
        reference: row.reference,
        error: error.message,
        stack: error.stack
      });
      // Return row with safe defaults
      normalizedRow = {
        ...row,
        low_stock_threshold: 0,
        price_ttc: null,
        archived_at: row.archived_at ?? null,
        last_updated: row.last_updated ?? null
      };
    }
    return {
      ...normalizedRow,
      colors: sortColors(Array.from(new Set(colorsByProduct.get(row.id) ?? [])))
    };
  });
};

const getProductMetadata = async () => {
  const [categoryRows, serieRows, stockColorRows, variantColorRows, metadataRows] = await Promise.all([
    many(`
      SELECT DISTINCT category
      FROM products
      WHERE category IS NOT NULL
        AND btrim(category) <> ''
        AND is_deleted = FALSE
      ORDER BY category
    `),
    many(`
      SELECT DISTINCT serie
      FROM products
      WHERE serie IS NOT NULL
        AND btrim(serie) <> ''
        AND is_deleted = FALSE
      ORDER BY serie
    `),
    many(`
      SELECT DISTINCT color
      FROM stock
      WHERE color IS NOT NULL
        AND btrim(color) <> ''
    `),
    many(`
      SELECT DISTINCT color
      FROM product_variants
      WHERE color IS NOT NULL
        AND btrim(color) <> ''
    `),
    many(`
      SELECT kind, value
      FROM product_catalog_metadata
      WHERE value IS NOT NULL
        AND btrim(value) <> ''
    `)
  ]);

  const categories = categoryRows.map((row) => normalizeTag(row.category)).filter(Boolean);
  const series = serieRows.map((row) => normalizeTag(row.serie)).filter(Boolean);
  const stockColors = stockColorRows.map((row) => normalizeTag(row.color)).filter(Boolean);
  const variantColors = variantColorRows.map((row) => normalizeTag(row.color)).filter(Boolean);

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

const getStockRows = async () => {
  const rows = await many(`
    SELECT product_id, color, qty
    FROM stock
  `);

  return rows.map((row) => ({
    product_id: row.product_id,
    color: row.color,
    qty: toNumber(row.qty)
  }));
};

const buildStockItems = async () => {
  const [products, stockRows] = await Promise.all([
    listProducts(),
    getStockRows()
  ]);

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
    lowStockThreshold: toNumber(product.low_stock_threshold),
    lastUpdated: product.last_updated ?? new Date().toISOString()
  }));
};

const getInventoryResponse = async () => {
  const [products, stockRows, variantRows] = await Promise.all([
    many(`
      SELECT
        id,
        reference,
        label,
        description,
        category,
        serie,
        unit,
        image_url,
        low_stock_threshold,
        last_updated,
        price_ttc
      FROM products
      WHERE is_archived = FALSE
        AND is_deleted = FALSE
      ORDER BY label
    `),
    many('SELECT product_id, color, qty FROM stock'),
    many('SELECT product_id, color, price FROM product_variants')
  ]);

  const qtyByProduct = new Map();
  stockRows.forEach((row) => {
    const productId = row?.product_id;
    const color = normalizeColorKey(row?.color);
    if (!productId || !color) return;
    const entry = qtyByProduct.get(productId) ?? {};
    entry[color] = toNumber(entry[color]) + toNumber(row?.qty);
    qtyByProduct.set(productId, entry);
  });

  const priceByProduct = new Map();
  variantRows.forEach((row) => {
    const productId = row?.product_id;
    const color = normalizeColorKey(row?.color);
    if (!productId || !color) return;
    const entry = priceByProduct.get(productId) ?? {};
    entry[color] = toNumber(row?.price);
    priceByProduct.set(productId, entry);
  });

  const items = products.map((row) => {
    const fallbackPrice = toNumber(row.price_ttc);
    const quantities = { ...(qtyByProduct.get(row.id) ?? {}) };
    const prices = { ...(priceByProduct.get(row.id) ?? {}) };
    const stockColors = Object.keys(quantities).map((color) => normalizeColorKey(color)).filter(Boolean);
    const variantColors = Object.keys(prices).map((color) => normalizeColorKey(color)).filter(Boolean);
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
        lowStockThreshold: toNumber(row.low_stock_threshold),
        lastUpdated: row.last_updated ?? null,
        priceTtc: row.price_ttc == null ? null : toNumber(row.price_ttc)
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

  return {
    items,
    totalValue: items.reduce((sum, item) => sum + item.totalValue, 0)
  };
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
