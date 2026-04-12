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
  // Handle common database errors
  if (message.includes('connect') || message.includes('ECONNREFUSED') || message.includes('pool')) {
    return { status: 503, message: 'Database temporarily unavailable' };
  }
  if (message.includes('duplicate key') || message.includes('unique constraint') || message.includes('violates unique constraint')) {
    return { status: 409, message: 'Reference already exists' };
  }
  if (message.includes('relation') && message.includes('does not exist')) {
    return { status: 500, message: 'Database schema error' };
  }
  if (message.includes('invalid input syntax') || message.includes('violates not-null constraint') || message.includes('violates check constraint')) {
    return { status: 400, message: 'Invalid data provided' };
  }
  if (message.includes('timeout') || message.includes('canceling statement due to statement timeout')) {
    return { status: 504, message: 'Request timeout' };
  }
  // For any other errors, return 500 but with more specific logging
  console.error('[UNHANDLED_ERROR_TYPE]', {
    message,
    type: typeof error,
    isError: error instanceof Error,
    stack: error?.stack
  });
  return { status: 500, message: 'Internal server error' };
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
      return res.status(400).json({ ok: false, mode: 'create', message: 'product payload is required' });
    }

    try {
      const result = await productsService.create(getBearerToken(req), payload);
      if (result?.ok === false) {
        console.error('[PRODUCT_CREATE_VALIDATION_ERROR]', {
          message: result.message,
          payload: JSON.stringify(payload, null, 2)
        });
        const failure = toHttpFailure(new Error(result.message), 'PRODUCT_CREATE_FAILED');
        return res.status(failure.status).json({ ok: false, mode: 'create', message: failure.message });
      }
      return res.json({ ok: true, result });
    } catch (error) {
      console.error('[PRODUCT_CREATE_ERROR]', {
        message: error.message,
        stack: error.stack,
        payload: JSON.stringify(payload, null, 2),
        token: getBearerToken(req) ? '[PRESENT]' : '[MISSING]'
      });
      const failure = toHttpFailure(error, 'PRODUCT_CREATE_FAILED');
      return res.status(failure.status).json({ ok: false, mode: 'create', message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const payload = req.body;
    if (!id.trim() || !payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, mode: 'update', message: 'id and product payload are required' });
    }

    try {
      const result = await productsService.update(getBearerToken(req), id, payload);
      if (result?.ok === false) {
        console.error('[PRODUCT_UPDATE_VALIDATION_ERROR]', {
          message: result.message,
          productId: id,
          payload: JSON.stringify(payload, null, 2)
        });
        const failure = toHttpFailure(new Error(result.message), 'PRODUCT_UPDATE_FAILED');
        return res.status(failure.status).json({ ok: false, mode: 'update', message: failure.message });
      }
      return res.json({ ok: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_UPDATE_FAILED');
      return res.status(failure.status).json({ ok: false, mode: 'update', message: failure.message });
    }
  },

  async upsert(req, res) {
    const product = req.body;
    if (!product || typeof product !== 'object') {
      return res.status(400).json({ ok: false, mode: 'upsert', message: 'product payload is required' });
    }

    try {
      const result = await productsService.upsert(getBearerToken(req), product);
      if (result?.ok === false) {
        console.error('[PRODUCT_UPSERT_VALIDATION_ERROR]', {
          message: result.message,
          productId: product.id,
          payload: JSON.stringify(product, null, 2)
        });
        const failure = toHttpFailure(new Error(result.message), 'PRODUCT_UPSERT_FAILED');
        return res.status(failure.status).json({ ok: false, mode: 'upsert', message: failure.message });
      }
      return res.json({ ok: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'PRODUCT_UPSERT_FAILED');
      return res.status(failure.status).json({ ok: false, mode: 'upsert', message: failure.message });
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
