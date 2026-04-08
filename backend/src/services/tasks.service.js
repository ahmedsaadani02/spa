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
const { getUserDisplayName, notifyPrivilegedUsers } = require('./internal-notifications.service');

const normalizeText = (value) => String(value ?? '').trim();

const getTaskDisplayTitle = (task) => normalizeText(task?.titleFr) || normalizeText(task?.titleAr) || normalizeText(task?.title) || 'tache';

const buildEmployeeTaskActivityEvents = (beforeTask, afterTask, payload, actorUser) => {
  if (!beforeTask || !afterTask) {
    return [];
  }

  const actorName = getUserDisplayName(actorUser);
  const taskTitle = getTaskDisplayTitle(afterTask);
  const taskRoute = '/tasks';
  const events = [];
  const beforeNote = normalizeText(beforeTask.employeeNote);
  const afterNote = normalizeText(afterTask.employeeNote);
  const beforeStatus = normalizeText(beforeTask.status);
  const afterStatus = normalizeText(afterTask.status);
  const beforeProgress = Number(beforeTask.progress ?? 0) || 0;
  const afterProgress = Number(afterTask.progress ?? 0) || 0;
  const subtasksBefore = new Map((beforeTask.subtasks || []).map((subtask) => [subtask.id, subtask]));
  const subtasksAfter = new Map((afterTask.subtasks || []).map((subtask) => [subtask.id, subtask]));
  const subtaskUpdates = Array.isArray(payload?.subtaskUpdates) ? payload.subtaskUpdates : [];
  const newPhotoProofs = Array.isArray(payload?.newPhotoProofs) ? payload.newPhotoProofs : [];

  for (const subtaskUpdate of subtaskUpdates) {
    const beforeSubtask = subtasksBefore.get(subtaskUpdate.id);
    const afterSubtask = subtasksAfter.get(subtaskUpdate.id) || beforeSubtask;
    const subtaskTitle = normalizeText(afterSubtask?.title) || 'sous-tache';
    if (!beforeSubtask || !!beforeSubtask.completed === !!subtaskUpdate.completed) {
      continue;
    }

    events.push({
      kind: subtaskUpdate.completed ? 'task_subtask_checked' : 'task_subtask_unchecked',
      title: subtaskUpdate.completed ? 'Sous-tache terminee' : 'Sous-tache rouverte',
      message: subtaskUpdate.completed
        ? `${actorName} a coche la sous-tache "${subtaskTitle}" dans "${taskTitle}".`
        : `${actorName} a decoche la sous-tache "${subtaskTitle}" dans "${taskTitle}".`,
      entityType: 'task',
      entityId: afterTask.id,
      taskId: afterTask.id,
      taskTitleFr: afterTask.titleFr || afterTask.title || null,
      taskTitleAr: afterTask.titleAr || null,
      route: taskRoute,
      metadata: {
        taskTitle,
        subtaskId: subtaskUpdate.id,
        subtaskTitle,
        subtaskCompleted: !!subtaskUpdate.completed
      }
    });
  }

  if (afterNote && afterNote !== beforeNote) {
    events.push({
      kind: 'task_comment_added',
      title: 'Commentaire ajoute',
      message: `${actorName} a ajoute un commentaire sur la tache "${taskTitle}".`,
      entityType: 'task',
      entityId: afterTask.id,
      taskId: afterTask.id,
      taskTitleFr: afterTask.titleFr || afterTask.title || null,
      taskTitleAr: afterTask.titleAr || null,
      route: taskRoute,
      metadata: {
        taskTitle,
        comment: afterNote
      }
    });
  }

  if (newPhotoProofs.length > 0) {
    events.push({
      kind: 'task_photo_added',
      title: 'Preuve photo ajoutee',
      message: `${actorName} a ajoute ${newPhotoProofs.length > 1 ? `${newPhotoProofs.length} photos` : 'une photo de preuve'} sur la tache "${taskTitle}".`,
      entityType: 'task',
      entityId: afterTask.id,
      taskId: afterTask.id,
      taskTitleFr: afterTask.titleFr || afterTask.title || null,
      taskTitleAr: afterTask.titleAr || null,
      route: taskRoute,
      metadata: {
        taskTitle,
        photoCount: newPhotoProofs.length
      }
    });
  }

  if (beforeStatus !== afterStatus) {
    if (afterStatus === 'done') {
      events.push({
        kind: 'task_completed',
        title: 'Tache terminee',
        message: `${actorName} a termine la tache "${taskTitle}".`,
        entityType: 'task',
        entityId: afterTask.id,
        taskId: afterTask.id,
        taskTitleFr: afterTask.titleFr || afterTask.title || null,
        taskTitleAr: afterTask.titleAr || null,
        route: taskRoute,
        metadata: {
          taskTitle,
          previousStatus: beforeStatus,
          status: afterStatus
        }
      });
    } else if (afterStatus === 'blocked') {
      events.push({
        kind: 'task_blocked',
        title: 'Tache bloquee',
        message: `${actorName} a bloque la tache "${taskTitle}".`,
        entityType: 'task',
        entityId: afterTask.id,
        taskId: afterTask.id,
        taskTitleFr: afterTask.titleFr || afterTask.title || null,
        taskTitleAr: afterTask.titleAr || null,
        route: taskRoute,
        metadata: {
          taskTitle,
          previousStatus: beforeStatus,
          status: afterStatus
        }
      });
    } else {
      events.push({
        kind: 'task_status_changed',
        title: 'Statut de tache modifie',
        message: `${actorName} a change le statut de la tache "${taskTitle}" de "${beforeStatus || 'inconnu'}" a "${afterStatus || 'inconnu'}".`,
        entityType: 'task',
        entityId: afterTask.id,
        taskId: afterTask.id,
        taskTitleFr: afterTask.titleFr || afterTask.title || null,
        taskTitleAr: afterTask.titleAr || null,
        route: taskRoute,
        metadata: {
          taskTitle,
          previousStatus: beforeStatus,
          status: afterStatus
        }
      });
    }
  }

  if (beforeProgress !== afterProgress) {
    events.push({
      kind: 'task_progress_changed',
      title: 'Progression mise a jour',
      message: `${actorName} a mis a jour la progression de la tache "${taskTitle}" de ${beforeProgress}% a ${afterProgress}%.`,
      entityType: 'task',
      entityId: afterTask.id,
      taskId: afterTask.id,
      taskTitleFr: afterTask.titleFr || afterTask.title || null,
      taskTitleAr: afterTask.titleAr || null,
      route: taskRoute,
      metadata: {
        taskTitle,
        previousProgress: beforeProgress,
        progress: afterProgress
      }
    });
  }

  if (events.length === 0) {
    events.push({
      kind: 'task_updated',
      title: 'Tache mise a jour',
      message: `${actorName} a mis a jour la tache "${taskTitle}".`,
      entityType: 'task',
      entityId: afterTask.id,
      taskId: afterTask.id,
      taskTitleFr: afterTask.titleFr || afterTask.title || null,
      taskTitleAr: afterTask.titleAr || null,
      route: taskRoute,
      metadata: {
        taskTitle
      }
    });
  }

  return events;
};

const assertCanManageTasks = () => {
  assertPermission('manageTasks');
};

const assertCanUseMyTasks = (user) => {
  if (hasPermission('manageTasks')) {
    throw new Error('FORBIDDEN');
  }
  assertPermission('receiveTasks');
};

const createTasksService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
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
          try {
            const notification = await createTaskAssignmentNotification({
              employeeId: created.employeeId,
              taskId: created.id,
              actorUserId: user.id,
              actorRole: user.role,
              actorName: user.nom || user.username || 'Utilisateur',
              taskTitleFr: created.titleFr || created.title || null,
              taskTitleAr: created.titleAr || null
            });
            if (notification) {
              publishTaskNotification(notification);
            }
          } catch (error) {
            console.error('[tasks-service] unable to publish assignment notification', error);
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
      return withAuthenticatedUser(token, async (user) => {
        const beforeTask = await getTaskByIdForEmployee(id, user.id);
        const updatedTask = await updateTaskByEmployee(id, user.id, payload);

        if (beforeTask && updatedTask) {
          const events = buildEmployeeTaskActivityEvents(beforeTask, updatedTask, payload, user);
          if (events.length > 0) {
            await notifyPrivilegedUsers(getDb, user, events);
          }
        }

        return updatedTask;
      });
    }
  };
};

module.exports = { createTasksService };
