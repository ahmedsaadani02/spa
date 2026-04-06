const { Pool } = require('pg');
const { getPostgresConfig } = require('../config/postgres');

let pool;

const getPostgresPool = () => {
  if (!pool) {
    pool = new Pool(getPostgresConfig());
  }
  return pool;
};

const query = async (text, params = []) => {
  return getPostgresPool().query(text, params);
};

const withClient = async (callback) => {
  const client = await getPostgresPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
};

const closePostgresPool = async () => {
  if (!pool) return;
  const currentPool = pool;
  pool = undefined;
  await currentPool.end();
};

module.exports = {
  getPostgresPool,
  query,
  withClient,
  closePostgresPool
};
