const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportPdf: () => ipcRenderer.invoke('export-pdf')
});

contextBridge.exposeInMainWorld('apiInvoices', {
  getAll: () => ipcRenderer.invoke('invoices:getAll'),
  getById: (id) => ipcRenderer.invoke('invoices:getById', id),
  put: (invoice) => ipcRenderer.invoke('invoices:put', invoice),
  delete: (id) => ipcRenderer.invoke('invoices:delete', id)
});

contextBridge.exposeInMainWorld('apiQuotes', {
  getAll: () => ipcRenderer.invoke('quotes:getAll'),
  getById: (id) => ipcRenderer.invoke('quotes:getById', id),
  put: (quote) => ipcRenderer.invoke('quotes:put', quote),
  delete: (id) => ipcRenderer.invoke('quotes:delete', id)
});
