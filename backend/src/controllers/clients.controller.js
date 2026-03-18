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

const createClientsController = ({ clientsService }) => ({
  async list(req, res) {
    try {
      const result = await clientsService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENTS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await clientsService.getById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async search(req, res) {
    const query = typeof req.query?.q === 'string' ? req.query.q : '';

    try {
      const result = await clientsService.search(getBearerToken(req), query);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_SEARCH_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const client = req.body;
    if (!client || typeof client !== 'object') {
      return res.status(400).json({ success: false, message: 'client payload is required' });
    }

    try {
      const result = await clientsService.upsert(getBearerToken(req), client);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const client = req.body;
    if (!id.trim() || !client || typeof client !== 'object') {
      return res.status(400).json({ success: false, message: 'id and client payload are required' });
    }

    try {
      const result = await clientsService.upsert(getBearerToken(req), { ...client, id });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await clientsService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async findOrCreate(req, res) {
    const client = req.body?.client;
    const preferredId = typeof req.body?.preferredId === 'string' ? req.body.preferredId : null;
    if (!client || typeof client !== 'object') {
      return res.status(400).json({ success: false, message: 'client payload is required' });
    }

    try {
      const result = await clientsService.findOrCreate(getBearerToken(req), client, preferredId);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'CLIENT_FIND_OR_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createClientsController };
