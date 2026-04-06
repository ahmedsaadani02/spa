const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return typeof req.query?.token === 'string' ? req.query.token.trim() : '';
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

const createTaskNotificationsController = ({ taskNotificationsService }) => ({
  async listMine(req, res) {
    try {
      const result = await taskNotificationsService.listMine(getBearerToken(req), {
        limit: typeof req.query?.limit === 'string' ? Number(req.query.limit) : 20
      });
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_NOTIFICATIONS_LIST_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async markRead(req, res) {
    const id = typeof req.params?.id === 'string' ? req.params.id : '';
    if (!id.trim()) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
      const result = await taskNotificationsService.markRead(getBearerToken(req), id);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_NOTIFICATION_MARK_READ_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async stream(req, res) {
    let unsubscribe = () => {};
    let keepAlive = null;

    try {
      unsubscribe = await taskNotificationsService.subscribe(getBearerToken(req), (notification) => {
        res.write(`event: task-notification\n`);
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
      });
    } catch (error) {
      const failure = toHttpFailure(error, 'TASK_NOTIFICATIONS_STREAM_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    res.write('event: connected\n');
    res.write('data: {"ok":true}\n\n');

    keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      unsubscribe();
      if (keepAlive) {
        clearInterval(keepAlive);
      }
      res.end();
    });

    return undefined;
  }
});

module.exports = { createTaskNotificationsController };
