const crypto = require('crypto');
const { withClient } = require('../../db/postgres');

const TASK_NOTIFICATION_KINDS = new Set(['task_assigned']);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS task_notifications (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  task_id TEXT,
  kind TEXT NOT NULL DEFAULT 'task_assigned',
  actor_name TEXT,
  task_title_fr TEXT,
  task_title_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT task_notifications_kind_check CHECK (kind IN ('task_assigned'))
);

CREATE INDEX IF NOT EXISTS idx_task_notifications_employee_id
  ON task_notifications (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_notifications_read_at
  ON task_notifications (read_at);
`;

let ensureTablePromise = null;

const ensureTaskNotificationsTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = withClient(async (client) => {
      await client.query(CREATE_TABLE_SQL);
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS actor_name TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS task_title_fr TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS task_title_ar TEXT');
    }).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  return ensureTablePromise;
};

const normalizeText = (value) => String(value ?? '').trim();

const normalizeNullableText = (value) => {
  const next = normalizeText(value);
  return next || null;
};

const mapNotificationRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    employeeId: row.employee_id,
    taskId: row.task_id ?? null,
    kind: row.kind,
    actorName: row.actor_name ?? null,
    taskTitleFr: row.task_title_fr ?? null,
    taskTitleAr: row.task_title_ar ?? null,
    createdAt: row.created_at ?? null,
    readAt: row.read_at ?? null,
    isRead: !!row.read_at
  };
};

const createTaskAssignmentNotification = async (payload = {}) => {
  await ensureTaskNotificationsTable();

  const employeeId = normalizeText(payload.employeeId);
  if (!employeeId) {
    return null;
  }

  const kind = TASK_NOTIFICATION_KINDS.has(payload.kind) ? payload.kind : 'task_assigned';
  const id = crypto.randomUUID();

  const result = await withClient((client) =>
    client.query(
      `INSERT INTO task_notifications (
        id,
        employee_id,
        task_id,
        kind,
        actor_name,
        task_title_fr,
        task_title_ar,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING
        id,
        employee_id,
        task_id,
        kind,
        actor_name,
        task_title_fr,
        task_title_ar,
        created_at,
        read_at`,
      [
        id,
        employeeId,
        normalizeNullableText(payload.taskId),
        kind,
        normalizeNullableText(payload.actorName),
        normalizeNullableText(payload.taskTitleFr),
        normalizeNullableText(payload.taskTitleAr)
      ]
    )
  );

  return mapNotificationRow(result.rows[0] ?? null);
};

const listNotificationsByEmployee = async (employeeId, { limit = 20 } = {}) => {
  await ensureTaskNotificationsTable();
  const currentEmployeeId = normalizeText(employeeId);
  if (!currentEmployeeId) {
    return [];
  }

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 20;
  const result = await withClient((client) =>
    client.query(
      `SELECT
         id,
         employee_id,
         task_id,
         kind,
         actor_name,
         task_title_fr,
         task_title_ar,
         created_at,
         read_at
       FROM task_notifications
       WHERE employee_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [currentEmployeeId, safeLimit]
    )
  );

  return result.rows.map(mapNotificationRow);
};

const markNotificationRead = async (id, employeeId) => {
  await ensureTaskNotificationsTable();
  const notificationId = normalizeText(id);
  const currentEmployeeId = normalizeText(employeeId);
  if (!notificationId || !currentEmployeeId) {
    return null;
  }

  const result = await withClient((client) =>
    client.query(
      `UPDATE task_notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND employee_id = $2
       RETURNING
         id,
         employee_id,
         task_id,
         kind,
         actor_name,
         task_title_fr,
         task_title_ar,
         created_at,
         read_at`,
      [notificationId, currentEmployeeId]
    )
  );

  return mapNotificationRow(result.rows[0] ?? null);
};

module.exports = {
  ensureTaskNotificationsTable,
  createTaskAssignmentNotification,
  listNotificationsByEmployee,
  markNotificationRead
};
