const { assertPermission } = require('./auth-session.service');
const {
  listProducts,
  listArchivedProducts,
  getProductMetadata,
} = require('../repositories/catalog-read.runtime.repository');
const { getPriceHistory } = require('../repositories/price-history-read.runtime.repository');
const {
  upsertProductMetadata,
  createProduct,
  updateProduct,
  updateVariantPriceWithHistory,
  purgeProduct,
  upsertProduct,
  archiveProduct,
  restoreProduct
} = require('../repositories/product-write.runtime.repository');
const {
  assertProductCatalogPermission,
  assertCanEditStockProduct,
  assertCanArchiveStockProduct
} = require('../legacy-ipc/products.handlers');
const { normalizeStoredProductImageRef } = require('../utils/product-images');

const normalizeProductRow = (row) => ({
  ...row,
  image_url: normalizeStoredProductImageRef(row.image_url) || row.image_url || null
});

const createProductsService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return await operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, async () => {
        assertPermission('viewStock');
        return (await listProducts(getDb())).map(normalizeProductRow);
      });
    },

    async listArchived(token) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return (await listArchivedProducts(getDb())).map(normalizeProductRow);
      });
    },

    async metadata(token) {
      return withAuthorizedUser(token, async () => {
        assertPermission('viewStock');
        return await getProductMetadata(getDb());
      });
    },

    async addMetadata(token, kind, value) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return await upsertProductMetadata(getDb(), kind, value);
      });
    },

    async create(token, payload) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return await createProduct(getDb(), payload);
      });
    },

    async update(token, id, payload) {
      return withAuthorizedUser(token, async () => {
        assertCanEditStockProduct();
        return await updateProduct(getDb(), id, payload);
      });
    },

    async upsert(token, product) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return await upsertProduct(getDb(), product);
      });
    },

    async delete(token, id) {
      return withAuthorizedUser(token, async () => {
        assertCanArchiveStockProduct();
        return (await archiveProduct(getDb(), id)).ok;
      });
    },

    async archive(token, id) {
      return withAuthorizedUser(token, async () => {
        assertCanArchiveStockProduct();
        return await archiveProduct(getDb(), id);
      });
    },

    async restore(token, id) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return await restoreProduct(getDb(), id);
      });
    },

    async purge(token, id) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        return await purgeProduct(getDb(), id);
      });
    },

    async updatePrice(token, productId, color, newPrice, changedBy) {
      return withAuthorizedUser(token, async (user) => {
        assertProductCatalogPermission();
        return await updateVariantPriceWithHistory(getDb(), productId, color, newPrice, user?.username ?? changedBy);
      });
    },

    async priceHistory(token, productId, color) {
      return withAuthorizedUser(token, async () => {
        assertPermission('viewStock');
        return await getPriceHistory(getDb(), productId, color);
      });
    },

    async restorePrice(token, productId, color, targetPrice, changedBy) {
      return withAuthorizedUser(token, async (user) => {
        assertProductCatalogPermission();
        return await updateVariantPriceWithHistory(getDb(), productId, color, targetPrice, user?.username ?? changedBy, { allowZero: true });
      });
    }
  };
};

module.exports = { createProductsService };
