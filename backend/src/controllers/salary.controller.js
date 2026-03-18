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

const getScope = (req) => ({
  employeeId: typeof req.query?.employeeId === 'string' ? req.query.employeeId : '',
  month: req.query?.month,
  year: req.query?.year
});

const requireEmployeeScope = (req, res) => {
  const scope = getScope(req);
  if (!scope.employeeId.trim()) {
    res.status(400).json({ success: false, message: 'employeeId is required' });
    return null;
  }
  return scope;
};

const createSalaryController = ({ salaryService }) => ({
  async listAdvances(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.listAdvances(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_ADVANCES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async createAdvance(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'advance payload is required' });
    }

    try {
      const result = await salaryService.createAdvance(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_ADVANCE_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async deleteAdvance(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await salaryService.deleteAdvance(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_ADVANCE_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async totalAdvances(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.totalAdvances(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_ADVANCES_TOTAL_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async listBonuses(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.listBonuses(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_BONUSES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async createBonus(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'bonus payload is required' });
    }

    try {
      const result = await salaryService.createBonus(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_BONUS_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async deleteBonus(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await salaryService.deleteBonus(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_BONUS_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async totalBonuses(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.totalBonuses(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_BONUSES_TOTAL_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async listOvertimes(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.listOvertimes(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_OVERTIMES_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async createOvertime(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'overtime payload is required' });
    }

    try {
      const result = await salaryService.createOvertime(getBearerToken(req), payload);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_OVERTIME_CREATE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async deleteOvertime(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await salaryService.deleteOvertime(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_OVERTIME_DELETE_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async totalOvertimeHours(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.totalOvertimeHours(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_OVERTIMES_TOTAL_HOURS_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async summary(req, res) {
    const scope = requireEmployeeScope(req, res);
    if (!scope) return;

    try {
      const result = await salaryService.summary(getBearerToken(req), scope.employeeId, scope.month, scope.year);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'SALARY_SUMMARY_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createSalaryController };
