const { hasPermission } = require('./auth-session.service');
const {
  listNotificationsByEmployee,
  markNotificationRead
} = require('../repositories/postgres/task-notifications.repository');
const { subscribeTaskNotifications } = require('./task-notification-stream.service');

const createTaskNotificationsService = ({ resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withNotificationUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      const allowed = hasPermission('receiveTasks') || hasPermission('manageTasks');
      if (!allowed) {
        throw new Error('FORBIDDEN');
      }
      return await operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async listMine(token, options) {
      return withNotificationUser(token, (user) => listNotificationsByEmployee(user.id, options));
    },

    async markRead(token, id) {
      return withNotificationUser(token, (user) => markNotificationRead(id, user.id));
    },

    async subscribe(token, listener) {
      return withNotificationUser(token, async (user) => subscribeTaskNotifications(user.id, listener));
    }
  };
};

module.exports = { createTaskNotificationsService };
