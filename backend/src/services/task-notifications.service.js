const {
  listNotificationsByEmployee,
  markNotificationRead,
  markAllNotificationsRead
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

    async markAllRead(token) {
      return withNotificationUser(token, (user) => markAllNotificationsRead(user.id));
    },

    async subscribe(token, listener) {
      return withNotificationUser(token, async (user) => subscribeTaskNotifications(user.id, listener));
    }
  };
};

module.exports = { createTaskNotificationsService };
