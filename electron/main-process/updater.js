const { BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

const UPDATE_STATUS_CHANNEL = 'updates:status';
const UPDATE_CHECK_CHANNEL = 'updates:check';
const UPDATE_INSTALL_CHANNEL = 'updates:install';
const UPDATE_GET_STATUS_CHANNEL = 'updates:get-status';

let initialized = false;
let checkingInProgress = false;
let currentStatus = {
  status: 'none',
  message: 'Mise a jour non initialisee'
};

const log = (message, data) => {
  if (typeof data === 'undefined') {
    console.log(`[auto-update] ${message}`);
    return;
  }
  console.log(`[auto-update] ${message}`, data);
};

const getDialogWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

const broadcastStatus = (payload) => {
  currentStatus = payload;
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(UPDATE_STATUS_CHANNEL, payload);
    }
  }
};

const setStatus = (status, extra = {}) => {
  const payload = { status, ...extra };
  broadcastStatus(payload);
  log(`status -> ${status}`, extra);
};

const showMessage = async (options) => {
  try {
    await dialog.showMessageBox(getDialogWindow(), options);
  } catch (error) {
    log('dialog error', error?.message ?? error);
  }
};

const checkForUpdates = async (origin = 'manual') => {
  if (checkingInProgress) {
    log(`check skipped (${origin}) - already running`);
    return false;
  }

  checkingInProgress = true;
  try {
    log(`checking for updates (${origin})`);
    await autoUpdater.checkForUpdatesAndNotify();
    return true;
  } catch (error) {
    const message = error?.message ?? String(error);
    setStatus('error', { message });
    return false;
  } finally {
    checkingInProgress = false;
  }
};

const registerAutoUpdaterEvents = () => {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    setStatus('checking', { message: 'Recherche des mises a jour...' });
  });

  autoUpdater.on('update-available', (info) => {
    const version = info?.version ?? 'inconnue';
    setStatus('available', {
      message: `Mise a jour disponible: ${version}`,
      version
    });

    void showMessage({
      type: 'info',
      title: 'Mise a jour disponible',
      message: 'Une nouvelle mise a jour est disponible. Telechargement en cours...'
    });
  });

  autoUpdater.on('update-not-available', () => {
    setStatus('none', { message: 'Application deja a jour.' });
  });

  autoUpdater.on('download-progress', (progress) => {
    setStatus('downloading', {
      message: 'Telechargement en cours...',
      percent: Number(progress?.percent ?? 0),
      transferred: Number(progress?.transferred ?? 0),
      total: Number(progress?.total ?? 0),
      bytesPerSecond: Number(progress?.bytesPerSecond ?? 0)
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const version = info?.version ?? 'inconnue';
    setStatus('downloaded', {
      message: `Mise a jour ${version} prete a installer.`,
      version
    });

    const response = await dialog.showMessageBox(getDialogWindow(), {
      type: 'question',
      title: 'Mise a jour prete',
      message: 'La mise a jour est prete. Voulez-vous redemarrer et installer maintenant ?',
      buttons: ['Installer maintenant', 'Plus tard'],
      defaultId: 0,
      cancelId: 1
    });

    if (response.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (error) => {
    const message = error?.message ?? String(error);
    setStatus('error', { message });
    log('error', message);
  });
};

const registerUpdateIpc = (ipcMain) => {
  ipcMain.removeHandler(UPDATE_CHECK_CHANNEL);
  ipcMain.removeHandler(UPDATE_INSTALL_CHANNEL);
  ipcMain.removeHandler(UPDATE_GET_STATUS_CHANNEL);

  ipcMain.handle(UPDATE_CHECK_CHANNEL, async () => checkForUpdates('renderer'));

  ipcMain.handle(UPDATE_INSTALL_CHANNEL, async () => {
    if (currentStatus.status !== 'downloaded') {
      return false;
    }
    autoUpdater.quitAndInstall();
    return true;
  });

  ipcMain.handle(UPDATE_GET_STATUS_CHANNEL, async () => currentStatus);
};

const initAutoUpdater = ({ app, ipcMain }) => {
  if (initialized) {
    return;
  }

  initialized = true;
  registerUpdateIpc(ipcMain);

  if (!app.isPackaged) {
    setStatus('none', { message: 'Auto-update desactive en mode developpement.' });
    log('auto-update disabled in development');
    return;
  }

  registerAutoUpdaterEvents();
  void checkForUpdates('startup');
};

module.exports = {
  initAutoUpdater,
  UPDATE_STATUS_CHANNEL,
  UPDATE_CHECK_CHANNEL,
  UPDATE_INSTALL_CHANNEL,
  UPDATE_GET_STATUS_CHANNEL
};
