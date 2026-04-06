const crypto = require('crypto');
const { one, many, exec } = require('./shared');

const createId = () => crypto.randomUUID?.() ?? `sal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return parsed;
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const monthYearFromDate = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
};

const mapAdvanceRow = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  montant: toNumber(row.montant),
  note: row.note ?? '',
  dateAvance: row.date_avance,
  moisReference: toInt(row.mois_reference),
  anneeReference: toInt(row.annee_reference),
  createdAt: row.created_at
});

const mapBonusRow = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  montant: toNumber(row.montant),
  motif: row.motif ?? '',
  datePrime: row.date_prime,
  moisReference: toInt(row.mois_reference),
  anneeReference: toInt(row.annee_reference),
  createdAt: row.created_at
});

const mapOvertimeRow = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  heuresSupplementaires: toNumber(row.hours),
  tauxHoraire: toNumber(row.hourly_rate),
  montant: toNumber(row.amount),
  motif: row.note ?? '',
  dateHeuresSup: row.overtime_date,
  moisReference: toInt(row.mois_reference),
  anneeReference: toInt(row.annee_reference),
  createdAt: row.created_at
});

const countWorkingHoursForMonth = (month, year) => {
  const normalizedMonth = toInt(month);
  const normalizedYear = toInt(year);
  if (normalizedMonth < 1 || normalizedMonth > 12 || normalizedYear < 2000) {
    const now = new Date();
    return countWorkingHoursForMonth(now.getMonth() + 1, now.getFullYear());
  }

  const daysInMonth = new Date(normalizedYear, normalizedMonth, 0).getDate();
  let weekdaysCount = 0;
  let saturdayCount = 0;
  let sundayCount = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekDay = new Date(normalizedYear, normalizedMonth - 1, day).getDay();
    if (weekDay >= 1 && weekDay <= 5) {
      weekdaysCount += 1;
      continue;
    }
    if (weekDay === 6) {
      saturdayCount += 1;
      continue;
    }
    sundayCount += 1;
  }

  const heuresNormales = (weekdaysCount * 8) + (saturdayCount * 6);
  return {
    month: normalizedMonth,
    year: normalizedYear,
    weekdaysCount,
    saturdayCount,
    sundayCount,
    heuresNormales
  };
};

const listAdvancesByEmployee = async (_db, employeeId, month, year) => {
  const rows = await many(
    `
      SELECT id, employee_id, montant, note, date_avance, mois_reference, annee_reference, created_at
      FROM salary_advances
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
      ORDER BY date_avance DESC
    `,
    [employeeId, month, year]
  );
  return rows.map(mapAdvanceRow);
};

const createAdvance = async (_db, payload) => {
  const dateAvance = normalizeText(payload.dateAvance) || nowIso();
  const baseMonthYear = monthYearFromDate(dateAvance);
  const month = toInt(payload.moisReference, baseMonthYear.month);
  const year = toInt(payload.anneeReference, baseMonthYear.year);
  const amount = toNumber(payload.montant);

  if (!payload.employeeId || amount <= 0) {
    throw new Error('Donnees avance invalides.');
  }

  const row = {
    id: createId(),
    employee_id: payload.employeeId,
    montant: amount,
    note: normalizeText(payload.note),
    date_avance: dateAvance,
    mois_reference: month,
    annee_reference: year,
    created_at: nowIso()
  };

  await exec(
    `
      INSERT INTO salary_advances (
        id, employee_id, montant, note, date_avance, mois_reference, annee_reference, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
    `,
    [row.id, row.employee_id, row.montant, row.note, row.date_avance, row.mois_reference, row.annee_reference, row.created_at]
  );

  return mapAdvanceRow(row);
};

const deleteAdvance = async (_db, advanceId) => {
  if (!advanceId) return false;
  const result = await exec('DELETE FROM salary_advances WHERE id = $1', [advanceId]);
  return Number(result.rowCount ?? 0) > 0;
};

const getMonthlyAdvanceTotal = async (_db, employeeId, month, year) => {
  const row = await one(
    `
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM salary_advances
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
    `,
    [employeeId, month, year]
  );
  return toNumber(row?.total);
};

const listBonusesByEmployee = async (_db, employeeId, month, year) => {
  const rows = await many(
    `
      SELECT id, employee_id, montant, motif, date_prime, mois_reference, annee_reference, created_at
      FROM salary_bonuses
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
      ORDER BY date_prime DESC
    `,
    [employeeId, month, year]
  );
  return rows.map(mapBonusRow);
};

const createBonus = async (_db, payload) => {
  const datePrime = normalizeText(payload.datePrime) || nowIso();
  const baseMonthYear = monthYearFromDate(datePrime);
  const month = toInt(payload.moisReference, baseMonthYear.month);
  const year = toInt(payload.anneeReference, baseMonthYear.year);
  const amount = toNumber(payload.montant);

  if (!payload.employeeId || amount <= 0) {
    throw new Error('Donnees prime invalides.');
  }

  const row = {
    id: createId(),
    employee_id: payload.employeeId,
    montant: amount,
    motif: normalizeText(payload.motif),
    date_prime: datePrime,
    mois_reference: month,
    annee_reference: year,
    created_at: nowIso()
  };

  await exec(
    `
      INSERT INTO salary_bonuses (
        id, employee_id, montant, motif, date_prime, mois_reference, annee_reference, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
    `,
    [row.id, row.employee_id, row.montant, row.motif, row.date_prime, row.mois_reference, row.annee_reference, row.created_at]
  );

  return mapBonusRow(row);
};

const deleteBonus = async (_db, bonusId) => {
  if (!bonusId) return false;
  const result = await exec('DELETE FROM salary_bonuses WHERE id = $1', [bonusId]);
  return Number(result.rowCount ?? 0) > 0;
};

const getMonthlyBonusTotal = async (_db, employeeId, month, year) => {
  const row = await one(
    `
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM salary_bonuses
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
    `,
    [employeeId, month, year]
  );
  return toNumber(row?.total);
};

const listOvertimesByEmployee = async (_db, employeeId, month, year) => {
  const rows = await many(
    `
      SELECT id, employee_id, hours, hourly_rate, amount, note, overtime_date, mois_reference, annee_reference, created_at
      FROM salary_overtimes
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
      ORDER BY overtime_date DESC
    `,
    [employeeId, month, year]
  );
  return rows.map(mapOvertimeRow);
};

const createOvertime = async (_db, payload) => {
  const overtimeDate = normalizeText(payload.dateHeuresSup) || nowIso();
  const baseMonthYear = monthYearFromDate(overtimeDate);
  const month = toInt(payload.moisReference, baseMonthYear.month);
  const year = toInt(payload.anneeReference, baseMonthYear.year);
  const hours = toNumber(payload.heuresSupplementaires);

  if (!payload.employeeId || hours <= 0) {
    throw new Error('Donnees heures supplementaires invalides.');
  }

  const employee = await one(
    `
      SELECT id, salaire_base
      FROM employees
      WHERE id = $1
      LIMIT 1
    `,
    [payload.employeeId]
  );

  if (!employee) {
    throw new Error('Salarie introuvable.');
  }

  const salaryBase = toNumber(employee.salaire_base);
  const hoursModel = countWorkingHoursForMonth(month, year);
  const hourlyRate = hoursModel.heuresNormales > 0 ? salaryBase / hoursModel.heuresNormales : 0;
  const amount = hours * hourlyRate;

  const row = {
    id: createId(),
    employee_id: payload.employeeId,
    hours,
    hourly_rate: hourlyRate,
    amount,
    note: normalizeText(payload.motif),
    overtime_date: overtimeDate,
    mois_reference: month,
    annee_reference: year,
    created_at: nowIso()
  };

  await exec(
    `
      INSERT INTO salary_overtimes (
        id, employee_id, hours, hourly_rate, amount, note, overtime_date, mois_reference, annee_reference, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `,
    [
      row.id,
      row.employee_id,
      row.hours,
      row.hourly_rate,
      row.amount,
      row.note,
      row.overtime_date,
      row.mois_reference,
      row.annee_reference,
      row.created_at
    ]
  );

  return mapOvertimeRow(row);
};

const deleteOvertime = async (_db, overtimeId) => {
  if (!overtimeId) return false;
  const result = await exec('DELETE FROM salary_overtimes WHERE id = $1', [overtimeId]);
  return Number(result.rowCount ?? 0) > 0;
};

const getMonthlyOvertimeTotals = async (_db, employeeId, month, year) => {
  const row = await one(
    `
      SELECT
        COALESCE(SUM(hours), 0) AS total_hours,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM salary_overtimes
      WHERE employee_id = $1
        AND mois_reference = $2
        AND annee_reference = $3
    `,
    [employeeId, month, year]
  );

  return {
    totalHours: toNumber(row?.total_hours),
    totalAmount: toNumber(row?.total_amount)
  };
};

const getSalarySummary = async (_db, employeeId, month, year) => {
  const employee = await one(
    `
      SELECT id, nom, salaire_base
      FROM employees
      WHERE id = $1
      LIMIT 1
    `,
    [employeeId]
  );

  if (!employee) return null;

  const totalAdvances = await getMonthlyAdvanceTotal(null, employeeId, month, year);
  const totalBonuses = await getMonthlyBonusTotal(null, employeeId, month, year);
  const overtimeTotals = await getMonthlyOvertimeTotals(null, employeeId, month, year);
  const salaireBase = toNumber(employee.salaire_base);
  const hoursModel = countWorkingHoursForMonth(month, year);
  const tauxHoraire = hoursModel.heuresNormales > 0 ? salaireBase / hoursModel.heuresNormales : 0;

  return {
    employeeId: employee.id,
    nom: employee.nom,
    moisReference: month,
    anneeReference: year,
    salaireBase,
    totalAdvances,
    totalBonuses,
    heuresNormalesMois: hoursModel.heuresNormales,
    joursSemaine: hoursModel.weekdaysCount,
    samedis: hoursModel.saturdayCount,
    dimanches: hoursModel.sundayCount,
    tauxHoraire,
    totalOvertimeHours: overtimeTotals.totalHours,
    totalOvertimeAmount: overtimeTotals.totalAmount,
    resteAPayer: salaireBase + totalBonuses + overtimeTotals.totalAmount - totalAdvances
  };
};

module.exports = {
  listAdvancesByEmployee,
  createAdvance,
  deleteAdvance,
  getMonthlyAdvanceTotal,
  listBonusesByEmployee,
  createBonus,
  deleteBonus,
  getMonthlyBonusTotal,
  listOvertimesByEmployee,
  createOvertime,
  deleteOvertime,
  getMonthlyOvertimeTotals,
  getSalarySummary
};
