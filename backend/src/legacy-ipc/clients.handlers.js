const {
  listClients,
  searchClients,
  upsertClient,
  deleteClientById,
  getClientRowById,
  mapClientRow,
  findOrCreateClient
} = require('../repositories/clients.repository');
const { assertPermission } = require('../services/auth-session.service');

const registerClientsHandlers = (ipcMain, getDb) => {
  ipcMain.handle('clients:list', () => {
    try {
      assertPermission('manageClients');
      return listClients(getDb());
    } catch (error) {
      console.error('[clients:list] error', error);
      return [];
    }
  });

  ipcMain.handle('clients:getById', (event, id) => {
    try {
      assertPermission('manageClients');
      if (!id) return null;
      return mapClientRow(getClientRowById(getDb(), id));
    } catch (error) {
      console.error('[clients:getById] error', error);
      return null;
    }
  });

  ipcMain.handle('clients:search', (event, query) => {
    try {
      assertPermission('manageClients');
      return searchClients(getDb(), query ?? '');
    } catch (error) {
      console.error('[clients:search] error', error);
      return [];
    }
  });

  ipcMain.handle('clients:upsert', (event, client) => {
    try {
      assertPermission('manageClients');
      if (!client || typeof client !== 'object') return null;
      return upsertClient(getDb(), client);
    } catch (error) {
      console.error('[clients:upsert] error', error);
      return null;
    }
  });

  ipcMain.handle('clients:delete', (event, id) => {
    try {
      assertPermission('manageClients');
      return deleteClientById(getDb(), id);
    } catch (error) {
      console.error('[clients:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('clients:findOrCreate', (event, client, preferredId) => {
    try {
      assertPermission('manageClients');
      if (!client || typeof client !== 'object') return null;
      return findOrCreateClient(getDb(), client, preferredId ?? null);
    } catch (error) {
      console.error('[clients:findOrCreate] error', error);
      return null;
    }
  });
};

module.exports = { registerClientsHandlers };
