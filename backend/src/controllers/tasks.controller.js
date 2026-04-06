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
  if (
    message === 'TASK_TITLE_REQUIRED'
    || message === 'TASK_EMPLOYEE_NOT_FOUND'
    || message === 'TASK_PROOF_REQUIRED'
    || message === 'TASK_PHOTO_INVALID'
    || message === 'TASK_PHOTO_EXTENSION_INVALID'
  ) {
    return { status: 400, message };
  }
  return { status: 500, message };
};

const createTasksController = ({ tasksService }) => ({
  async list(req, res) {
    try {
      const result = await tasksService.list(getBearerToken(req), {
        employeeId: typeof req.query?.employeeId === 'string' ? req.query.employeeId : '',
        status: typeof req.query?.status === 'string' ? req.query.status : '',
        priority: typeof req.query?.priority === 'string' ? req.query.priority : ''
      });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASKS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await tasksService.getById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async create(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'task payload is required' });
    }

    try {
      const result = await tasksService.create(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async update(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const payload = req.body;
    if (!id.trim() || !payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'id and task payload are required' });
    }

    try {
      const result = await tasksService.update(getBearerToken(req), id, payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async delete(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await tasksService.delete(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async listMine(req, res) {
    try {
      const result = await tasksService.listMine(getBearerToken(req), {
        status: typeof req.query?.status === 'string' ? req.query.status : '',
        priority: typeof req.query?.priority === 'string' ? req.query.priority : ''
      });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'MY_TASKS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getMineById(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await tasksService.getMineById(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'MY_TASK_GET_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async updateMine(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    const payload = req.body;
    if (!id.trim() || !payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'id and task payload are required' });
    }

    try {
      const result = await tasksService.updateMine(getBearerToken(req), id, payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'MY_TASK_UPDATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createTasksController };
