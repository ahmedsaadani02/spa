const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, '..', 'dist', 'spa-invoice', 'index.html')}`
    : 'http://localhost:4200';

  mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
};

const invoicesFilePath = () => path.join(app.getPath('userData'), 'invoices.json');
const quotesFilePath = () => path.join(app.getPath('userData'), 'quotes.json');

const normalizeInvoices = (data) => (Array.isArray(data) ? data : []);
const normalizeQuotes = (data) => (Array.isArray(data) ? data : []);

const readInvoices = async () => {
  const filePath = invoicesFilePath();
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return normalizeInvoices(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return [];
    }
    console.error('[invoices] read failed', err);
    return [];
  }
};

const writeInvoices = async (invoices) => {
  const filePath = invoicesFilePath();
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(invoices, null, 2), 'utf8');
};

const readQuotes = async () => {
  const filePath = quotesFilePath();
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return normalizeQuotes(JSON.parse(raw));
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return [];
    }
    console.error('[quotes] read failed', err);
    return [];
  }
};

const writeQuotes = async (quotes) => {
  const filePath = quotesFilePath();
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(quotes, null, 2), 'utf8');
};

const registerInvoiceHandlers = () => {
  ipcMain.handle('invoices:getAll', async () => {
    return readInvoices();
  });

  ipcMain.handle('invoices:getById', async (event, id) => {
    const all = await readInvoices();
    return all.find((inv) => inv.id === id) ?? null;
  });

  ipcMain.handle('invoices:put', async (event, invoice) => {
    if (!invoice || !invoice.id) {
      return false;
    }

    const all = await readInvoices();
    const index = all.findIndex((inv) => inv.id === invoice.id);
    if (index >= 0) {
      all[index] = invoice;
    } else {
      all.push(invoice);
    }

    await writeInvoices(all);
    return true;
  });

  ipcMain.handle('invoices:delete', async (event, id) => {
    const all = await readInvoices();
    const filtered = all.filter((inv) => inv.id !== id);
    await writeInvoices(filtered);
    return true;
  });
};

const registerQuoteHandlers = () => {
  ipcMain.handle('quotes:getAll', async () => {
    return readQuotes();
  });

  ipcMain.handle('quotes:getById', async (event, id) => {
    const all = await readQuotes();
    return all.find((quote) => quote.id === id) ?? null;
  });

  ipcMain.handle('quotes:put', async (event, quote) => {
    if (!quote || !quote.id) {
      return false;
    }

    const all = await readQuotes();
    const index = all.findIndex((q) => q.id === quote.id);
    if (index >= 0) {
      all[index] = quote;
    } else {
      all.push(quote);
    }

    await writeQuotes(all);
    return true;
  });

  ipcMain.handle('quotes:delete', async (event, id) => {
    const all = await readQuotes();
    const filtered = all.filter((quote) => quote.id !== id);
    await writeQuotes(filtered);
    return true;
  });
};

app.whenReady().then(() => {
  createWindow();
  registerInvoiceHandlers();
  registerQuoteHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('export-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return { canceled: true };
  }

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exporter la facture en PDF',
    defaultPath: 'facture.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const pdfData = await win.webContents.printToPDF({ printBackground: true });
  fs.writeFileSync(filePath, pdfData);
  return { canceled: false, filePath };
});
