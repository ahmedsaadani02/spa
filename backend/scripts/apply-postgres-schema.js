const fs = require('fs');
const path = require('path');
const { isPostgresConfigured, getPostgresConfig } = require('../src/config/postgres');
const { withClient, closePostgresPool } = require('../src/db/postgres');

const projectRoot = path.join(__dirname, '..', '..');
const defaultSchemaPath = path.join(projectRoot, 'database', 'schema', '001_postgres_initial_draft.sql');

const getSchemaPath = () => {
  const argPath = process.argv[2];
  if (!argPath) {
    return defaultSchemaPath;
  }

  return path.isAbsolute(argPath) ? argPath : path.join(projectRoot, argPath);
};

async function main() {
  if (!isPostgresConfigured()) {
    console.error('[postgres-schema] DATABASE_URL is not configured.');
    process.exitCode = 1;
    return;
  }

  const schemaPath = getSchemaPath();
  if (!fs.existsSync(schemaPath)) {
    console.error(`[postgres-schema] Schema file not found: ${schemaPath}`);
    process.exitCode = 1;
    return;
  }

  const config = getPostgresConfig();
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[postgres-schema] Target schema file:', schemaPath);
  console.log('[postgres-schema] SSL mode:', config.ssl ? 'enabled' : 'disabled');

  await withClient(async (client) => {
    const meta = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        current_schema() AS schema_name
    `);
    const row = meta.rows[0] ?? {};

    console.log('[postgres-schema] Connected successfully');
    console.log('[postgres-schema] database:', row.database_name ?? null);
    console.log('[postgres-schema] user:', row.user_name ?? null);
    console.log('[postgres-schema] schema:', row.schema_name ?? null);

    await client.query(sql);
    console.log('[postgres-schema] Schema applied successfully');
  });
}

main()
  .catch((error) => {
    console.error('[postgres-schema] Schema apply failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePostgresPool();
  });
