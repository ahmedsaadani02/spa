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

const createEmployeesController = ({ employeesService }) => ({
  async list(req, res) {
    try {
      const result = await employeesService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async search(req, res) {
    const query = typeof req.query?.q === 'string' ? req.query.q : '';
    try {
      const result = await employeesService.search(getBearerToken(req), query);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEES_SEARCH_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await employeesService.getById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEE_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'employee payload is required' });
    }

    try {
      const result = await employeesService.create(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEE_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const payload = req.body;
    if (!id.trim() || !payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'id and employee payload are required' });
    }

    try {
      const result = await employeesService.update(getBearerToken(req), id, payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEE_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await employeesService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEE_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async setActive(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const actif = req.body?.actif;
    if (!id.trim() || typeof actif !== 'boolean') {
      return res.status(400).json({ success: false, message: 'id and actif are required' });
    }

    try {
      const result = await employeesService.setActive(getBearerToken(req), id, actif);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'EMPLOYEE_SET_ACTIVE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createEmployeesController };
