const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { registerBackendRoutes } = require('./src/app');
const { getDatabaseRoutingSummary } = require('./src/config/database');
const { setCurrentUser, clearCurrentUser, hasPermission } = require('./src/services/auth-session.service');
const { createSessionResolver } = require('./src/services/session-resolver');
const { registerAuthHandlers } = require('./src/legacy-ipc/auth.handlers');
const { registerClientsHandlers } = require('./src/legacy-ipc/clients.handlers');
const { registerInvoicesHandlers } = require('./src/legacy-ipc/invoices.handlers');
const { registerQuotesHandlers } = require('./src/legacy-ipc/quotes.handlers');
const { registerProductsHandlers } = require('./src/legacy-ipc/products.handlers');
const { registerStockHandlers } = require('./src/legacy-ipc/stock.handlers');
const { registerMovementsHandlers } = require('./src/legacy-ipc/movements.handlers');
const { registerInventoryHandlers } = require('./src/legacy-ipc/inventory.handlers');
const { registerEmployeesHandlers } = require('./src/legacy-ipc/employees.handlers');
const { registerSalaryHandlers } = require('./src/legacy-ipc/salary.handlers');
const { resolveProductImageUrl, getProductsImagesDirectory } = require('./src/utils/product-images');
const { getTaskProofImagesDirectory } = require('./src/utils/task-proof-images');

let httpServer = null;
const sessions = new Map();
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);
const TRACE_CHANNEL_TAGS = new Map([
  ['invoices:getAll', 'invoices-api'],
  ['quotes:getAll', 'quotes-api'],
  ['clients:list', 'clients-api'],
  ['clients:search', 'clients-api'],
  ['stock:items', 'stock-api'],
  ['stock:getAll', 'stock-api'],
  ['products:list', 'stock-api'],
  ['products:listArchived', 'stock-archives-api'],
  ['movements:list', 'stock-history-api'],
  ['inventaire:get', 'inventaire-api'],
  ['inventory:get', 'inventaire-api'],
  ['employees:list', 'employees-api'],
  ['employees:search', 'employees-api']
]);
const ACTION_CHANNEL_TAGS = new Map([
  ['employees:delete', 'archives:delete'],
  ['stock:applyMovement', 'stock-api'],
  ['stock:setQty', 'stock-api'],
  ['movements:add', 'stock-api'],
  ['products:create', 'products:create'],
  ['products:update', 'stock-api'],
  ['products:archive', 'stock-api'],
  ['products:restore', 'stock-api'],
  ['products:purge', 'stock-api'],
  ['salary:advances:create', 'salary:add-advance'],
  ['salary:bonuses:create', 'salary:add-prime'],
  ['salary:overtimes:create', 'salary:add-overtime'],
  ['auth:resetPassword', 'salary:reset-password']
]);

const getResultCount = (result) => {
  if (Array.isArray(result)) return result.length;
  if (Array.isArray(result?.items)) return result.items.length;
  if (Array.isArray(result?.rows)) return result.rows.length;
  if (Array.isArray(result?.employees)) return result.employees.length;
  if (Array.isArray(result?.data)) return result.data.length;
  return 0;
};

const isActionSuccessful = (channel, result) => {
  if (channel === 'salary:advances:create' || channel === 'salary:bonuses:create' || channel === 'salary:overtimes:create') {
    return !!result;
  }
  if (channel === 'employees:delete' || channel === 'auth:resetPassword') {
    return result === true;
  }
  if (channel === 'stock:applyMovement' || channel === 'stock:setQty' || channel === 'movements:add') {
    return result === true;
  }
  if (channel === 'products:create') {
    return result?.ok === true;
  }
  if (channel === 'products:update') {
    return result?.ok === true;
  }
  if (channel === 'products:archive' || channel === 'products:restore' || channel === 'products:purge') {
    return result?.ok === true;
  }
  return !!result;
};

const createToken = () => crypto.randomUUID?.() ?? crypto.randomBytes(24).toString('hex');
const nowIso = () => new Date().toISOString();

const sanitizeBaseName = (value) => String(value ?? 'product')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') || 'product';

const createIpcBridge = () => {
  const handlers = new Map();
  const fakeIpcMain = {
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
    removeHandler(channel) {
      handlers.delete(channel);
    }
  };

  const registerStep = (name, callback) => {
    try {
      callback();
      console.log(`[http-ipc] ${name} registered`);
    } catch (error) {
      console.error(`[http-ipc] ${name} registration failed`, error);
    }
  };

  const getDb = () => db;

  registerStep('auth handlers', () => registerAuthHandlers(fakeIpcMain, getDb));
  registerStep('clients handlers', () => registerClientsHandlers(fakeIpcMain, getDb));
  registerStep('invoices handlers', () => registerInvoicesHandlers(fakeIpcMain, getDb));
  registerStep('quotes handlers', () => registerQuotesHandlers(fakeIpcMain, getDb));
  registerStep('products handlers', () => registerProductsHandlers(fakeIpcMain, getDb));
  registerStep('stock handlers', () => registerStockHandlers(fakeIpcMain, getDb));
  registerStep('movements handlers', () => registerMovementsHandlers(fakeIpcMain, getDb));
  registerStep('inventory handlers', () => registerInventoryHandlers(fakeIpcMain, getDb));
  registerStep('employees handlers', () => registerEmployeesHandlers(fakeIpcMain, getDb));
  registerStep('salary handlers', () => registerSalaryHandlers(fakeIpcMain, getDb));

  return {
    has(channel) {
      return handlers.has(channel);
    },
    async invoke(channel, event, args) {
      const handler = handlers.get(channel);
      if (!handler) {
        const error = new Error(`No handler registered for '${channel}'`);
        error.code = 'NO_HANDLER';
        throw error;
      }
      return handler(event, ...(Array.isArray(args) ? args : []));
    }
  };
};

const resolveSessionUser = createSessionResolver({ sessions, getDb: () => db });

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const user = await resolveSessionUser(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.authToken = token;
  req.authUser = user;
  return next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.authUser) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  // `hasPermission` reads the session singleton, so keep it aligned for middleware checks.
  setCurrentUser(req.authUser);
  const allowed = hasPermission(permission);
  clearCurrentUser();
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return next();
};

function createApp() {
  const app = express();
  app.use((req, _res, next) => { console.log('[server]', req.method, req.url); next(); });
  const ipcBridge = createIpcBridge();
  const productsImagesDir = getProductsImagesDirectory();
  const taskProofImagesDir = getTaskProofImagesDirectory();
  fs.mkdirSync(productsImagesDir, { recursive: true });
  fs.mkdirSync(taskProofImagesDir, { recursive: true });

  app.use(cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '25mb' }));
  registerBackendRoutes(app, {
    getDb: () => db,
    sessions,
    createToken,
    nowIso,
    resolveSessionUser,
    setCurrentUser,
    clearCurrentUser
  });

  app.use('/api/product-images', express.static(productsImagesDir, {
    fallthrough: false,
    etag: true,
    maxAge: '7d'
  }));
  app.use('/api/task-proof-images', express.static(taskProofImagesDir, {
    fallthrough: false,
    etag: true,
    maxAge: '7d'
  }));

  console.log('[STATIC_ROUTES_DEBUG]', {
    productsImagesDir,
    productsImagesExists: fs.existsSync(productsImagesDir),
    taskProofImagesDir,
    taskProofImagesExists: fs.existsSync(taskProofImagesDir)
  });

  app.get('/api/ping', (_req, res) => {
    res.json({ success: true, message: 'SPA SERVER OK', mode: 'http-ipc-bridge' });
  });

  app.post('/api/ipc/invoke', async (req, res) => {
    const channel = typeof req.body?.channel === 'string' ? req.body.channel.trim() : '';
    const args = Array.isArray(req.body?.args) ? req.body.args : [];
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const user = await resolveSessionUser(token);
    const publicChannels = new Set([
      'auth:beginLogin',
      'auth:setupProtectedPassword',
      'auth:login'
    ]);

    if (!channel) {
      return res.status(400).json({ success: false, message: 'channel is required' });
    }

    if (channel === 'auth:beginLogin') {
      console.log('[http-ipc] /api/ipc/invoke called');
      console.log('[http-ipc] channel = auth:beginLogin');
      console.log('[auth-web] invoke channel received: auth:beginLogin');
      console.log('[auth-web] payload received', {
        identity: typeof args?.[0] === 'string' ? args[0] : null,
        hasPassword: typeof args?.[1] === 'string' && args[1].length > 0
      });
    }

    if (channel === 'auth:beginLogin' || channel === 'auth:login') {
      const identity = typeof args?.[0] === 'string' ? args[0].trim().toLowerCase() : '';
      console.log('[auth-web] login requested');
      console.log('[auth-web] identity received', {
        channel,
        identity: identity || null,
        type: identity.includes('@') ? 'email' : 'username'
      });
    }

    if (!ipcBridge.has(channel)) {
      return res.status(404).json({ success: false, message: `No handler registered for '${channel}'` });
    }

    const event = {
      sender: {
        getUserAgent: () => req.headers['user-agent'] ?? null
      }
    };

    try {
      if (channel === 'auth:getCurrentUser') {
        return res.json({ success: true, result: user });
      }

      if (channel === 'auth:logout') {
        if (token) {
          sessions.delete(token);
        }
        clearCurrentUser();
        return res.json({ success: true, result: true });
      }

      if (!publicChannels.has(channel)) {
        if (!user) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        setCurrentUser(user);
      } else {
        clearCurrentUser();
      }

      const traceTag = TRACE_CHANNEL_TAGS.get(channel);
      const actionTag = ACTION_CHANNEL_TAGS.get(channel);
      if (traceTag) {
        console.log(`[${traceTag}] request received`, { channel });
      }
      if (actionTag) {
        const actionRequestMessage = channel === 'products:create' ? 'request received' : 'action received';
        console.log(`[${actionTag}] ${actionRequestMessage}`, { channel });
      }

      const result = await ipcBridge.invoke(channel, event, args);

      if (traceTag) {
        console.log(`[${traceTag}] response count: ${getResultCount(result)}`);
      }
      if (channel === 'quotes:getAll') {
        const convertedQuotesCount = Array.isArray(result)
          ? result.filter((quote) => quote && (quote.status === 'invoiced' || !!quote.convertedInvoiceId)).length
          : 0;
        console.log(`[quotes-api] converted quotes count: ${convertedQuotesCount}`);
      }
      if (actionTag) {
        console.log(`[${actionTag}] ${isActionSuccessful(channel, result) ? 'success' : 'failure'}`);
      }

      if (channel === 'auth:beginLogin' && result?.status === 'success' && result?.user?.id) {
        const nextToken = createToken();
        sessions.set(nextToken, { userId: result.user.id, createdAt: nowIso() });
        console.log('[auth-web] login success', { userId: result.user.id });
        console.log('[http-ipc] success');
        return res.json({
          success: true,
          result: {
            ...result,
            token: nextToken
          }
        });
      }

      if (channel === 'auth:login' && result?.id) {
        const nextToken = createToken();
        sessions.set(nextToken, { userId: result.id, createdAt: nowIso() });
        console.log('[auth-web] login success', { userId: result.id });
        return res.json({
          success: true,
          result: {
            ...result,
            token: nextToken
          }
        });
      }

      if (channel === 'auth:beginLogin') {
        console.log('[http-ipc] success');
      }
      return res.json({ success: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'IPC invoke failed';
      const actionTag = ACTION_CHANNEL_TAGS.get(channel);
      if (channel === 'auth:beginLogin' || channel === 'auth:login') {
        console.warn('[auth-web] login failed:', message);
      }
      if (actionTag) {
        console.warn(`[${actionTag}] failure`, message);
      }
      if (channel === 'auth:beginLogin') {
        console.warn('[http-ipc] failure');
        console.warn('[http-ipc] error details', message);
      }
      return res.status(500).json({ success: false, message });
    } finally {
      clearCurrentUser();
    }
  });

  app.post('/api/uploads/product-image', authMiddleware, (req, res) => {
    const user = req.authUser;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    setCurrentUser(user);
    const canManageStock = hasPermission('manageStock');
    clearCurrentUser();
    if (!canManageStock) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try {
      const fileName = typeof req.body?.fileName === 'string' ? req.body.fileName.trim() : '';
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
      const preferredName = typeof req.body?.preferredName === 'string' ? req.body.preferredName : fileName;

      const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ success: false, message: 'INVALID_IMAGE_DATA' });
      }

      const mime = match[1].toLowerCase();
      const base64Payload = match[2];
      const extension = (() => {
        if (mime.includes('png')) return '.png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
        if (mime.includes('webp')) return '.webp';
        if (mime.includes('gif')) return '.gif';
        if (mime.includes('bmp')) return '.bmp';
        const rawExt = path.extname(fileName || '').toLowerCase();
        return rawExt;
      })();

      if (!IMAGE_EXTENSIONS.has(extension)) {
        return res.status(400).json({ success: false, message: 'INVALID_IMAGE_EXTENSION' });
      }

      const safePrefix = sanitizeBaseName(preferredName || path.basename(fileName, extension));
      const uniquePart = createToken();
      const storedFileName = `${safePrefix}-${uniquePart}${extension}`;
      const absolutePath = path.join(productsImagesDir, storedFileName);
      const buffer = Buffer.from(base64Payload, 'base64');
      fs.writeFileSync(absolutePath, buffer);

      const imageRef = `product-images/${storedFileName}`;
      const imageUrl = resolveProductImageUrl(imageRef);

      return res.json({
        success: true,
        imageRef,
        imageUrl,
        fileName: storedFileName
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'IMAGE_UPLOAD_FAILED';
      return res.status(500).json({ success: false, message });
    }
  });

  return app;
}

function startServer(port = Number(process.env.PORT) || 3001, host = process.env.HOST || '0.0.0.0') {
  if (httpServer) {
    return httpServer;
  }

  const app = createApp();

  httpServer = app.listen(port, host, () => {
    const routing = getDatabaseRoutingSummary();
    console.log(`SPA SERVER running on http://${host}:${port}`);
    console.log('[db-driver] configured driver:', routing.configuredDriver);
    console.log('[db-driver] quotes read opt-in:', routing.quotesReadOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] quotes write opt-in:', routing.quotesWriteOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] invoices read opt-in:', routing.invoicesReadOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] invoices write opt-in:', routing.invoicesWriteOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] catalog read opt-in:', routing.catalogReadOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] product write opt-in:', routing.productWriteOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] stock write opt-in:', routing.stockWriteOptInEnabled ? 'enabled' : 'disabled');
    console.log('[db-driver] postgres-ready scopes:', routing.postgresReadyScopes.join(', '));
    console.log('[db-driver] active postgres scopes:', routing.activePostgresScopes.length ? routing.activePostgresScopes.join(', ') : 'none');
    console.log('Server started');
  });

  httpServer.on('error', (error) => {
    console.error('SPA SERVER error:', error);
  });

  return httpServer;
}

function stopServer() {
  if (!httpServer) {
    return;
  }

  httpServer.close(() => {
    console.log('SPA SERVER stopped');
    httpServer = null;
  });
}

module.exports = {
  startServer,
  stopServer
};

if (require.main === module) {
  startServer();
}
