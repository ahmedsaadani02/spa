const { getPostgresConfig, isPostgresConfigured } = require('../src/config/postgres');
const { query, closePostgresPool } = require('../src/db/postgres');

async function main() {
  if (!isPostgresConfigured()) {
    console.error('[postgres-check] DATABASE_URL is not configured.');
    process.exitCode = 1;
    return;
  }

  const config = getPostgresConfig();
  console.log('[postgres-check] DATABASE_URL detected');
  console.log('[postgres-check] SSL mode:', config.ssl ? 'enabled' : 'disabled');

  const result = await query(
    `
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        version() AS server_version,
        now() AS server_time
    `
  );

  const row = result.rows[0] ?? {};
  console.log('[postgres-check] Connected successfully');
  console.log('[postgres-check] database:', row.database_name ?? null);
  console.log('[postgres-check] user:', row.user_name ?? null);
  console.log('[postgres-check] server time:', row.server_time ?? null);
}

main()
  .catch((error) => {
    console.error('[postgres-check] Connection failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePostgresPool();
  });
