const crypto = require('crypto');
const { withClient } = require('../../db/postgres');
const { resolveTaskProofUrl, storeTaskProofDataUrl } = require('../../utils/task-proof-images');

const TASK_STATUSES = new Set(['todo', 'in_progress', 'done', 'blocked']);
const TASK_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  title_fr TEXT,
  title_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  employee_id TEXT,
  created_by TEXT,
  created_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  employee_note TEXT,
  requires_photo_proof BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by_employee_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT tasks_progress_check CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks (employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks (updated_at DESC);
`;

const CREATE_SUBTASKS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS task_subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  completed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES employees(id) ON DELETE SET NULL
);
`;

const CREATE_PHOTO_PROOFS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS task_photo_proofs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  image_ref TEXT NOT NULL,
  file_name TEXT,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL
);
`;

const CREATE_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS task_update_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  comment TEXT,
  status TEXT,
  progress INTEGER,
  actor_id TEXT,
  actor_name TEXT,
  subtask_id TEXT,
  subtask_title TEXT,
  subtask_completed BOOLEAN,
  photo_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES employees(id) ON DELETE SET NULL
);
`;

let ensureTablePromise = null;

const ensureTasksTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = withClient(async (client) => {
      await client.query(CREATE_TABLE_SQL);
      await client.query(CREATE_SUBTASKS_TABLE_SQL);
      await client.query(CREATE_PHOTO_PROOFS_TABLE_SQL);
      await client.query(CREATE_HISTORY_TABLE_SQL);
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_fr TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_ar TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_fr TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_ar TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_name TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS employee_note TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_photo_proof BOOLEAN NOT NULL DEFAULT FALSE');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_by_employee_at TIMESTAMPTZ');
      await client.query('ALTER TABLE task_subtasks ADD COLUMN IF NOT EXISTS completed_by_name TEXT');
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'tasks_priority_check'
              AND table_name = 'tasks'
          ) THEN
            ALTER TABLE tasks DROP CONSTRAINT tasks_priority_check;
          END IF;
        END $$;
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'tasks_priority_check'
              AND table_name = 'tasks'
          ) THEN
            ALTER TABLE tasks
              ADD CONSTRAINT tasks_priority_check
              CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
          END IF;
        END $$;
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'tasks_created_by_fkey'
              AND table_name = 'tasks'
          ) THEN
            ALTER TABLE tasks
              ADD CONSTRAINT tasks_created_by_fkey
              FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks (created_by)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON task_subtasks (task_id, position)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_task_photo_proofs_task_id ON task_photo_proofs (task_id, created_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_task_update_history_task_id ON task_update_history (task_id, created_at DESC)');
    }).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  return ensureTablePromise;
};

const clampProgress = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeStatus = (value) => {
  const next = String(value ?? '').trim();
  return TASK_STATUSES.has(next) ? next : 'todo';
};

const normalizePriority = (value) => {
  const next = String(value ?? '').trim();
  return TASK_PRIORITIES.has(next) ? next : 'medium';
};

const normalizeText = (value, fallback = '') => String(value ?? fallback).trim();

const normalizeNullableText = (value) => {
  const next = String(value ?? '').trim();
  return next || null;
};

const normalizeBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const computeSubtasksProgress = (subtasks) => {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return null;
  }
  const completedCount = subtasks.filter((subtask) => !!subtask.completed).length;
  return Math.round((completedCount / subtasks.length) * 100);
};

const deriveTaskStatus = ({ requestedStatus, progress, hasSubtasks, existingStatus }) => {
  const desiredStatus = normalizeStatus(requestedStatus || existingStatus);
  if (desiredStatus === 'blocked') {
    return 'blocked';
  }

  if (hasSubtasks) {
    if (progress >= 100) return 'done';
    if (progress > 0) return 'in_progress';
    return desiredStatus === 'in_progress' ? 'in_progress' : 'todo';
  }

  if (progress >= 100) return 'done';
  if (progress > 0) return desiredStatus === 'todo' ? 'in_progress' : desiredStatus;
  return desiredStatus === 'done' ? 'todo' : desiredStatus;
};

const normalizeTaskSubtasksPayload = (subtasks) => {
  if (!Array.isArray(subtasks)) {
    return null;
  }

  return subtasks
    .map((subtask, index) => ({
      id: normalizeNullableText(subtask?.id),
      title: normalizeText(subtask?.title),
      position: index
    }))
    .filter((subtask) => !!subtask.title);
};

const normalizeTaskPayload = (payload = {}, existing = null) => {
  const titleFr = normalizeNullableText(payload.titleFr ?? payload.title_fr ?? payload.title);
  const titleAr = normalizeNullableText(payload.titleAr ?? payload.title_ar);
  const descriptionFr = normalizeNullableText(payload.descriptionFr ?? payload.description_fr ?? payload.description);
  const descriptionAr = normalizeNullableText(payload.descriptionAr ?? payload.description_ar);
  const fallbackTitle = titleFr ?? titleAr;

  if (!fallbackTitle) {
    throw new Error('TASK_TITLE_REQUIRED');
  }

  return {
    title: fallbackTitle,
    titleFr,
    titleAr,
    description: descriptionFr ?? descriptionAr,
    descriptionFr,
    descriptionAr,
    employeeId: normalizeNullableText(payload.employeeId),
    status: normalizeStatus(payload.status ?? existing?.status),
    priority: normalizePriority(payload.priority ?? existing?.priority),
    dueDate: normalizeNullableText(payload.dueDate ?? existing?.due_date),
    progress: clampProgress(payload.progress ?? existing?.progress),
    requiresPhotoProof: hasOwn(payload, 'requiresPhotoProof')
      ? normalizeBoolean(payload.requiresPhotoProof)
      : normalizeBoolean(existing?.requires_photo_proof),
    subtasks: normalizeTaskSubtasksPayload(payload.subtasks)
  };
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const normalizeEmployeeTaskUpdate = (payload = {}, existing = {}) => ({
  status: hasOwn(payload, 'status') ? normalizeStatus(payload.status) : normalizeStatus(existing.status),
  progress: hasOwn(payload, 'progress') ? clampProgress(payload.progress) : clampProgress(existing.progress),
  employeeNote: hasOwn(payload, 'employeeNote') ? normalizeNullableText(payload.employeeNote) : null,
  subtaskUpdates: Array.isArray(payload.subtaskUpdates)
    ? payload.subtaskUpdates
      .map((subtask) => ({
        id: normalizeText(subtask?.id),
        completed: !!subtask?.completed
      }))
      .filter((subtask) => !!subtask.id)
    : [],
  newPhotoProofs: Array.isArray(payload.newPhotoProofs)
    ? payload.newPhotoProofs
      .map((photo, index) => ({
        dataUrl: typeof photo?.dataUrl === 'string' ? photo.dataUrl.trim() : '',
        fileName: normalizeNullableText(photo?.fileName) || `task-proof-${index + 1}`
      }))
      .filter((photo) => !!photo.dataUrl)
    : []
});

const mapSubtaskRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: !!row.completed,
    completedAt: row.completed_at ?? null,
    completedBy: row.completed_by ?? null,
    completedByName: row.completed_by_name ?? null
  };
};

const mapPhotoProofRow = (row) => {
  if (!row) return null;
  let imageUrl = null;
  try {
    imageUrl = resolveTaskProofUrl(row.image_ref);
  } catch (error) {
    console.error('[TASK_PHOTO_PROOF_URL_ERROR]', {
      id: row.id,
      task_id: row.task_id,
      image_ref: row.image_ref,
      error: error?.message,
      stack: error?.stack
    });
    imageUrl = null;
  }
  return {
    id: row.id,
    imageRef: row.image_ref,
    imageUrl,
    fileName: row.file_name ?? null,
    createdBy: row.created_by ?? null,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at ?? null
  };
};

const mapHistoryRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    actionType: row.action_type,
    comment: row.comment ?? null,
    status: row.status ?? null,
    progress: row.progress === null || row.progress === undefined ? null : Number(row.progress),
    actorId: row.actor_id ?? null,
    actorName: row.actor_name ?? null,
    subtaskId: row.subtask_id ?? null,
    subtaskTitle: row.subtask_title ?? null,
    subtaskCompleted: row.subtask_completed === null || row.subtask_completed === undefined ? null : !!row.subtask_completed,
    photoCount: Number(row.photo_count ?? 0),
    createdAt: row.created_at ?? null
  };
};

const mapTaskRow = (row) => {
  if (!row) return null;

  const titleFr = row.title_fr ?? null;
  const titleAr = row.title_ar ?? null;
  const descriptionFr = row.description_fr ?? null;
  const descriptionAr = row.description_ar ?? null;

  return {
    id: row.id,
    title: titleFr || titleAr || row.title,
    titleFr,
    titleAr,
    description: descriptionFr || descriptionAr || row.description || '',
    descriptionFr,
    descriptionAr,
    employeeId: row.employee_id ?? null,
    employeeName: row.employee_name ?? null,
    createdBy: row.created_by ?? null,
    createdByName: row.created_by_name ?? null,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? null,
    progress: Number(row.progress ?? 0),
    employeeNote: row.employee_note ?? null,
    requiresPhotoProof: !!row.requires_photo_proof,
    updatedByEmployeeAt: row.updated_by_employee_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    subtasks: [],
    photoProofs: [],
    updateHistory: []
  };
};

const findEmployeeNameById = async (client, employeeId) => {
  if (!employeeId) {
    return null;
  }

  const result = await client.query(
    'SELECT id, nom FROM employees WHERE id = $1 LIMIT 1',
    [employeeId]
  );
  return result.rows[0] ?? null;
};

const baseSelectSql = `
SELECT
  t.id,
  t.title,
  t.description,
  t.title_fr,
  t.title_ar,
  t.description_fr,
  t.description_ar,
  t.employee_id,
  e.nom AS employee_name,
  t.created_by,
  t.created_by_name,
  t.status,
  t.priority,
  t.due_date,
  t.progress,
  t.employee_note,
  t.requires_photo_proof,
  t.updated_by_employee_at,
  t.created_at,
  t.updated_at
FROM tasks t
LEFT JOIN employees e ON e.id = t.employee_id
`;

const buildEmptyRelationsMap = (taskIds) => new Map(taskIds.map((taskId) => [taskId, []]));

const loadSubtasksByTaskIds = async (client, taskIds) => {
  if (!taskIds.length) {
    return new Map();
  }

  const result = await client.query(
    `SELECT
       id,
       task_id,
       title,
       completed,
       completed_at,
       completed_by,
       completed_by_name,
       position
     FROM task_subtasks
     WHERE task_id = ANY($1::text[])
     ORDER BY task_id ASC, position ASC, created_at ASC`,
    [taskIds]
  );

  const map = buildEmptyRelationsMap(taskIds);
  result.rows.forEach((row) => {
    map.get(row.task_id)?.push(mapSubtaskRow(row));
  });
  return map;
};

const loadPhotoProofsByTaskIds = async (client, taskIds) => {
  if (!taskIds.length) {
    return new Map();
  }

  const result = await client.query(
    `SELECT
       id,
       task_id,
       image_ref,
       file_name,
       created_by,
       created_by_name,
       created_at
     FROM task_photo_proofs
     WHERE task_id = ANY($1::text[])
     ORDER BY task_id ASC, created_at DESC`,
    [taskIds]
  );

  const map = buildEmptyRelationsMap(taskIds);
  result.rows.forEach((row) => {
    map.get(row.task_id)?.push(mapPhotoProofRow(row));
  });
  return map;
};

const loadHistoryByTaskIds = async (client, taskIds) => {
  if (!taskIds.length) {
    return new Map();
  }

  const result = await client.query(
    `SELECT
       id,
       task_id,
       action_type,
       comment,
       status,
       progress,
       actor_id,
       actor_name,
       subtask_id,
       subtask_title,
       subtask_completed,
       photo_count,
       created_at
     FROM task_update_history
     WHERE task_id = ANY($1::text[])
     ORDER BY task_id ASC, created_at DESC`,
    [taskIds]
  );

  const map = buildEmptyRelationsMap(taskIds);
  result.rows.forEach((row) => {
    map.get(row.task_id)?.push(mapHistoryRow(row));
  });
  return map;
};

const hydrateTasks = async (client, tasks) => {
  if (!tasks.length) {
    return tasks;
  }

  const taskIds = tasks.map((task) => task.id);
  const [subtasksMap, photoProofsMap, historyMap] = await Promise.all([
    loadSubtasksByTaskIds(client, taskIds),
    loadPhotoProofsByTaskIds(client, taskIds),
    loadHistoryByTaskIds(client, taskIds)
  ]);

  return tasks.map((task) => ({
    ...task,
    subtasks: subtasksMap.get(task.id) ?? [],
    photoProofs: photoProofsMap.get(task.id) ?? [],
    updateHistory: historyMap.get(task.id) ?? []
  }));
};

const getTaskSubtaskRows = async (client, taskId) => {
  const result = await client.query(
    `SELECT
       id,
       task_id,
       title,
       position,
       completed,
       completed_at,
       completed_by,
       completed_by_name,
       created_at
     FROM task_subtasks
     WHERE task_id = $1
     ORDER BY position ASC, created_at ASC`,
    [taskId]
  );
  return result.rows;
};

const createTaskHistoryEntry = async (client, payload = {}) => {
  await client.query(
    `INSERT INTO task_update_history (
       id,
       task_id,
       action_type,
       comment,
       status,
       progress,
       actor_id,
       actor_name,
       subtask_id,
       subtask_title,
       subtask_completed,
       photo_count,
       created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
     )`,
    [
      crypto.randomUUID(),
      payload.taskId,
      normalizeText(payload.actionType, 'task_updated'),
      normalizeNullableText(payload.comment),
      normalizeNullableText(payload.status),
      payload.progress === null || payload.progress === undefined ? null : clampProgress(payload.progress),
      normalizeNullableText(payload.actorId),
      normalizeNullableText(payload.actorName),
      normalizeNullableText(payload.subtaskId),
      normalizeNullableText(payload.subtaskTitle),
      payload.subtaskCompleted === null || payload.subtaskCompleted === undefined ? null : !!payload.subtaskCompleted,
      Number(payload.photoCount ?? 0)
    ]
  );
};

const createTaskHistoryEntries = async (client, entries = []) => {
  for (const entry of entries) {
    await createTaskHistoryEntry(client, entry);
  }
};

const buildDesiredSubtasks = (desiredSubtasks, existingSubtasks) => {
  const existingById = new Map(existingSubtasks.map((subtask) => [subtask.id, subtask]));
  const keptIds = new Set();
  const nextSubtasks = desiredSubtasks.map((subtask, index) => {
    const existing = subtask.id ? existingById.get(subtask.id) : null;
    const id = existing?.id ?? crypto.randomUUID();
    if (existing) {
      keptIds.add(existing.id);
    }

    return {
      id,
      title: subtask.title,
      position: index,
      completed: existing ? !!existing.completed : false,
      completedAt: existing?.completed_at ?? null,
      completedBy: existing?.completed_by ?? null,
      completedByName: existing?.completed_by_name ?? null
    };
  });

  const deletedIds = existingSubtasks
    .filter((subtask) => !keptIds.has(subtask.id))
    .map((subtask) => subtask.id);

  return { nextSubtasks, deletedIds };
};

const syncTaskSubtasks = async (client, taskId, desiredSubtasks, existingSubtasks) => {
  const { nextSubtasks, deletedIds } = buildDesiredSubtasks(desiredSubtasks, existingSubtasks);
  const existingIds = new Set(existingSubtasks.map((subtask) => subtask.id));

  for (const subtask of nextSubtasks) {
    if (existingIds.has(subtask.id)) {
      await client.query(
        `UPDATE task_subtasks
         SET
           title = $3,
           position = $4,
           updated_at = NOW()
         WHERE id = $1 AND task_id = $2`,
        [subtask.id, taskId, subtask.title, subtask.position]
      );
    } else {
      await client.query(
        `INSERT INTO task_subtasks (
           id,
           task_id,
           title,
           position,
           completed,
           completed_at,
           completed_by,
           completed_by_name,
           created_at,
           updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
         )`,
        [
          subtask.id,
          taskId,
          subtask.title,
          subtask.position,
          subtask.completed,
          subtask.completedAt,
          subtask.completedBy,
          subtask.completedByName
        ]
      );
    }
  }

  if (deletedIds.length) {
    await client.query(
      'DELETE FROM task_subtasks WHERE task_id = $1 AND id = ANY($2::text[])',
      [taskId, deletedIds]
    );
  }

  return nextSubtasks;
};

const insertTaskPhotoProofs = async (client, taskId, actor, photos = []) => {
  const insertedPhotos = [];
  for (const photo of photos) {
    const stored = storeTaskProofDataUrl(photo.dataUrl, photo.fileName || 'task-proof');
    await client.query(
      `INSERT INTO task_photo_proofs (
         id,
         task_id,
         image_ref,
         file_name,
         created_by,
         created_by_name,
         created_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, NOW()
       )`,
      [
        crypto.randomUUID(),
        taskId,
        stored.imageRef,
        stored.fileName,
        normalizeNullableText(actor?.id),
        normalizeNullableText(actor?.name)
      ]
    );
    insertedPhotos.push(stored);
  }
  return insertedPhotos;
};

const countTaskPhotoProofs = async (client, taskId) => {
  const result = await client.query(
    'SELECT COUNT(*)::int AS total FROM task_photo_proofs WHERE task_id = $1',
    [taskId]
  );
  return Number(result.rows[0]?.total ?? 0);
};

const listTasks = async (filters = {}) => {
  await ensureTasksTable();

  const clauses = [];
  const params = [];
  const pushParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const employeeId = normalizeNullableText(filters.employeeId);
  const status = normalizeNullableText(filters.status);
  const priority = normalizeNullableText(filters.priority);

  if (employeeId) {
    clauses.push(`t.employee_id = ${pushParam(employeeId)}`);
  }
  if (status && TASK_STATUSES.has(status)) {
    clauses.push(`t.status = ${pushParam(status)}`);
  }
  if (priority && TASK_PRIORITIES.has(priority)) {
    clauses.push(`t.priority = ${pushParam(priority)}`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return withClient(async (client) => {
    const result = await client.query(
      `${baseSelectSql}
       ${whereSql}
       ORDER BY
         CASE t.status
           WHEN 'blocked' THEN 0
           WHEN 'in_progress' THEN 1
           WHEN 'todo' THEN 2
           ELSE 3
         END,
         CASE t.priority
           WHEN 'urgent' THEN 0
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           ELSE 3
         END,
         t.due_date NULLS LAST,
         t.updated_at DESC`,
      params
    );
    return hydrateTasks(client, result.rows.map(mapTaskRow));
  });
};

const getTaskById = async (id) => {
  await ensureTasksTable();
  const taskId = normalizeText(id);
  if (!taskId) return null;

  return withClient(async (client) => {
    const result = await client.query(`${baseSelectSql} WHERE t.id = $1 LIMIT 1`, [taskId]);
    const tasks = await hydrateTasks(client, [mapTaskRow(result.rows[0] ?? null)].filter(Boolean));
    return tasks[0] ?? null;
  });
};

const getTaskByIdForEmployee = async (id, employeeId) => {
  await ensureTasksTable();
  const taskId = normalizeText(id);
  const currentEmployeeId = normalizeText(employeeId);
  if (!taskId || !currentEmployeeId) return null;

  return withClient(async (client) => {
    const result = await client.query(`${baseSelectSql} WHERE t.id = $1 AND t.employee_id = $2 LIMIT 1`, [taskId, currentEmployeeId]);
    const tasks = await hydrateTasks(client, [mapTaskRow(result.rows[0] ?? null)].filter(Boolean));
    return tasks[0] ?? null;
  });
};

const createTask = async (payload, actor = null) => {
  await ensureTasksTable();
  const normalized = normalizeTaskPayload(payload);
  const desiredSubtasks = normalized.subtasks ?? [];
  const progress = desiredSubtasks.length > 0 ? (computeSubtasksProgress(desiredSubtasks) ?? 0) : normalized.progress;
  const status = deriveTaskStatus({
    requestedStatus: normalized.status,
    progress,
    hasSubtasks: desiredSubtasks.length > 0,
    existingStatus: normalized.status
  });

  return withClient(async (client) => {
    const employee = await findEmployeeNameById(client, normalized.employeeId);
    if (normalized.employeeId && !employee) {
      throw new Error('TASK_EMPLOYEE_NOT_FOUND');
    }

    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO tasks (
        id,
        title,
        description,
        title_fr,
        title_ar,
        description_fr,
        description_ar,
        employee_id,
        created_by,
        created_by_name,
        status,
        priority,
        due_date,
        progress,
        requires_photo_proof,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
      )`,
      [
        id,
        normalized.title,
        normalized.description,
        normalized.titleFr,
        normalized.titleAr,
        normalized.descriptionFr,
        normalized.descriptionAr,
        normalized.employeeId,
        normalizeNullableText(actor?.id),
        normalizeNullableText(actor?.name),
        status,
        normalized.priority,
        normalized.dueDate,
        progress,
        normalized.requiresPhotoProof
      ]
    );

    if (desiredSubtasks.length) {
      await syncTaskSubtasks(client, id, desiredSubtasks, []);
    }

    await createTaskHistoryEntry(client, {
      taskId: id,
      actionType: 'task_created',
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      status,
      progress
    });

    return getTaskById(id);
  });
};

const updateTask = async (id, payload) => {
  await ensureTasksTable();
  const taskId = normalizeText(id);
  if (!taskId) return null;

  return withClient(async (client) => {
    const existing = await client.query(
      `SELECT
         id,
         status,
         progress,
         priority,
         due_date,
         requires_photo_proof
       FROM tasks
       WHERE id = $1
       LIMIT 1`,
      [taskId]
    );
    const existingTask = existing.rows[0] ?? null;
    if (!existingTask) {
      return null;
    }
    const existingSubtasks = await getTaskSubtaskRows(client, taskId);
    const normalized = normalizeTaskPayload(payload, existingTask);
    const desiredSubtasks = normalized.subtasks === null
      ? existingSubtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        position: subtask.position
      }))
      : normalized.subtasks;

    const employee = await findEmployeeNameById(client, normalized.employeeId);
    if (normalized.employeeId && !employee) {
      throw new Error('TASK_EMPLOYEE_NOT_FOUND');
    }

    const nextSubtasks = desiredSubtasks.length
      ? buildDesiredSubtasks(desiredSubtasks, existingSubtasks).nextSubtasks
      : [];
    const progress = nextSubtasks.length > 0 ? (computeSubtasksProgress(nextSubtasks) ?? 0) : normalized.progress;
    const status = deriveTaskStatus({
      requestedStatus: normalized.status,
      progress,
      hasSubtasks: nextSubtasks.length > 0,
      existingStatus: existingTask.status
    });

    await client.query(
      `UPDATE tasks
       SET
         title = $2,
         description = $3,
         title_fr = $4,
         title_ar = $5,
         description_fr = $6,
         description_ar = $7,
         employee_id = $8,
         status = $9,
         priority = $10,
         due_date = $11,
         progress = $12,
         requires_photo_proof = $13,
         updated_at = NOW()
       WHERE id = $1`,
      [
        taskId,
        normalized.title,
        normalized.description,
        normalized.titleFr,
        normalized.titleAr,
        normalized.descriptionFr,
        normalized.descriptionAr,
        normalized.employeeId,
        status,
        normalized.priority,
        normalized.dueDate,
        progress,
        normalized.requiresPhotoProof
      ]
    );

    if (normalized.subtasks !== null) {
      await syncTaskSubtasks(client, taskId, desiredSubtasks, existingSubtasks);
    }

    await createTaskHistoryEntry(client, {
      taskId,
      actionType: 'task_updated',
      status,
      progress
    });

    return getTaskById(taskId);
  });
};

const deleteTask = async (id) => {
  await ensureTasksTable();
  const taskId = normalizeText(id);
  if (!taskId) return false;

  const result = await withClient((client) =>
    client.query('DELETE FROM tasks WHERE id = $1', [taskId])
  );
  return result.rowCount > 0;
};

const listTasksByEmployee = async (employeeId, filters = {}) => {
  await ensureTasksTable();
  const currentEmployeeId = normalizeText(employeeId);
  if (!currentEmployeeId) {
    return [];
  }

  const clauses = ['t.employee_id = $1'];
  const params = [currentEmployeeId];
  const pushParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const status = normalizeNullableText(filters.status);
  const priority = normalizeNullableText(filters.priority);

  if (status && TASK_STATUSES.has(status)) {
    clauses.push(`t.status = ${pushParam(status)}`);
  }
  if (priority && TASK_PRIORITIES.has(priority)) {
    clauses.push(`t.priority = ${pushParam(priority)}`);
  }

  return withClient(async (client) => {
    const result = await client.query(
      `${baseSelectSql}
       WHERE ${clauses.join(' AND ')}
       ORDER BY
         CASE t.status
           WHEN 'blocked' THEN 0
           WHEN 'in_progress' THEN 1
           WHEN 'todo' THEN 2
           ELSE 3
         END,
         CASE t.priority
           WHEN 'urgent' THEN 0
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           ELSE 3
         END,
         t.due_date NULLS LAST,
         t.updated_at DESC`,
      params
    );

    return hydrateTasks(client, result.rows.map(mapTaskRow));
  });
};

const updateTaskByEmployee = async (id, employeeId, payload) => {
  await ensureTasksTable();
  const taskId = normalizeText(id);
  const currentEmployeeId = normalizeText(employeeId);
  if (!taskId || !currentEmployeeId) return null;
  return withClient(async (client) => {
    const existing = await client.query(
      'SELECT id, status, progress, employee_note, requires_photo_proof FROM tasks WHERE id = $1 AND employee_id = $2 LIMIT 1',
      [taskId, currentEmployeeId]
    );
    const existingTask = existing.rows[0] ?? null;
    if (!existingTask) {
      return null;
    }
    const normalized = normalizeEmployeeTaskUpdate(payload, existingTask);
    const actor = await findEmployeeNameById(client, currentEmployeeId);
    const currentSubtasks = await getTaskSubtaskRows(client, taskId);
    const subtasksById = new Map(currentSubtasks.map((subtask) => [subtask.id, subtask]));
    const toggledSubtasks = [];

    for (const subtaskUpdate of normalized.subtaskUpdates) {
      const existingSubtask = subtasksById.get(subtaskUpdate.id);
      if (!existingSubtask || !!existingSubtask.completed === subtaskUpdate.completed) {
        continue;
      }

      const updated = await client.query(
        `UPDATE task_subtasks
         SET
           completed = $3,
           completed_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
           completed_by = CASE WHEN $3 THEN $4 ELSE NULL END,
           completed_by_name = CASE WHEN $3 THEN $5 ELSE NULL END,
           updated_at = NOW()
         WHERE id = $1 AND task_id = $2
         RETURNING
           id,
           title,
           completed,
           completed_at,
           completed_by,
           completed_by_name`,
        [
          subtaskUpdate.id,
          taskId,
          subtaskUpdate.completed,
          currentEmployeeId,
          actor?.nom ?? null
        ]
      );

      if (updated.rows[0]) {
        toggledSubtasks.push(updated.rows[0]);
      }
    }

    const refreshedSubtasks = await getTaskSubtaskRows(client, taskId);
    const hasSubtasks = refreshedSubtasks.length > 0;
    const progress = hasSubtasks
      ? (computeSubtasksProgress(refreshedSubtasks) ?? 0)
      : normalized.progress;
    const status = deriveTaskStatus({
      requestedStatus: normalized.status,
      progress,
      hasSubtasks,
      existingStatus: existingTask.status
    });
    const existingPhotoCount = await countTaskPhotoProofs(client, taskId);
    if (
      normalizeBoolean(existingTask.requires_photo_proof)
      && status === 'done'
      && existingPhotoCount + normalized.newPhotoProofs.length === 0
    ) {
      throw new Error('TASK_PROOF_REQUIRED');
    }
    const insertedPhotos = await insertTaskPhotoProofs(client, taskId, {
      id: currentEmployeeId,
      name: actor?.nom ?? null
    }, normalized.newPhotoProofs);

    await client.query(
      `UPDATE tasks
       SET
         status = $3,
         progress = $4,
         employee_note = $5,
         updated_by_employee_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 AND employee_id = $2`,
      [taskId, currentEmployeeId, status, progress, normalized.employeeNote]
    );

    const historyEntries = toggledSubtasks.map((subtask) => ({
      taskId,
      actionType: subtask.completed ? 'subtask_completed' : 'subtask_reopened',
      status,
      progress,
      actorId: currentEmployeeId,
      actorName: actor?.nom ?? null,
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      subtaskCompleted: !!subtask.completed
    }));

    if (normalized.employeeNote) {
      historyEntries.push({
        taskId,
        actionType: 'comment_added',
        comment: normalized.employeeNote,
        status,
        progress,
        actorId: currentEmployeeId,
        actorName: actor?.nom ?? null
      });
    }

    if (insertedPhotos.length > 0) {
      historyEntries.push({
        taskId,
        actionType: 'photos_added',
        status,
        progress,
        actorId: currentEmployeeId,
        actorName: actor?.nom ?? null,
        photoCount: insertedPhotos.length
      });
    }

    if (historyEntries.length === 0 || (!hasSubtasks && existingTask.progress !== progress) || existingTask.status !== status) {
      historyEntries.push({
        taskId,
        actionType: hasSubtasks ? 'task_progress_recalculated' : 'task_updated',
        status,
        progress,
        actorId: currentEmployeeId,
        actorName: actor?.nom ?? null
      });
    }

    await createTaskHistoryEntries(client, historyEntries);

    return getTaskByIdForEmployee(taskId, currentEmployeeId);
  });
};

module.exports = {
  TASK_STATUSES: Array.from(TASK_STATUSES),
  TASK_PRIORITIES: Array.from(TASK_PRIORITIES),
  ensureTasksTable,
  listTasks,
  listTasksByEmployee,
  getTaskById,
  getTaskByIdForEmployee,
  createTask,
  updateTask,
  updateTaskByEmployee,
  deleteTask
};
