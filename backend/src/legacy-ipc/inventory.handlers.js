const { assertPermission } = require('../services/auth-session.service');
const { resolveProductImageUrl } = require('../utils/product-images');
const { getInventoryResponse: getInventoryResponseRead } = require('../repositories/catalog-read.runtime.repository');

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
    console.log('[inventaire-api] product colors source:', {
      productId: row.id,
      productLabel: row.label,
      stockColors,
      variantColors
    });
    console.log(`[inventaire-api] product ${row.id}/${row.label} colors count: ${sortedColors.length}`);
    console.log(`[inventaire-api] product ${row.id}/${row.label} colors: ${JSON.stringify(sortedColors)}`);

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

const registerInventoryHandlers = (ipcMain, getDb) => {
  ipcMain.handle('inventaire:get', async () => {
    try {
      assertPermission('manageInventory');
      return await getInventoryResponseRead(getDb());
    } catch (error) {
      console.error('[inventaire:get] error', error);
      return { items: [], totalValue: 0 };
    }
  });
};

module.exports = {
  registerInventoryHandlers,
  getInventoryResponse
};
