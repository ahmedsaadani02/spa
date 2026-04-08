const crypto = require('crypto');
const { withClient } = require('../../db/postgres');

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS task_notifications (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  task_id TEXT,
  kind TEXT NOT NULL DEFAULT 'task_assigned',
  actor_id TEXT,
  actor_role TEXT,
  actor_name TEXT,
  title TEXT,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  route TEXT,
  task_title_fr TEXT,
  task_title_ar TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_task_notifications_employee_id
  ON task_notifications (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_notifications_read_at
  ON task_notifications (read_at);

CREATE INDEX IF NOT EXISTS idx_task_notifications_kind
  ON task_notifications (kind, created_at DESC);
`;

let ensureTablePromise = null;

const ensureTaskNotificationsTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = withClient(async (client) => {
      await client.query(CREATE_TABLE_SQL);
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS actor_id TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS actor_role TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS actor_name TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS title TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS message TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS entity_type TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS entity_id TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS route TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS task_title_fr TEXT');
      await client.query('ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS task_title_ar TEXT');
      await client.query(`ALTER TABLE task_notifications ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_name = 'task_notifications'
              AND constraint_name = 'task_notifications_kind_check'
          ) THEN
            ALTER TABLE task_notifications DROP CONSTRAINT task_notifications_kind_check;
          END IF;
        END $$;
      `);
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

const normalizeMetadata = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
};

const mapNotificationRow = (row) => {
  if (!row) return null;

  const metadataValue = row.metadata && typeof row.metadata === 'object'
    ? row.metadata
    : (() => {
      try {
        return row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
        return {};
      }
    })();

  return {
    id: row.id,
    employeeId: row.employee_id,
    recipientUserId: row.employee_id,
    taskId: row.task_id ?? null,
    actorId: row.actor_id ?? null,
    actorRole: row.actor_role ?? null,
    kind: row.kind,
    actorName: row.actor_name ?? null,
    title: row.title ?? null,
    message: row.message ?? null,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? row.task_id ?? null,
    route: row.route ?? null,
    taskTitleFr: row.task_title_fr ?? null,
    taskTitleAr: row.task_title_ar ?? null,
    metadata: metadataValue,
    createdAt: row.created_at ?? null,
    readAt: row.read_at ?? null,
    isRead: !!row.read_at
  };
};

const createNotification = async (payload = {}) => {
  await ensureTaskNotificationsTable();

  const recipientUserId = normalizeText(payload.recipientUserId ?? payload.employeeId);
  if (!recipientUserId) {
    return null;
  }

  const id = crypto.randomUUID();
  const entityType = normalizeNullableText(payload.entityType)
    || (normalizeNullableText(payload.taskId) ? 'task' : null);
  const entityId = normalizeNullableText(payload.entityId)
    || normalizeNullableText(payload.taskId);
  const route = normalizeNullableText(payload.route);
  const taskId = entityType === 'task'
    ? normalizeNullableText(payload.taskId ?? entityId)
    : normalizeNullableText(payload.taskId);

  const result = await withClient((client) =>
    client.query(
      `INSERT INTO task_notifications (
        id,
        employee_id,
        task_id,
        kind,
        actor_id,
        actor_role,
        actor_name,
        title,
        message,
        entity_type,
        entity_id,
        route,
        task_title_fr,
        task_title_ar,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, NOW())
      RETURNING
        id,
        employee_id,
        task_id,
        kind,
        actor_id,
        actor_role,
        actor_name,
        title,
        message,
        entity_type,
        entity_id,
        route,
        task_title_fr,
        task_title_ar,
        metadata,
        created_at,
        read_at`,
      [
        id,
        recipientUserId,
        taskId,
        normalizeText(payload.kind || 'activity'),
        normalizeNullableText(payload.actorUserId ?? payload.actorId),
        normalizeNullableText(payload.actorRole),
        normalizeNullableText(payload.actorName),
        normalizeNullableText(payload.title),
        normalizeNullableText(payload.message),
        entityType,
        entityId,
        route,
        normalizeNullableText(payload.taskTitleFr),
        normalizeNullableText(payload.taskTitleAr),
        JSON.stringify(normalizeMetadata(payload.metadata))
      ]
    )
  );

  return mapNotificationRow(result.rows[0] ?? null);
};

const createNotifications = async (payloads = []) => {
  const notifications = [];
  for (const payload of payloads) {
    const notification = await createNotification(payload);
    if (notification) {
      notifications.push(notification);
    }
  }
  return notifications;
};

const createTaskAssignmentNotification = async (payload = {}) => {
  const taskTitleFr = normalizeNullableText(payload.taskTitleFr);
  const taskTitleAr = normalizeNullableText(payload.taskTitleAr);
  const taskTitle = taskTitleFr || taskTitleAr || 'tache';
  const actorName = normalizeNullableText(payload.actorName) || 'Utilisateur';

  return createNotification({
    recipientUserId: payload.employeeId,
    taskId: payload.taskId,
    kind: 'task_assigned',
    actorUserId: payload.actorUserId,
    actorRole: payload.actorRole,
    actorName,
    title: 'Nouvelle tache assignee',
    message: `${actorName} vous a assigne la tache "${taskTitle}".`,
    entityType: 'task',
    entityId: payload.taskId,
    route: '/my-tasks',
    taskTitleFr,
    taskTitleAr,
    metadata: {
      ...(normalizeMetadata(payload.metadata)),
      taskTitleFr,
      taskTitleAr
    }
  });
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
         actor_id,
         actor_role,
         actor_name,
         title,
         message,
         entity_type,
         entity_id,
         route,
         task_title_fr,
         task_title_ar,
         metadata,
         created_at,
         read_at
       FROM task_notifications
       WHERE employee_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [currentEmployeeId, safeLimit]
    )
  );

  return result.rows.map(mapNotificationRow).filter(Boolean);
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
         actor_id,
         actor_role,
         actor_name,
         title,
         message,
         entity_type,
         entity_id,
         route,
         task_title_fr,
         task_title_ar,
         metadata,
         created_at,
         read_at`,
      [notificationId, currentEmployeeId]
    )
  );

  return mapNotificationRow(result.rows[0] ?? null);
};

const markAllNotificationsRead = async (employeeId) => {
  await ensureTaskNotificationsTable();
  const currentEmployeeId = normalizeText(employeeId);
  if (!currentEmployeeId) {
    return 0;
  }

  const result = await withClient((client) =>
    client.query(
      `UPDATE task_notifications
       SET read_at = NOW()
       WHERE employee_id = $1
         AND read_at IS NULL`,
      [currentEmployeeId]
    )
  );

  return Number(result.rowCount ?? 0) || 0;
};

module.exports = {
  ensureTaskNotificationsTable,
  createNotification,
  createNotifications,
  createTaskAssignmentNotification,
  listNotificationsByEmployee,
  markNotificationRead,
  markAllNotificationsRead
};
