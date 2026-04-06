const { hasPermission, assertPermission } = require('./auth-session.service');
const {
  listTasks,
  listTasksByEmployee,
  getTaskById,
  getTaskByIdForEmployee,
  createTask,
  updateTask,
  updateTaskByEmployee,
  deleteTask
} = require('../repositories/postgres/tasks.repository');
const { createTaskAssignmentNotification } = require('../repositories/postgres/task-notifications.repository');
const { publishTaskNotification } = require('./task-notification-stream.service');

const assertCanManageTasks = () => {
  assertPermission('manageTasks');
};

const assertCanUseMyTasks = (user) => {
  if (hasPermission('manageTasks')) {
    throw new Error('FORBIDDEN');
  }
  assertPermission('receiveTasks');
};

const createTasksService = ({ resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertCanManageTasks();
      return await operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  const withAuthenticatedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertCanUseMyTasks(user);
      return await operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token, filters) {
      return withAuthorizedUser(token, () => listTasks(filters));
    },

    async getById(token, id) {
      return withAuthorizedUser(token, () => getTaskById(id));
    },

    async create(token, payload) {
      return withAuthorizedUser(token, async (user) => {
        const created = await createTask(payload, {
          id: user.id,
          name: user.nom || user.username || 'Utilisateur'
        });

        if (created?.employeeId) {
          const notification = await createTaskAssignmentNotification({
            employeeId: created.employeeId,
            taskId: created.id,
            actorName: user.nom || user.username || 'Utilisateur',
            taskTitleFr: created.titleFr || created.title || null,
            taskTitleAr: created.titleAr || null
          });
          if (notification) {
            publishTaskNotification(notification);
          }
        }

        return created;
      });
    },

    async update(token, id, payload) {
      return withAuthorizedUser(token, () => updateTask(id, payload));
    },

    async delete(token, id) {
      return withAuthorizedUser(token, () => deleteTask(id));
    },

    async listMine(token, filters) {
      return withAuthenticatedUser(token, (user) => listTasksByEmployee(user.id, filters));
    },

    async getMineById(token, id) {
      return withAuthenticatedUser(token, (user) => getTaskByIdForEmployee(id, user.id));
    },

    async updateMine(token, id, payload) {
      return withAuthenticatedUser(token, (user) => updateTaskByEmployee(id, user.id, payload));
    }
  };
};

module.exports = { createTasksService };
