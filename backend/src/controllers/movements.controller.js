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

const createMovementsController = ({ movementsService }) => ({
  async list(req, res) {
    try {
      const result = await movementsService.list(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'MOVEMENTS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async add(req, res) {
    const movement = req.body;
    if (!movement || typeof movement !== 'object') {
      return res.status(400).json({ success: false, message: 'movement payload is required' });
    }

    try {
      const result = await movementsService.add(getBearerToken(req), movement);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'MOVEMENT_ADD_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createMovementsController };
