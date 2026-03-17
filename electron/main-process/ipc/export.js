const { BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const { assertPermission } = require('../auth/service');

const toSafeFilePart = (value, fallback) => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_');
  return normalized || fallback;
};

const assertDocumentPermission = (docType) => {
  if (docType === 'quote') {
    assertPermission('manageQuotes');
    return;
  }
  assertPermission('manageInvoices');
};

const buildDefaultPdfName = (docType, documentNumber) => {
  const prefix = docType === 'quote' ? 'devis' : 'facture';
  const safeNumber = toSafeFilePart(documentNumber, prefix);
  return `${prefix}-${safeNumber}.pdf`;
};

const getOwnerWindow = (event) => BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();

const ensureHtmlDocument = (html, title = 'Document') => {
  const normalizedHtml = String(html ?? '');
  if (/<html[\s>]/i.test(normalizedHtml)) {
    return normalizedHtml;
  }

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${title}</title>`,
    '</head>',
    '<body>',
    normalizedHtml,
    '</body>',
    '</html>'
  ].join('');
};

const createPrintWindow = ({ show = false } = {}) => new BrowserWindow({
  show,
  width: 900,
  height: 1200,
  autoHideMenuBar: true,
  backgroundColor: '#ffffff',
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false
  }
});

const createTempHtmlFile = (html, title) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spa-print-'));
  const filePath = path.join(tempDir, 'document.html');
  fs.writeFileSync(filePath, ensureHtmlDocument(html, title), 'utf8');
  return { tempDir, filePath };
};

const cleanupTempDir = (tempDir) => {
  if (!tempDir) return;
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // best effort cleanup only
  }
};

const waitForDidFinishLoad = (webContents, tag, timeoutMs = 15000) => new Promise((resolve, reject) => {
  console.log(`${tag} waiting did-finish-load`);

  let settled = false;
  let timeout;

  const cleanup = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    webContents.removeListener('did-finish-load', onFinish);
    webContents.removeListener('did-fail-load', onFail);
  };

  const onFinish = () => {
    if (settled) return;
    settled = true;
    cleanup();
    console.log(`${tag} did-finish-load received`);
    resolve();
  };

  const onFail = (_event, errorCode, errorDescription, validatedURL) => {
    if (settled) return;
    settled = true;
    cleanup();
    reject(new Error(`LOAD_FAILED ${errorCode}: ${errorDescription} (${validatedURL})`));
  };

  timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    reject(new Error('LOAD_TIMEOUT'));
  }, timeoutMs);

  webContents.once('did-finish-load', onFinish);
  webContents.once('did-fail-load', onFail);
});

const waitForPageReady = async (webContents, tag = '[documents:print]') => {
  try {
    await webContents.executeJavaScript(
      'document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true',
      true
    );
  } catch {
    // continue even if fonts API is unavailable
  }

  try {
    await webContents.executeJavaScript(
      `new Promise((resolve) => {
        const images = Array.from(document.images || []);
        if (!images.length) {
          resolve(true);
          return;
        }

        let settled = 0;
        let finished = false;
        let timeout;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
          resolve(true);
        };
        const done = () => {
          if (finished) return;
          settled += 1;
          if (settled >= images.length) {
            finish();
          }
        };

        timeout = setTimeout(() => finish(), 5000);
        images.forEach((image) => {
          if (image.complete) {
            done();
            return;
          }
          image.addEventListener('load', done, { once: true });
          image.addEventListener('error', done, { once: true });
        });

        Promise.resolve().then(() => {
          if (settled >= images.length) {
            finish();
          }
        });
      })`,
      true
    );
    console.log(`${tag} images loaded`);
  } catch (error) {
    console.warn(`${tag} images wait skipped`, error?.message || error);
  }

  await new Promise((resolve) => setTimeout(resolve, 80));
};

const withPrintTarget = async (event, options, callback, mode = 'pdf') => {
  const html = typeof options?.html === 'string' ? options.html.trim() : '';
  const ownerWindow = getOwnerWindow(event);

  if (!html) {
    if (!ownerWindow) {
      throw new Error('WINDOW_NOT_FOUND');
    }
    return callback(ownerWindow);
  }

  const title = typeof options?.title === 'string' && options.title.trim()
    ? options.title.trim()
    : 'Document';
  const { tempDir, filePath } = createTempHtmlFile(html, title);
  const printWindow = createPrintWindow({ show: mode === 'print' });
  const tag = mode === 'print' ? '[documents:print]' : '[documents:exportPdf]';
  console.log(`${tag} print window created`, {
    windowId: printWindow.id,
    visible: mode === 'print'
  });
  printWindow.once('closed', () => {
    console.log(`${tag} window closed`, { windowId: printWindow.id });
  });

  try {
    const fileUrl = pathToFileURL(filePath).toString();
    console.log(`${tag} html injected`, { windowId: printWindow.id, fileUrl });
    const didFinishLoad = waitForDidFinishLoad(printWindow.webContents, tag);
    await printWindow.loadURL(fileUrl);
    console.log(`${tag} html loaded`, { windowId: printWindow.id });
    await didFinishLoad;
    await waitForPageReady(printWindow.webContents, tag);
    if (mode === 'print') {
      if (!printWindow.isVisible()) {
        printWindow.show();
      }
      try {
        printWindow.moveTop();
      } catch {
        // best effort
      }
      printWindow.focus();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return await callback(printWindow);
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    cleanupTempDir(tempDir);
  }
};

const printCurrentWindow = async (event, options = {}) => {
  const docType = options?.docType === 'quote' ? 'quote' : 'invoice';
  console.log('[documents:print] invoked', {
    docType,
    documentNumber: options?.documentNumber ?? null,
    hasHtml: !!(typeof options?.html === 'string' && options.html.trim())
  });
  if (typeof options?.html === 'string' && options.html.trim()) {
    if (docType === 'quote') {
      console.log('[documents:print] using quote master page layout');
    } else {
      console.log('[documents:print] using master page layout');
    }
  }

  assertDocumentPermission(docType);

  return withPrintTarget(event, options, (win) => new Promise((resolve) => {
    let settled = false;
    const settle = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const timeout = setTimeout(() => {
      console.error('[documents:print] callback timeout');
      settle({ ok: false, message: 'PRINT_TIMEOUT' });
    }, 30000);

    console.log('[documents:print] print started', { windowId: win.id });
    win.webContents.print(
      {
        silent: false,
        printBackground: true
      },
      (success, failureReason) => {
        clearTimeout(timeout);
        console.log(`[documents:print] callback success=${success} failureReason=${failureReason ?? ''}`);
        if (success) {
          console.log('[documents:print] success', {
            docType: options.docType,
            documentNumber: options.documentNumber ?? null
          });
          settle({ ok: true });
          return;
        }

        const reason = String(failureReason ?? '').toLowerCase();
        if (reason.includes('cancel')) {
          settle({ ok: false, canceled: true, message: 'PRINT_CANCELED' });
          return;
        }

        settle({ ok: false, message: failureReason || 'PRINT_FAILED' });
      }
    );
  }), 'print');
};

const exportCurrentWindowToPdf = async (event, options = {}) => {
  const docType = options.docType === 'quote' ? 'quote' : 'invoice';
  assertDocumentPermission(docType);
  console.log('[documents:exportPdf] invoked', {
    docType,
    documentNumber: options?.documentNumber ?? null,
    hasHtml: !!(typeof options?.html === 'string' && options.html.trim())
  });
  if (typeof options?.html === 'string' && options.html.trim()) {
    if (docType === 'quote') {
      console.log('[documents:exportPdf] using quote master page layout');
    } else {
      console.log('[documents:exportPdf] using master page layout');
    }
  }

  const ownerWindow = getOwnerWindow(event);
  const defaultFileName = buildDefaultPdfName(docType, options.documentNumber || docType);
  console.log('[documents:exportPdf] opening save dialog', { defaultFileName });
  const { canceled, filePath } = await dialog.showSaveDialog(ownerWindow ?? undefined, {
    title: docType === 'quote' ? 'Exporter le devis en PDF' : 'Exporter la facture en PDF',
    defaultPath: defaultFileName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (canceled || !filePath) {
    console.log('[documents:exportPdf] save dialog canceled');
    return { canceled: true };
  }
  console.log('[documents:exportPdf] save path selected:', filePath);

  return withPrintTarget(event, options, async (win) => {
    console.log('[documents:exportPdf] invoking printToPDF', { windowId: win.id });
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 0,
      landscape: false,
      preferCSSPageSize: true
    });
    console.log('[documents:exportPdf] pdf generated', { size: pdfData.length });

    await fs.promises.writeFile(filePath, pdfData);
    console.log('[documents:exportPdf] pdf written successfully:', filePath);
    console.log('[documents:exportPdf] success', {
      docType,
      documentNumber: options.documentNumber ?? null,
      filePath
    });
    return { canceled: false, filePath };
  }, 'pdf');
};

const registerExportHandlers = (ipcMain) => {
  ipcMain.handle('documents:print', async (event, options) => {
    try {
      return await printCurrentWindow(event, options);
    } catch (error) {
      console.error('[documents:print] error', error);
      return { ok: false, message: error.message || 'PRINT_FAILED' };
    }
  });

  ipcMain.handle('documents:exportPdf', async (event, options) => {
    try {
      return await exportCurrentWindowToPdf(event, options);
    } catch (error) {
      console.error('[documents:exportPdf] error', error);
      return { canceled: true, message: error.message || 'PDF_EXPORT_FAILED' };
    }
  });

  // Backward compatibility for existing frontend calls.
  ipcMain.handle('export-pdf', async (event) => {
    try {
      return await exportCurrentWindowToPdf(event, { docType: 'invoice', documentNumber: 'facture' });
    } catch (error) {
      console.error('[export-pdf] error', error);
      return { canceled: true, message: error.message || 'PDF_EXPORT_FAILED' };
    }
  });
};

module.exports = { registerExportHandlers };
