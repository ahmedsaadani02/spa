const { one, many } = require('./shared');

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcLigneTtc = (ligne) => (ligne.quantite ?? 0) * (ligne.prixUnitaire ?? 0);

const computeInvoiceTtc = (payload) => {
  if (!payload || typeof payload !== 'object') return 0;
  const lignes = Array.isArray(payload.lignes) ? payload.lignes : [];
  const remiseType = payload.remiseType ?? 'montant';
  const remiseValue = Number(payload.remiseValue ?? 0) || 0;
  const remiseAvantTVA = payload.remiseAvantTVA !== false;

  const ht = lignes.reduce((s, l) => s + calcLigneTtc(l), 0);
  const htApresRemise = remiseAvantTVA
    ? remiseType === 'montant'
      ? ht - remiseValue
      : ht * (1 - remiseValue / 100)
    : ht;
  const tva = lignes.reduce((s, l) => s + calcLigneTtc(l) * ((l.tvaRate ?? 0) / 100), 0);
  return Math.max(0, htApresRemise + tva);
};

// Returns "YYYY-MM" for a given offset (0 = current month, -1 = previous, …)
const monthKey = (offsetMonths = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ── Finance KPIs ───────────────────────────────────────────────────────────────

const getFinanceKpis = async () => {
  const currentMonth = monthKey(0);

  // Fetch invoices: current-month ones + all unpaid ones
  const rows = await many(
    `SELECT payload FROM invoices
     WHERE (payload->>'date') LIKE $1
        OR (payload->>'paymentStatus') != 'paid'`,
    [`${currentMonth}-%`]
  );

  let caMonthTtc = 0;
  let invoicesUnpaidCount = 0;
  let invoicesUnpaidAmount = 0;

  for (const row of rows) {
    const p = row.payload ?? {};
    const ttc = computeInvoiceTtc(p);
    const invoiceMonth = typeof p.date === 'string' ? p.date.slice(0, 7) : '';
    const status = p.paymentStatus ?? 'unpaid';

    if (invoiceMonth === currentMonth) {
      caMonthTtc += ttc;
    }
    if (status !== 'paid') {
      invoicesUnpaidCount += 1;
      invoicesUnpaidAmount += ttc;
    }
  }

  // Quotes created this month
  const quoteRow = await one(
    `SELECT COUNT(*)::int AS cnt FROM quotes
     WHERE (payload->>'date') LIKE $1
        OR (created_at::text) LIKE $2`,
    [`${currentMonth}-%`, `${currentMonth}%`]
  ).catch(() => ({ cnt: 0 }));

  return {
    caMonthTtc: Math.round(caMonthTtc * 1000) / 1000,
    invoicesUnpaidCount,
    invoicesUnpaidAmount: Math.round(invoicesUnpaidAmount * 1000) / 1000,
    quotesThisMonth: quoteRow?.cnt ?? 0
  };
};

// ── Stock KPIs ─────────────────────────────────────────────────────────────────

const getStockKpis = async () => {
  const row = await one(`
    WITH product_stock AS (
      SELECT
        p.id,
        p.low_stock_threshold,
        COALESCE(SUM(s.qty), 0) AS total_qty
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.is_archived = FALSE
        AND p.is_deleted = FALSE
      GROUP BY p.id, p.low_stock_threshold
    )
    SELECT
      COUNT(*)::int                                                          AS total_products,
      COUNT(*) FILTER (WHERE total_qty = 0)::int                            AS rupture_count,
      COUNT(*) FILTER (
        WHERE low_stock_threshold > 0
          AND total_qty > 0
          AND total_qty <= low_stock_threshold
      )::int                                                                 AS low_stock_count
    FROM product_stock
  `);

  return {
    totalProducts: row?.total_products ?? 0,
    lowStockCount: row?.low_stock_count ?? 0,
    ruptureCount: row?.rupture_count ?? 0
  };
};

// ── Tasks KPIs ─────────────────────────────────────────────────────────────────

const getTasksKpis = async (userId) => {
  const [totalRow, myRow] = await Promise.all([
    one(`SELECT COUNT(*)::int AS cnt FROM tasks`),
    userId
      ? one(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
             COUNT(*) FILTER (
               WHERE due_date IS NOT NULL
                 AND due_date < CURRENT_DATE
                 AND status NOT IN ('done')
             )::int AS late
           FROM tasks
           WHERE employee_id = $1`,
          [userId]
        )
      : Promise.resolve({ in_progress: 0, late: 0 })
  ]);

  return {
    totalTasks: totalRow?.cnt ?? 0,
    myTasksInProgress: myRow?.in_progress ?? 0,
    myTasksLate: myRow?.late ?? 0
  };
};

// ── Employees KPIs ─────────────────────────────────────────────────────────────

const getEmployeesKpis = async () => {
  const row = await one(
    `SELECT COUNT(*)::int AS cnt
     FROM employees
     WHERE is_active = TRUE
       AND role != 'developer'`
  );
  return { totalActive: row?.cnt ?? 0 };
};

// ── CA Mensuel (6 derniers mois) ───────────────────────────────────────────────

const getCaMensuel = async () => {
  const months = Array.from({ length: 6 }, (_, i) => monthKey(-(5 - i)));
  const oldest = months[0];

  const rows = await many(
    `SELECT payload
     FROM invoices
     WHERE payload->>'date' >= $1`,
    [`${oldest}-01`]
  );

  const caByMonth = new Map(months.map((m) => [m, 0]));

  for (const row of rows) {
    const p = row.payload ?? {};
    const invoiceMonth = typeof p.date === 'string' ? p.date.slice(0, 7) : '';
    if (caByMonth.has(invoiceMonth)) {
      const ttc = computeInvoiceTtc(p);
      caByMonth.set(invoiceMonth, (caByMonth.get(invoiceMonth) ?? 0) + ttc);
    }
  }

  return months.map((mois) => ({
    mois,
    ca: Math.round((caByMonth.get(mois) ?? 0) * 1000) / 1000
  }));
};

module.exports = {
  getFinanceKpis,
  getStockKpis,
  getTasksKpis,
  getEmployeesKpis,
  getCaMensuel
};
