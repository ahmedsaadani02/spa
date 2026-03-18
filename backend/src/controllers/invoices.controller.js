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

const createInvoicesController = ({ invoicesService }) => ({
  async list(req, res) {
    try {
      const result = await invoicesService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'INVOICES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await invoicesService.getById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'INVOICE_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const invoice = req.body;
    if (!invoice || typeof invoice !== 'object') {
      return res.status(400).json({ success: false, message: 'invoice payload is required' });
    }

    try {
      const result = await invoicesService.put(getBearerToken(req), invoice);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'INVOICE_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const invoice = req.body;
    if (!id.trim() || !invoice || typeof invoice !== 'object') {
      return res.status(400).json({ success: false, message: 'id and invoice payload are required' });
    }

    try {
      const result = await invoicesService.put(getBearerToken(req), { ...invoice, id });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'INVOICE_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await invoicesService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'INVOICE_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createInvoicesController };
