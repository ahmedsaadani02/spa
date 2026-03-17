const { contextBridge, ipcRenderer } = require('electron');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isObject = (value) => value !== null && typeof value === 'object';
const toNumber = (value) => (Number.isFinite(value) ? value : Number(value));
const toBool = (value) => value === true;
const hasMissingHandlerError = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('No handler registered');
};

const spa = {
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  documents: {
    print: (options) => ipcRenderer.invoke('documents:print', isObject(options) ? options : {}),
    exportPdf: (options) => ipcRenderer.invoke('documents:exportPdf', isObject(options) ? options : {})
  },
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    install: () => ipcRenderer.invoke('updates:install'),
    getStatus: () => ipcRenderer.invoke('updates:get-status'),
    onStatus: (listener) => {
      if (typeof listener !== 'function') {
        return () => {};
      }

      const wrappedListener = (_event, payload) => listener(payload);
      ipcRenderer.on('updates:status', wrappedListener);

      return () => {
        ipcRenderer.removeListener('updates:status', wrappedListener);
      };
    }
  },
  auth: {
    login: (username, password) => (
      isNonEmptyString(username) && isNonEmptyString(password)
        ? ipcRenderer.invoke('auth:login', username.trim(), password)
        : null
    ),
    beginLogin: (identity, password, context) => (
      isNonEmptyString(identity) && isNonEmptyString(password)
        ? ipcRenderer.invoke('auth:beginLogin', identity.trim(), password, isObject(context) ? context : null)
        : { status: 'invalid_credentials' }
    ),
    setupProtectedPassword: (email, newPassword, context) => (
      isNonEmptyString(email) && isNonEmptyString(newPassword)
        ? ipcRenderer.invoke('auth:setupProtectedPassword', email.trim(), newPassword, isObject(context) ? context : null)
        : { ok: false, status: 'operation_failed' }
    ),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    hasPermission: (permissionKey) => (
      isNonEmptyString(permissionKey)
        ? ipcRenderer.invoke('auth:hasPermission', permissionKey)
        : false
    ),
    resetPassword: (employeeId, newPassword) => (
      isNonEmptyString(employeeId) && isNonEmptyString(newPassword)
        ? ipcRenderer.invoke('auth:resetPassword', employeeId, newPassword)
        : false
    )
  },
  employees: {
    list: () => ipcRenderer.invoke('employees:list'),
    search: (query) => ipcRenderer.invoke('employees:search', typeof query === 'string' ? query : ''),
    getById: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('employees:getById', id) : null),
    create: (payload) => (isObject(payload) ? ipcRenderer.invoke('employees:create', payload) : null),
    update: (id, payload) => (
      isNonEmptyString(id) && isObject(payload) ? ipcRenderer.invoke('employees:update', id, payload) : null
    ),
    delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('employees:delete', id) : false),
    setActive: (id, actif) => (
      isNonEmptyString(id) ? ipcRenderer.invoke('employees:setActive', id, toBool(actif)) : false
    )
  },
  salary: {
    advances: {
      list: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:advances:list', employeeId, toNumber(month), toNumber(year))
          : []
      ),
      create: (payload) => (isObject(payload) ? ipcRenderer.invoke('salary:advances:create', payload) : null),
      delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('salary:advances:delete', id) : false),
      total: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:advances:total', employeeId, toNumber(month), toNumber(year))
          : 0
      )
    },
    bonuses: {
      list: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:bonuses:list', employeeId, toNumber(month), toNumber(year))
          : []
      ),
      create: (payload) => (isObject(payload) ? ipcRenderer.invoke('salary:bonuses:create', payload) : null),
      delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('salary:bonuses:delete', id) : false),
      total: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:bonuses:total', employeeId, toNumber(month), toNumber(year))
          : 0
      )
    },
    overtimes: {
      list: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:overtimes:list', employeeId, toNumber(month), toNumber(year))
          : []
      ),
      create: (payload) => (isObject(payload) ? ipcRenderer.invoke('salary:overtimes:create', payload) : null),
      delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('salary:overtimes:delete', id) : false),
      totalHours: (employeeId, month, year) => (
        isNonEmptyString(employeeId)
          ? ipcRenderer.invoke('salary:overtimes:totalHours', employeeId, toNumber(month), toNumber(year))
          : 0
      )
    },
    summary: (employeeId, month, year) => (
      isNonEmptyString(employeeId)
        ? ipcRenderer.invoke('salary:summary', employeeId, toNumber(month), toNumber(year))
        : null
    )
  },
  clients: {
    list: () => ipcRenderer.invoke('clients:list'),
    getById: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('clients:getById', id) : null),
    search: (query) => ipcRenderer.invoke('clients:search', typeof query === 'string' ? query : ''),
    upsert: (client) => (isObject(client) ? ipcRenderer.invoke('clients:upsert', client) : null),
    delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('clients:delete', id) : false),
    findOrCreate: (client, preferredId) => (
      isObject(client) ? ipcRenderer.invoke('clients:findOrCreate', client, preferredId ?? null) : null
    )
  },
  invoices: {
    getAll: () => ipcRenderer.invoke('invoices:getAll'),
    getById: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('invoices:getById', id) : null),
    put: (invoice) => (isObject(invoice) ? ipcRenderer.invoke('invoices:put', invoice) : false),
    delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('invoices:delete', id) : false)
  },
  quotes: {
    getAll: () => ipcRenderer.invoke('quotes:getAll'),
    getById: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('quotes:getById', id) : null),
    put: (quote) => (isObject(quote) ? ipcRenderer.invoke('quotes:put', quote) : false),
    delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('quotes:delete', id) : false),
    convertToInvoice: async (id) => {
      if (!isNonEmptyString(id)) {
        return { ok: false, message: 'QUOTE_ID_REQUIRED' };
      }
      try {
        return await ipcRenderer.invoke('quotes:convertToInvoice', id);
      } catch (error) {
        if (hasMissingHandlerError(error)) {
          return { ok: false, message: 'IPC_HANDLER_NOT_REGISTERED: quotes:convertToInvoice' };
        }
        return { ok: false, message: 'QUOTE_CONVERT_FAILED' };
      }
    }
  },
  products: {
    list: () => ipcRenderer.invoke('products:list'),
    listArchived: () => ipcRenderer.invoke('products:listArchived'),
    metadata: () => ipcRenderer.invoke('products:metadata'),
    addMetadata: (kind, value) => (
      isNonEmptyString(kind) && isNonEmptyString(value)
        ? ipcRenderer.invoke('products:addMetadata', kind, value)
        : { ok: false, message: 'PRODUCT_METADATA_INVALID' }
    ),
    create: (payload) => (isObject(payload) ? ipcRenderer.invoke('products:create', payload) : { ok: false }),
    update: (id, payload) => (
      isNonEmptyString(id) && isObject(payload) ? ipcRenderer.invoke('products:update', id, payload) : { ok: false, message: 'PRODUCT_ID_REQUIRED' }
    ),
    selectImage: async () => {
      try {
        return await ipcRenderer.invoke('products:select-image');
      } catch (error) {
        if (hasMissingHandlerError(error)) {
          return { canceled: true, error: 'IPC_HANDLER_NOT_REGISTERED' };
        }
        return { canceled: true, error: 'IMAGE_SELECTION_FAILED' };
      }
    },
    upsert: (product) => (isObject(product) ? ipcRenderer.invoke('products:upsert', product) : false),
    delete: (id) => (isNonEmptyString(id) ? ipcRenderer.invoke('products:delete', id) : false),
    archive: async (id) => {
      if (!isNonEmptyString(id)) {
        return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
      }
      try {
        return await ipcRenderer.invoke('products:archive', id);
      } catch (error) {
        if (hasMissingHandlerError(error)) {
          return { ok: false, message: 'IPC_HANDLER_NOT_REGISTERED: products:archive' };
        }
        return { ok: false, message: 'PRODUCT_ARCHIVE_FAILED' };
      }
    },
    restore: async (id) => {
      if (!isNonEmptyString(id)) {
        return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
      }
      try {
        return await ipcRenderer.invoke('products:restore', id);
      } catch (error) {
        if (hasMissingHandlerError(error)) {
          return { ok: false, message: 'IPC_HANDLER_NOT_REGISTERED: products:restore' };
        }
        return { ok: false, message: 'PRODUCT_RESTORE_FAILED' };
      }
    },
    purge: async (id) => {
      if (!isNonEmptyString(id)) {
        return { ok: false, message: 'PRODUCT_ID_REQUIRED' };
      }
      try {
        return await ipcRenderer.invoke('products:purge', id);
      } catch (error) {
        if (hasMissingHandlerError(error)) {
          return { ok: false, message: 'IPC_HANDLER_NOT_REGISTERED: products:purge' };
        }
        return { ok: false, message: 'PRODUCT_PURGE_FAILED' };
      }
    },
    updatePrice: (productId, color, newPrice, changedBy) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('products:updatePrice', productId, color, toNumber(newPrice), changedBy ?? 'erp-user')
        : false
    ),
    priceHistory: (productId, color) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('products:priceHistory', productId, color)
        : []
    ),
    restorePrice: (productId, color, targetPrice, changedBy) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('products:restorePrice', productId, color, toNumber(targetPrice), changedBy ?? 'erp-user')
        : false
    )
  },
  stock: {
    getAll: () => ipcRenderer.invoke('stock:getAll'),
    getItems: () => ipcRenderer.invoke('stock:items'),
    applyMovement: (movement) => (isObject(movement) ? ipcRenderer.invoke('stock:applyMovement', movement) : false),
    setQty: (productId, color, qty) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('stock:setQty', productId, color, toNumber(qty))
        : false
    ),
    increment: (productId, color, delta) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('stock:increment', productId, color, toNumber(delta))
        : false
    ),
    decrement: (productId, color, delta) => (
      isNonEmptyString(productId) && isNonEmptyString(color)
        ? ipcRenderer.invoke('stock:decrement', productId, color, toNumber(delta))
        : false
    )
  },
  movements: {
    list: () => ipcRenderer.invoke('movements:list'),
    add: (movement) => (isObject(movement) ? ipcRenderer.invoke('movements:add', movement) : false)
  },
  inventory: {
    get: () => ipcRenderer.invoke('inventaire:get')
  },
  db: {
    backup: () => ipcRenderer.invoke('db:backup'),
    listBackups: () => ipcRenderer.invoke('db:list-backups'),
    restore: (backupFileName) => (
      isNonEmptyString(backupFileName)
        ? ipcRenderer.invoke('db:restore', backupFileName)
        : false
    )
  }
};

contextBridge.exposeInMainWorld('spa', spa);
