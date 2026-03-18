const { assertPermission } = require('./auth-session.service');
const {
  listProducts,
  listArchivedProducts,
  getProductMetadata,
  upsertProductMetadata,
  createProduct,
  updateProduct,
  upsertProduct,
  archiveProduct,
  restoreProduct,
  purgeProduct,
  updateVariantPriceWithHistory,
  getPriceHistory,
  assertProductCatalogPermission
} = require('../legacy-ipc/products.handlers');
const { normalizeStoredProductImageRef } = require('../utils/product-images');

const normalizeProductRow = (row) => ({
  ...row,
  image_url: normalizeStoredProductImageRef(row.image_url) || row.image_url || null
});

const createProductsService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, () => {
        assertPermission('viewStock');
        return listProducts(getDb()).map(normalizeProductRow);
      });
    },

    async listArchived(token) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return listArchivedProducts(getDb()).map(normalizeProductRow);
      });
    },

    async metadata(token) {
      return withAuthorizedUser(token, () => {
        assertPermission('viewStock');
        return getProductMetadata(getDb());
      });
    },

    async addMetadata(token, kind, value) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return upsertProductMetadata(getDb(), kind, value);
      });
    },

    async create(token, payload) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return createProduct(getDb(), payload);
      });
    },

    async update(token, id, payload) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return updateProduct(getDb(), id, payload);
      });
    },

    async upsert(token, product) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return upsertProduct(getDb(), product);
      });
    },

    async delete(token, id) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return archiveProduct(getDb(), id).ok;
      });
    },

    async archive(token, id) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return archiveProduct(getDb(), id);
      });
    },

    async restore(token, id) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return restoreProduct(getDb(), id);
      });
    },

    async purge(token, id) {
      return withAuthorizedUser(token, () => {
        assertProductCatalogPermission();
        return purgeProduct(getDb(), id);
      });
    },

    async updatePrice(token, productId, color, newPrice, changedBy) {
      return withAuthorizedUser(token, (user) => {
        assertProductCatalogPermission();
        return updateVariantPriceWithHistory(getDb(), productId, color, newPrice, user?.username ?? changedBy);
      });
    },

    async priceHistory(token, productId, color) {
      return withAuthorizedUser(token, () => {
        assertPermission('viewStock');
        return getPriceHistory(getDb(), productId, color);
      });
    },

    async restorePrice(token, productId, color, targetPrice, changedBy) {
      return withAuthorizedUser(token, (user) => {
        assertProductCatalogPermission();
        return updateVariantPriceWithHistory(getDb(), productId, color, targetPrice, user?.username ?? changedBy, { allowZero: true });
      });
    }
  };
};

module.exports = { createProductsService };
