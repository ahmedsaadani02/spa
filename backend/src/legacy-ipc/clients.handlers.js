const {
  listClients,
  searchClients,
  upsertClient,
  deleteClientById,
  getClientRowById,
  mapClientRow,
  findOrCreateClient
} = require('../repositories/clients.runtime.repository');
const { assertPermission } = require('../services/auth-session.service');

const registerClientsHandlers = (ipcMain, getDb) => {
  ipcMain.handle('clients:list', async () => {
    try {
      assertPermission('manageClients');
      return await listClients(getDb());
    } catch (error) {
      console.error('[clients:list] error', error);
      return [];
    }
  });

  ipcMain.handle('clients:getById', async (event, id) => {
    try {
      assertPermission('manageClients');
      if (!id) return null;
      return mapClientRow(await getClientRowById(getDb(), id));
    } catch (error) {
      console.error('[clients:getById] error', error);
      return null;
    }
  });

  ipcMain.handle('clients:search', async (event, query) => {
    try {
      assertPermission('manageClients');
      return await searchClients(getDb(), query ?? '');
    } catch (error) {
      console.error('[clients:search] error', error);
      return [];
    }
  });

  ipcMain.handle('clients:upsert', async (event, client) => {
    try {
      assertPermission('manageClients');
      if (!client || typeof client !== 'object') return null;
      return await upsertClient(getDb(), client);
    } catch (error) {
      console.error('[clients:upsert] error', error);
      return null;
    }
  });

  ipcMain.handle('clients:delete', async (event, id) => {
    try {
      assertPermission('manageClients');
      return await deleteClientById(getDb(), id);
    } catch (error) {
      console.error('[clients:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('clients:findOrCreate', async (event, client, preferredId) => {
    try {
      assertPermission('manageClients');
      if (!client || typeof client !== 'object') return null;
      return await findOrCreateClient(getDb(), client, preferredId ?? null);
    } catch (error) {
      console.error('[clients:findOrCreate] error', error);
      return null;
    }
  });
};

module.exports = { registerClientsHandlers };
