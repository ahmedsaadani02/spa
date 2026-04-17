const { PLACEHOLDER_IMAGE, normalizeStoredProductImageRef } = require('../../utils/product-images');

const PRODUCT_METADATA_KINDS = new Set(['category', 'serie', 'color']);
const DEFAULT_COLORS = ['blanc', 'gris', 'noir'];

const normalizeText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return (trimmed || fallback).normalize('NFC');
};

const normalizeTag = (value, fallback = '') => {
  const normalized = normalizeText(value, fallback)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || fallback;
};

const normalizeMetadataKind = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'series') return 'serie';
  return PRODUCT_METADATA_KINDS.has(normalized) ? normalized : null;
};

const normalizeActor = (value) => {
  if (typeof value !== 'string') return 'erp-user';
  const trimmed = value.trim();
  return trimmed || 'erp-user';
};

const sortColors = (colors) => {
  const priority = new Map(DEFAULT_COLORS.map((color, index) => [color, index]));
  return [...colors].sort((a, b) => {
    const aOrder = priority.has(a) ? priority.get(a) : Number.MAX_SAFE_INTEGER;
    const bOrder = priority.has(b) ? priority.get(b) : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return Number(aOrder) - Number(bOrder);
    }
    return a.localeCompare(b);
  });
};

const normalizeColor = (value) => {
  const color = normalizeTag(value);
  return color || null;
};

const normalizeColorArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueColors = new Set();
  values.forEach((value) => {
    const color = normalizeColor(value);
    if (color) {
      uniqueColors.add(color);
    }
  });

  return sortColors(Array.from(uniqueColors));
};

const isTrue = (value) => value === true || value === 1 || value === '1' || value === 't' || value === 'true';

module.exports = {
  DEFAULT_COLORS,
  PLACEHOLDER_IMAGE,
  normalizeStoredProductImageRef,
  normalizeText,
  normalizeTag,
  normalizeMetadataKind,
  normalizeActor,
  sortColors,
  normalizeColor,
  normalizeColorArray,
  isTrue
};
