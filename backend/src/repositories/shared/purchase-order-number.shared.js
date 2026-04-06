const LEGACY_PURCHASE_ORDER_PATTERN = /^BC-(\d{4})-(\d+)$/i;
const SIMPLE_PURCHASE_ORDER_PATTERN = /^\d+$/;

const parsePurchaseOrderNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (SIMPLE_PURCHASE_ORDER_PATTERN.test(trimmed)) {
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  const legacy = trimmed.toUpperCase().match(LEGACY_PURCHASE_ORDER_PATTERN);
  if (!legacy) return null;

  const parsed = Number(legacy[2]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getNextPurchaseOrderNumber = (values) => {
  const maxSequence = (Array.isArray(values) ? values : []).reduce((max, value) => {
    const parsed = parsePurchaseOrderNumber(value);
    return parsed ? Math.max(max, parsed) : max;
  }, 0);

  return String(maxSequence + 1);
};

module.exports = {
  parsePurchaseOrderNumber,
  getNextPurchaseOrderNumber
};
