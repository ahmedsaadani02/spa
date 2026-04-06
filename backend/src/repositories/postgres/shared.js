const { query } = require('../../db/postgres');

const one = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] ?? null;
};

const many = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

const exec = async (text, params = []) => {
  return query(text, params);
};

module.exports = {
  one,
  many,
  exec
};
