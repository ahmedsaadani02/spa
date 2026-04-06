BEGIN;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  employee_id TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  employee_note TEXT,
  updated_by_employee_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT tasks_progress_check CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX IF NOT EXISTS idx_tasks_employee_id
  ON tasks (employee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON tasks (status);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
  ON tasks (priority);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON tasks (due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_updated_at
  ON tasks (updated_at DESC);

COMMIT;
