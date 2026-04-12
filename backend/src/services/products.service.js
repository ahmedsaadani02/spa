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
const { resolveProductImageUrl, normalizeImage } = require('../utils/product-images');
const { getUserDisplayName, notifyPrivilegedUsers } = require('./internal-notifications.service');

const normalizeProductRow = (row) => {
  let imageUrl;
  try {
    imageUrl = normalizeImage(row.image_url);
  } catch (error) {
    console.error('[PRODUCT_ROW_NORMALIZE_ERROR]', {
      productId: row.id,
      reference: row.reference,
      image_url: row.image_url,
      error: error.message,
      stack: error.stack
    });
    imageUrl = null;
  }

  console.log('[PRODUCT_ROW_NORMALIZE_DEBUG]', {
    productId: row.id,
    reference: row.reference,
    db_image_url: row.image_url,
    normalized_imageUrl: imageUrl
  });

  return {
    ...row,
    imageUrl
  };
};

const normalizeText = (value) => String(value ?? '').trim();

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
        const rawProducts = await listProducts(getDb());
        return rawProducts.map((row) => {
          try {
            return normalizeProductRow(row);
          } catch (error) {
            console.error('[SERVICE_PRODUCT_ROW_NORMALIZE_ERROR]', {
              productId: row.id,
              reference: row.reference,
              error: error.message,
              stack: error.stack
            });
            // Return row with imageUrl: null
            return {
              ...row,
              imageUrl: null
            };
          }
        });
      });
    },

    async listArchived(token) {
      return withAuthorizedUser(token, async () => {
        assertProductCatalogPermission();
        const rawProducts = await listArchivedProducts(getDb());
        return rawProducts.map((row) => {
          try {
            return normalizeProductRow(row);
          } catch (error) {
            console.error('[SERVICE_PRODUCT_ROW_NORMALIZE_ERROR]', {
              productId: row.id,
              reference: row.reference,
              error: error.message,
              stack: error.stack
            });
            // Return row with imageUrl: null
            return {
              ...row,
              imageUrl: null
            };
          }
        });
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
      return withAuthorizedUser(token, async (user) => {
        assertProductCatalogPermission();
        let result;
        try {
          result = await createProduct(getDb(), payload);
        } catch (error) {
          console.error('[PRODUCT_SERVICE_CREATE_ERROR]', {
            message: error.message,
            stack: error.stack,
            payload: JSON.stringify(payload, null, 2)
          });
          throw error;
        }
        if (!result?.ok) {
          console.error('[PRODUCT_SERVICE_CREATE_VALIDATION_ERROR]', {
            message: result?.message || 'Unknown validation error',
            payload: JSON.stringify(payload, null, 2)
          });
          throw new Error(result?.message || 'PRODUCT_CREATE_VALIDATION_FAILED');
        }
        if (result?.ok) {
          const productLabel = normalizeText(payload?.label) || normalizeText(payload?.reference) || 'produit';
          try {
            await notifyPrivilegedUsers(getDb, user, [{
              kind: 'stock_product_created',
              title: 'Produit ajoute',
              message: `${getUserDisplayName(user)} a ajoute le produit "${productLabel}".`,
              entityType: 'product',
              entityId: result.id,
              route: '/stock',
              metadata: {
                productLabel,
                reference: normalizeText(payload?.reference) || null,
                category: normalizeText(payload?.category) || null,
                serie: normalizeText(payload?.serie) || null
              }
            }]);
          } catch (notificationError) {
            console.error('[PRODUCT_CREATE_NOTIFICATION_ERROR]', {
              message: notificationError.message,
              stack: notificationError.stack,
              productId: result.id
            });
            // Don't fail the creation if notification fails
          }
        }
        return result;
      });
    },

    async update(token, id, payload) {
      return withAuthorizedUser(token, async (user) => {
        assertCanEditStockProduct();
        const result = await updateProduct(getDb(), id, payload);
        if (!result?.ok) {
          console.error('[PRODUCT_SERVICE_UPDATE_VALIDATION_ERROR]', {
            message: result?.message || 'Unknown validation error',
            productId: id,
            payload: JSON.stringify(payload, null, 2)
          });
          throw new Error(result?.message || 'PRODUCT_UPDATE_VALIDATION_FAILED');
        }
        if (result?.ok) {
          const productLabel = normalizeText(payload?.label) || normalizeText(payload?.reference) || 'produit';
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_product_updated',
            title: 'Produit modifie',
            message: `${getUserDisplayName(user)} a modifie le produit "${productLabel}".`,
            entityType: 'product',
            entityId: id,
            route: '/stock',
            metadata: {
              productLabel,
              reference: normalizeText(payload?.reference) || null,
              addedColors: result.addedColors ?? [],
              removedColors: result.removedColors ?? []
            }
          }]);
        }
        return result;
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
      return withAuthorizedUser(token, async (user) => {
        assertCanArchiveStockProduct();
        const result = await archiveProduct(getDb(), id);
        if (result?.ok) {
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_product_archived',
            title: 'Produit archive',
            message: `${getUserDisplayName(user)} a archive un produit du stock.`,
            entityType: 'product',
            entityId: id,
            route: '/archives',
            metadata: {
              productId: id
            }
          }]);
        }
        return result;
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
