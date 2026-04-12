const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

const toHttpFailure = (error, fallback) => {
  const message = error instanceof Error ? error.message : fallback;
  if (message === 'NOT_AUTHENTICATED' || message === 'UNAUTHORIZED') {
    return { status: 401, message: 'Unauthorized' };
  }
  if (message === 'FORBIDDEN') {
    return { status: 403, message: 'Forbidden' };
  }
  if (message === 'PRODUCT_REFERENCE_ALREADY_EXISTS') {
    return { status: 409, message: 'Reference already exists' };
  }
  if (message === 'PRODUCT_IMAGE_URL_INVALID') {
    return { status: 400, message: 'Invalid image URL format' };
  }
  if (message === 'PRODUCT_LABEL_REQUIRED' || message === 'PRODUCT_COLORS_REQUIRED' || message === 'INVALID_PAYLOAD') {
    return { status: 400, message: message.replace(/_/g, ' ').toLowerCase() };
  }
  return { status: 500, message };
};

const createProductsController = ({ productsService }) => ({
  async list(req, res) {
    try {
      const result = await productsService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCTS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async listArchived(req, res) {
    try {
      const result = await productsService.listArchived(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCTS_ARCHIVED_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async metadata(req, res) {
    try {
      const result = await productsService.metadata(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCTS_METADATA_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async addMetadata(req, res) {
    const kind = typeof req.body?.kind === 'string' ? req.body.kind : '';
    const value = typeof req.body?.value === 'string' ? req.body.value : '';
    if (!kind.trim() || !value.trim()) {
      return res.status(400).json({ success: false, message: 'kind and value are required' });
    }

    try {
      const result = await productsService.addMetadata(getBearerToken(req), kind, value);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_METADATA_ADD_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'product payload is required' });
    }

    try {
      const result = await productsService.create(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      console.error('[PRODUCT_CREATE_ERROR]', {
        message: error.message,
        stack: error.stack,
        payload: JSON.stringify(payload, null, 2),
        token: getBearerToken(req) ? '[PRESENT]' : '[MISSING]'
      });
      const failure = toHttpFailure(error, 'PRODUCT_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const payload = req.body;
    if (!id.trim() || !payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'id and product payload are required' });
    }

    try {
      const result = await productsService.update(getBearerToken(req), id, payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async upsert(req, res) {
    const product = req.body;
    if (!product || typeof product !== 'object') {
      return res.status(400).json({ success: false, message: 'product payload is required' });
    }

    try {
      const result = await productsService.upsert(getBearerToken(req), product);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_UPSERT_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await productsService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async archive(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await productsService.archive(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_ARCHIVE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async restore(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await productsService.restore(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_RESTORE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async purge(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await productsService.purge(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_PURGE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async updatePrice(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const color = req.body?.color;
    const newPrice = req.body?.newPrice;
    const changedBy = req.body?.changedBy;
    if (!id.trim() || typeof color !== 'string' || typeof newPrice !== 'number') {
      return res.status(400).json({ success: false, message: 'id, color and newPrice are required' });
    }

    try {
      const result = await productsService.updatePrice(getBearerToken(req), id, color, newPrice, changedBy);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_UPDATE_PRICE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async priceHistory(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const color = typeof req.query?.color === 'string' ? req.query.color : '';
    if (!id.trim() || !color.trim()) {
      return res.status(400).json({ success: false, message: 'id and color are required' });
    }

    try {
      const result = await productsService.priceHistory(getBearerToken(req), id, color);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_PRICE_HISTORY_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async restorePrice(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const color = req.body?.color;
    const targetPrice = req.body?.targetPrice;
    const changedBy = req.body?.changedBy;
    if (!id.trim() || typeof color !== 'string' || typeof targetPrice !== 'number') {
      return res.status(400).json({ success: false, message: 'id, color and targetPrice are required' });
    }

    try {
      const result = await productsService.restorePrice(getBearerToken(req), id, color, targetPrice, changedBy);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_RESTORE_PRICE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createProductsController };
