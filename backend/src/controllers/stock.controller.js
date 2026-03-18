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
  return { status: 500, message };
};

const createStockController = ({ stockService }) => ({
  async list(req, res) {
    try {
      const result = await stockService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async items(req, res) {
    try {
      const result = await stockService.items(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_ITEMS_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async applyMovement(req, res) {
    const movement = req.body;
    if (!movement || typeof movement !== 'object') {
      return res.status(400).json({ success: false, message: 'movement payload is required' });
    }

    try {
      const result = await stockService.applyMovement(getBearerToken(req), movement);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_APPLY_MOVEMENT_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async setQty(req, res) {
    const productId = typeof req.params?.productId === 'string' ? req.params.productId : '';
    const color = typeof req.params?.color === 'string' ? req.params.color : '';
    const qty = req.body?.qty;
    if (!productId.trim() || !color.trim() || typeof qty !== 'number') {
      return res.status(400).json({ success: false, message: 'productId, color and qty are required' });
    }

    try {
      const result = await stockService.setQty(getBearerToken(req), productId, color, qty);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_SET_QTY_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async increment(req, res) {
    const productId = typeof req.params?.productId === 'string' ? req.params.productId : '';
    const color = typeof req.params?.color === 'string' ? req.params.color : '';
    const delta = req.body?.delta;
    if (!productId.trim() || !color.trim() || typeof delta !== 'number') {
      return res.status(400).json({ success: false, message: 'productId, color and delta are required' });
    }

    try {
      const result = await stockService.increment(getBearerToken(req), productId, color, delta);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_INCREMENT_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async decrement(req, res) {
    const productId = typeof req.params?.productId === 'string' ? req.params.productId : '';
    const color = typeof req.params?.color === 'string' ? req.params.color : '';
    const delta = req.body?.delta;
    if (!productId.trim() || !color.trim() || typeof delta !== 'number') {
      return res.status(400).json({ success: false, message: 'productId, color and delta are required' });
    }

    try {
      const result = await stockService.decrement(getBearerToken(req), productId, color, delta);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'STOCK_DECREMENT_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createStockController };
