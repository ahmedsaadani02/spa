const quotesReadRepository = require('../repositories/quotes-read.runtime.repository');
const sqliteQuotesReadRepository = require('../repositories/sqlite/quotes-read.repository');
const sqliteQuotesWriteRepository = require('../repositories/sqlite/quotes-write.repository');
const quotesWriteRepository = require('../repositories/quotes-write.runtime.repository');
const quotesConvertRepository = require('../repositories/quotes-convert.runtime.repository');
const { assertPermission } = require('../services/auth-session.service');

const registerHandle = (ipcMain, channel, handler) => {
  try {
    ipcMain.removeHandler(channel);
  } catch {
    // ignore
  }
  ipcMain.handle(channel, handler);
};

const { listQuotes, getQuoteById } = sqliteQuotesReadRepository;
const { putQuote, deleteQuote } = sqliteQuotesWriteRepository;
const convertQuoteToInvoice = (db, quoteId) => quotesConvertRepository.convertQuoteToInvoice(db, quoteId);

const registerQuotesHandlers = (ipcMain, getDb) => {
  console.log('[ipc] registering quotes handlers');

  registerHandle(ipcMain, 'quotes:getAll', async () => {
    try {
      assertPermission('manageQuotes');
      return await quotesReadRepository.listQuotes(getDb());
    } catch (error) {
      console.error('[quotes:getAll] error', error);
      return [];
    }
  });

  registerHandle(ipcMain, 'quotes:getById', async (event, id) => {
    try {
      assertPermission('manageQuotes');
      return await quotesReadRepository.getQuoteById(getDb(), id);
    } catch (error) {
      console.error('[quotes:getById] error', error);
      return null;
    }
  });

  registerHandle(ipcMain, 'quotes:put', async (event, quote) => {
    try {
      assertPermission('manageQuotes');
      return await quotesWriteRepository.putQuote(getDb(), quote);
    } catch (error) {
      console.error('[quotes:put] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'quotes:delete', async (event, id) => {
    try {
      assertPermission('manageQuotes');
      return await quotesWriteRepository.deleteQuote(getDb(), id);
    } catch (error) {
      console.error('[quotes:delete] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'quotes:convertToInvoice', async (event, quoteId) => {
    try {
      assertPermission('manageQuotes');
      assertPermission('manageInvoices');
      return await convertQuoteToInvoice(getDb(), quoteId);
    } catch (error) {
      console.error('[quotes:convertToInvoice] error', error);
      return { ok: false, message: error.message || 'QUOTE_CONVERT_FAILED' };
    }
  });

  console.log('[ipc] quotes:convertToInvoice registered');
  console.log('[ipc] quotes handlers ready');
};

module.exports = {
  registerQuotesHandlers,
  listQuotes,
  getQuoteById,
  putQuote,
  deleteQuote,
  convertQuoteToInvoice
};
