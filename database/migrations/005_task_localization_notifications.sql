BEGIN;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS title_fr TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS title_ar TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS description_fr TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_by TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

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

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON tasks (created_by);

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

COMMIT;
