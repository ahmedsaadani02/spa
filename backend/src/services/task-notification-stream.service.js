const subscribersByEmployee = new Map();

const subscribeTaskNotifications = (employeeId, listener) => {
  const key = String(employeeId ?? '').trim();
  if (!key || typeof listener !== 'function') {
    return () => {};
  }

  const listeners = subscribersByEmployee.get(key) ?? new Set();
  listeners.add(listener);
  subscribersByEmployee.set(key, listeners);

  return () => {
    const current = subscribersByEmployee.get(key);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      subscribersByEmployee.delete(key);
    }
  };
};

const publishTaskNotification = (notification) => {
  const employeeId = String(notification?.employeeId ?? '').trim();
  if (!employeeId) {
    return;
  }

  const listeners = subscribersByEmployee.get(employeeId);
  if (!listeners || listeners.size === 0) {
    return;
  }

  for (const listener of listeners) {
    try {
      listener(notification);
    } catch {
      // Ignore broken listeners and let the connection cleanup handle it.
    }
  }
};

module.exports = {
  subscribeTaskNotifications,
  publishTaskNotification
};
