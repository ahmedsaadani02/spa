const normalizeColor = (value) => {
  if (typeof value !== 'string') return null;
  const color = value.trim().toLowerCase();
  return color || null;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPriceHistory = (db, productId, colorInput) => {
  if (!productId) return [];

  const color = normalizeColor(colorInput);
  if (!color) return [];

  return db.prepare(`
    SELECT id, product_id, color, old_price, new_price, changed_at, changed_by
    FROM price_history
    WHERE product_id = ? AND color = ?
    ORDER BY datetime(changed_at) DESC, id DESC
  `).all(productId, color).map((row) => ({
    id: row.id,
    productId: row.product_id,
    color: row.color,
    oldPrice: toNumber(row.old_price),
    newPrice: toNumber(row.new_price),
    changedAt: row.changed_at,
    changedBy: row.changed_by
  }));
};

module.exports = {
  getPriceHistory
};
