const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const resolveCataloguePath = () => {
  if (app.isPackaged) {
    return path.join(__dirname, '..', '..', '..', 'dist', 'spa-invoice', 'assets', 'catalogue_prix_norm.json');
  }
  return path.join(__dirname, '..', '..', '..', 'src', 'assets', 'catalogue_prix_norm.json');
};

const normalizeName = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const syncCataloguePrices = (db) => {
  const cataloguePath = resolveCataloguePath();
  try {
    if (!fs.existsSync(cataloguePath)) {
      return;
    }
    const raw = fs.readFileSync(cataloguePath, 'utf8');
    const data = JSON.parse(raw);
    const items = data?.items ?? {};
    const products = db.prepare('SELECT id, label FROM products').all();
    const update = db.prepare('UPDATE products SET price_ttc = ? WHERE id = ?');

    const tx = db.transaction(() => {
      products.forEach((product) => {
        const key = normalizeName(product.label);
        const entry = items[key];
        if (entry && Number.isFinite(entry.prix_ttc)) {
          update.run(Number(entry.prix_ttc), product.id);
        }
      });
    });
    tx();
  } catch (err) {
    console.warn('[catalogue] load failed', err);
  }
};

module.exports = { syncCataloguePrices };
