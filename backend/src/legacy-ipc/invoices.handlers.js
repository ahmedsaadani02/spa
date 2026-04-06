const invoicesReadRepository = require('../repositories/invoices-read.runtime.repository');
const sqliteInvoicesReadRepository = require('../repositories/sqlite/invoices-read.repository');
const invoicesWriteRepository = require('../repositories/invoices-write.runtime.repository');
const invoicesDeleteRepository = require('../repositories/invoices-delete.runtime.repository');
const sqliteInvoicesWriteRepository = require('../repositories/sqlite/invoices-write.repository');
const sqliteInvoicesDeleteRepository = require('../repositories/sqlite/invoices-delete.repository');
const { assertPermission } = require('../services/auth-session.service');

const { listInvoices, getInvoiceById } = sqliteInvoicesReadRepository;
const { putInvoice } = sqliteInvoicesWriteRepository;
const { deleteInvoice } = sqliteInvoicesDeleteRepository;

const registerInvoicesHandlers = (ipcMain, getDb) => {
  ipcMain.handle('invoices:getAll', async () => {
    try {
      assertPermission('manageInvoices');
      return await invoicesReadRepository.listInvoices(getDb());
    } catch (error) {
      console.error('[invoices:getAll] error', error);
      return [];
    }
  });

  ipcMain.handle('invoices:getById', async (event, id) => {
    try {
      assertPermission('manageInvoices');
      return await invoicesReadRepository.getInvoiceById(getDb(), id);
    } catch (error) {
      console.error('[invoices:getById] error', error);
      return null;
    }
  });

  ipcMain.handle('invoices:put', async (event, invoice) => {
    try {
      assertPermission('manageInvoices');
      return await invoicesWriteRepository.putInvoice(getDb(), invoice);
    } catch (error) {
      console.error('[invoices:put] error', error);
      return false;
    }
  });

  ipcMain.handle('invoices:delete', async (event, id) => {
    try {
      assertPermission('manageInvoices');
      return await invoicesDeleteRepository.deleteInvoice(getDb(), id);
    } catch (error) {
      console.error('[invoices:delete] error', error);
      return false;
    }
  });
};

module.exports = {
  registerInvoicesHandlers,
  listInvoices,
  getInvoiceById,
  putInvoice,
  deleteInvoice
};
