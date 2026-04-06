const { many } = require('./shared');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const listMovements = async () => {
  const rows = await many(`
    SELECT
      id,
      product_id AS "itemId",
      reference,
      label,
      category,
      serie,
      color,
      type,
      delta,
      before,
      after,
      reason,
      COALESCE(employee_name, actor) AS actor,
      employee_id AS "employeeId",
      username,
      at
    FROM movements
    ORDER BY at DESC
  `);

  return rows.map((row) => ({
    ...row,
    delta: toNumber(row.delta),
    before: toNumber(row.before),
    after: toNumber(row.after)
  }));
};

module.exports = {
  listMovements
};
