const { listEmployees } = require('../repositories/employees.runtime.repository');
const { createNotifications } = require('../repositories/postgres/task-notifications.repository');
const { publishTaskNotification } = require('./task-notification-stream.service');

const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'developer']);

const normalizeText = (value) => String(value ?? '').trim();

const getUserDisplayName = (user) => normalizeText(user?.nom) || normalizeText(user?.username) || 'Employe';

const isEmployeeActor = (user) => String(user?.role ?? '').trim() === 'employee';

const resolveDb = (getDbOrDb) => (typeof getDbOrDb === 'function' ? getDbOrDb() : getDbOrDb);

const listPrivilegedRecipients = async (getDbOrDb) => {
  const db = resolveDb(getDbOrDb);
  const employees = await listEmployees(db);
  return employees.filter((employee) =>
    PRIVILEGED_ROLES.has(String(employee?.role ?? '').trim())
    && employee?.isActive !== false
  );
};

const notifyPrivilegedUsers = async (getDbOrDb, actorUser, events = []) => {
  if (!isEmployeeActor(actorUser) || !Array.isArray(events) || events.length === 0) {
    return [];
  }

  try {
    const recipients = await listPrivilegedRecipients(getDbOrDb);
    if (!recipients.length) {
      return [];
    }

    const actorName = getUserDisplayName(actorUser);
    const payloads = [];

    for (const recipient of recipients) {
      for (const event of events) {
        if (!event || !normalizeText(event.kind)) {
          continue;
        }

        payloads.push({
          recipientUserId: recipient.id,
          actorUserId: actorUser.id,
          actorRole: actorUser.role,
          actorName,
          kind: event.kind,
          title: event.title,
          message: event.message,
          entityType: event.entityType,
          entityId: event.entityId,
          taskId: event.taskId,
          taskTitleFr: event.taskTitleFr,
          taskTitleAr: event.taskTitleAr,
          route: event.route,
          metadata: {
            ...(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}),
            actorName
          }
        });
      }
    }

    const notifications = await createNotifications(payloads);
    notifications.forEach((notification) => publishTaskNotification(notification));
    return notifications;
  } catch (error) {
    console.error('[internal-notifications] unable to notify privileged users', error);
    return [];
  }
};

module.exports = {
  getUserDisplayName,
  isEmployeeActor,
  notifyPrivilegedUsers
};
