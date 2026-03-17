const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const MAX_BACKUPS = 30;
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const LOCK_WAIT_TIMEOUT_MS = 6000;
const LOCK_WAIT_STEP_MS = 150;

let backupTask = null;
let restoring = false;
let autoBackupTimer = null;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const backupsDirPath = () => path.join(app.getPath('userData'), 'backups');
const logsDirPath = () => path.join(app.getPath('userData'), 'logs');
const backupLogPath = () => path.join(logsDirPath(), 'backups.log');

const appendBackupLog = (message, error) => {
  try {
    ensureDir(logsDirPath());
    const suffix = error ? ` | ${error.message ?? String(error)}` : '';
    const line = `${new Date().toISOString()} | ${message}${suffix}\n`;
    fs.appendFileSync(backupLogPath(), line, 'utf8');
  } catch (logError) {
    console.error('[db-backup] log write failed', logError);
  }
};

const pad = (value) => String(value).padStart(2, '0');

const toBackupFileName = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `spa_${yyyy}-${mm}-${dd}_${hh}-${min}.db`;
};

const resolveUniqueBackupPath = (fileName) => {
  let candidate = path.join(backupsDirPath(), fileName);
  if (!fs.existsSync(candidate)) return candidate;

  const base = fileName.replace(/\.db$/i, '');
  let index = 1;
  while (index < 100) {
    const nextName = `${base}_${pad(index)}.db`;
    candidate = path.join(backupsDirPath(), nextName);
    if (!fs.existsSync(candidate)) return candidate;
    index += 1;
  }

  return path.join(backupsDirPath(), `${base}_${Date.now()}.db`);
};

const isSqliteBusyError = (error) => {
  const text = (error?.message ?? '').toLowerCase();
  return text.includes('database is locked') || text.includes('database is busy') || text.includes('busy');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForWriteIdle = async (db, timeoutMs = LOCK_WAIT_TIMEOUT_MS) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      db.pragma('wal_checkpoint(PASSIVE)');
      return;
    } catch (error) {
      if (!isSqliteBusyError(error)) {
        throw error;
      }
      await sleep(LOCK_WAIT_STEP_MS);
    }
  }
  throw new Error('SQLite is busy, backup canceled after timeout.');
};

const listBackups = () => {
  ensureDir(backupsDirPath());

  return fs.readdirSync(backupsDirPath())
    .filter((fileName) => /^spa_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}(?:_\d{2})?\.db$/.test(fileName))
    .map((fileName) => {
      const filePath = path.join(backupsDirPath(), fileName);
      const stats = fs.statSync(filePath);
      return {
        fileName,
        filePath,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const pruneBackups = () => {
  const backups = listBackups();
  const stale = backups.slice(MAX_BACKUPS);
  for (const item of stale) {
    try {
      fs.unlinkSync(item.filePath);
      appendBackupLog(`old backup removed: ${item.fileName}`);
    } catch (error) {
      appendBackupLog(`failed to remove old backup: ${item.fileName}`, error);
    }
  }
};

const runBackup = async ({ getDb }) => {
  if (restoring) {
    throw new Error('Restore in progress, backup unavailable.');
  }

  ensureDir(backupsDirPath());
  const db = getDb();
  await waitForWriteIdle(db);

  const fileName = toBackupFileName();
  const destination = resolveUniqueBackupPath(fileName);

  // better-sqlite3 backup gives a consistent snapshot even with WAL enabled.
  await db.backup(destination);

  pruneBackups();

  const stats = fs.statSync(destination);
  const result = {
    ok: true,
    fileName: path.basename(destination),
    filePath: destination,
    size: stats.size,
    createdAt: stats.mtime.toISOString()
  };

  appendBackupLog(`backup completed: ${path.basename(destination)}`);
  return result;
};

const backupDatabase = async (options) => {
  if (backupTask) {
    return backupTask;
  }

  backupTask = runBackup(options).catch((error) => {
    appendBackupLog('backup failed', error);
    return {
      ok: false,
      message: error.message ?? String(error)
    };
  }).finally(() => {
    backupTask = null;
  });

  return backupTask;
};

const deleteIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const resolveBackupPath = (backupFile) => {
  if (!backupFile || typeof backupFile !== 'string') {
    throw new Error('Backup file is required.');
  }

  const basePath = path.isAbsolute(backupFile) ? backupFile : path.join(backupsDirPath(), backupFile);
  const normalized = path.normalize(basePath);
  const backupsRoot = path.normalize(`${backupsDirPath()}${path.sep}`).toLowerCase();
  if (!normalized.toLowerCase().startsWith(backupsRoot)) {
    throw new Error('Backup path is invalid.');
  }
  return normalized;
};

const restoreDatabase = async ({ initDb, closeDb, dbFilePath }, backupFile) => {
  if (restoring) {
    return false;
  }

  restoring = true;
  try {
    if (backupTask) {
      await backupTask;
    }

    const source = resolveBackupPath(backupFile);
    if (!fs.existsSync(source)) {
      throw new Error('Selected backup not found.');
    }

    closeDb();

    const target = dbFilePath();
    deleteIfExists(target);
    deleteIfExists(`${target}-wal`);
    deleteIfExists(`${target}-shm`);

    fs.copyFileSync(source, target);

    // Re-open and re-apply PRAGMA / schema checks.
    initDb();
    appendBackupLog(`restore completed: ${path.basename(source)}`);
    return true;
  } catch (error) {
    appendBackupLog('restore failed', error);
    try {
      initDb();
    } catch (reopenError) {
      appendBackupLog('db reopen failed after restore error', reopenError);
    }
    return false;
  } finally {
    restoring = false;
  }
};

const startAutomaticBackups = (options) => {
  if (autoBackupTimer) return;

  void backupDatabase(options);
  autoBackupTimer = setInterval(() => {
    void backupDatabase(options);
  }, AUTO_BACKUP_INTERVAL_MS);

  if (typeof autoBackupTimer.unref === 'function') {
    autoBackupTimer.unref();
  }
};

const stopAutomaticBackups = () => {
  if (!autoBackupTimer) return;
  clearInterval(autoBackupTimer);
  autoBackupTimer = null;
};

module.exports = {
  backupDatabase,
  listBackups,
  restoreDatabase,
  startAutomaticBackups,
  stopAutomaticBackups
};
