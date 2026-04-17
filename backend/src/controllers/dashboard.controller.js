const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

const toHttpFailure = (error) => {
  const message = error instanceof Error ? error.message : 'DASHBOARD_FAILED';
  if (message === 'UNAUTHORIZED' || message === 'NOT_AUTHENTICATED') {
    return { status: 401, message: 'Unauthorized' };
  }
  if (message === 'FORBIDDEN') {
    return { status: 403, message: 'Forbidden' };
  }
  return { status: 500, message };
};

const createDashboardController = ({ dashboardService }) => ({
  async getKpis(req, res) {
    try {
      const result = await dashboardService.getKpis(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error);
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async getCaMensuel(req, res) {
    try {
      const result = await dashboardService.getCaMensuel(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error);
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createDashboardController };
