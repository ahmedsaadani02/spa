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

const createQuotesController = ({ quotesService }) => ({
  async list(req, res) {
    try {
      const result = await quotesService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await quotesService.getById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTE_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const quote = req.body;
    if (!quote || typeof quote !== 'object') {
      return res.status(400).json({ success: false, message: 'quote payload is required' });
    }

    try {
      const result = await quotesService.put(getBearerToken(req), quote);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTE_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const quote = req.body;
    if (!id.trim() || !quote || typeof quote !== 'object') {
      return res.status(400).json({ success: false, message: 'id and quote payload are required' });
    }

    try {
      const result = await quotesService.put(getBearerToken(req), { ...quote, id });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTE_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await quotesService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTE_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async convertToInvoice(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await quotesService.convertToInvoice(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'QUOTE_CONVERT_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createQuotesController };
