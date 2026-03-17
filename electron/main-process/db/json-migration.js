const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const invoicesFilePath = () => path.join(app.getPath('userData'), 'invoices.json');
const quotesFilePath = () => path.join(app.getPath('userData'), 'quotes.json');

const normalizeInvoices = (data) => (Array.isArray(data) ? data : []);
const normalizeQuotes = (data) => (Array.isArray(data) ? data : []);

const readInvoices = () => {
  const filePath = invoicesFilePath();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizeInvoices(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return [];
    }
    console.error('[invoices] read failed', err);
    return [];
  }
};

const readQuotes = () => {
  const filePath = quotesFilePath();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizeQuotes(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return [];
    }
    console.error('[quotes] read failed', err);
    return [];
  }
};

const migrateJsonDocuments = (db) => {
  const invoicesCount = db.prepare('SELECT COUNT(1) as count FROM invoices').get();
  if (invoicesCount?.count === 0) {
    const invoices = readInvoices();
    if (invoices.length) {
      const stmt = db.prepare('INSERT INTO invoices (id, payload, updated_at, client_id) VALUES (?, ?, ?, ?)');
      const tx = db.transaction(() => {
        invoices.forEach((invoice) => {
          if (!invoice?.id) return;
          const clientId = typeof invoice?.clientId === 'string' ? invoice.clientId : null;
          stmt.run(invoice.id, JSON.stringify(invoice), new Date().toISOString(), clientId);
        });
      });
      tx();
    }
  }

  const quotesCount = db.prepare('SELECT COUNT(1) as count FROM quotes').get();
  if (quotesCount?.count === 0) {
    const quotes = readQuotes();
    if (quotes.length) {
      const stmt = db.prepare('INSERT INTO quotes (id, payload, updated_at, client_id) VALUES (?, ?, ?, ?)');
      const tx = db.transaction(() => {
        quotes.forEach((quote) => {
          if (!quote?.id) return;
          const clientId = typeof quote?.clientId === 'string' ? quote.clientId : null;
          stmt.run(quote.id, JSON.stringify(quote), new Date().toISOString(), clientId);
        });
      });
      tx();
    }
  }
};

module.exports = { migrateJsonDocuments };
