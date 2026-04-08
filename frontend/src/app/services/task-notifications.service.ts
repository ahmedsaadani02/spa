import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, skip } from 'rxjs';
import { TaskNotificationRecord } from '../models/task.models';
import { SHELL_I18N } from '../i18n/ui-i18n';
import { TasksRepository } from '../repositories/tasks.repository';
import { AuthService } from './auth.service';
import { AppApiService } from './app-api.service';
import { LanguageService } from './language.service';

export interface TaskToast {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TaskNotificationsService {
  private static readonly bellSoundUrl = 'assets/sounds/notification-bell.wav';
  private readonly ipc = inject(AppApiService);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly zone = inject(NgZone);
  private readonly tasksRepository = inject(TasksRepository);

  private readonly notificationsSubject = new BehaviorSubject<TaskNotificationRecord[]>([]);
  private readonly toastsSubject = new BehaviorSubject<TaskToast[]>([]);
  private unsubscribeStream: (() => void) | null = null;
  private initialized = false;
  private activeBellAudio: HTMLAudioElement | null = null;
  private syncedUserId: string | null = null;

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly toasts$ = this.toastsSubject.asObservable();

  get notifications(): TaskNotificationRecord[] {
    return this.notificationsSubject.value;
  }

  get toasts(): TaskToast[] {
    return this.toastsSubject.value;
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.isRead).length;
  }

  async ensureStarted(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    await this.auth.ensureInitialized();
    await this.syncForCurrentUser();
    this.auth.currentUser$
      .pipe(
        map((user) => user?.id ?? null),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(() => {
      void this.syncForCurrentUser();
      });
  }

  async markRead(id: string): Promise<void> {
    const updated = await this.ipc.taskNotificationsMarkRead(id);
    if (!updated) {
      return;
    }

    this.notificationsSubject.next(
      this.notifications.map((notification) => notification.id === updated.id ? updated : notification)
    );
  }

  async markAllRead(): Promise<void> {
    const updatedCount = await this.ipc.taskNotificationsMarkAllRead();
    if (updatedCount <= 0) {
      return;
    }

    this.notificationsSubject.next(
      this.notifications.map((notification) => notification.isRead
        ? notification
        : { ...notification, isRead: true, readAt: new Date().toISOString() })
    );
  }

  dismissToast(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  taskLabel(notification: TaskNotificationRecord): string {
    const metadata = notification.metadata ?? {};
    const taskTitle = typeof metadata['taskTitle'] === 'string' ? metadata['taskTitle'] : '';
    const productLabel = typeof metadata['productLabel'] === 'string' ? metadata['productLabel'] : '';
    if (taskTitle) {
      return taskTitle;
    }
    if (productLabel) {
      return productLabel;
    }
    if (this.language.isArabic) {
      return notification.taskTitleAr || notification.taskTitleFr || '...';
    }
    return notification.taskTitleFr || notification.taskTitleAr || '...';
  }

  notificationTitle(notification: TaskNotificationRecord): string {
    return notification.title || SHELL_I18N[this.language.currentLanguage].notifications.assignedTitle;
  }

  notificationMessage(notification: TaskNotificationRecord): string {
    if (notification.message) {
      return notification.message;
    }
    const taskTitle = this.taskLabel(notification);
    const actorName = notification.actorName || SHELL_I18N[this.language.currentLanguage].notifications.assignedTitle;
    return SHELL_I18N[this.language.currentLanguage].notifications.assignedMessage(taskTitle, actorName);
  }

  private async syncForCurrentUser(): Promise<void> {
    this.unsubscribeStream?.();
    this.unsubscribeStream = null;

    if (!this.auth.isLoggedIn()) {
      this.notificationsSubject.next([]);
      this.toastsSubject.next([]);
      this.syncedUserId = null;
      return;
    }

    const currentUser = this.auth.currentUser();
    const currentUserId = currentUser?.id ?? null;
    if (this.syncedUserId === currentUserId && this.unsubscribeStream) {
      return;
    }
    this.syncedUserId = currentUserId;

    try {
      const notifications = await this.ipc.taskNotificationsList(12);
      this.notificationsSubject.next(notifications);
      this.tasksRepository.invalidateMineListCache();
      if (currentUserId) {
        this.announceUnreadNotificationsOnce(currentUserId, notifications);
      }
    } catch {
      this.notificationsSubject.next([]);
    }

    this.unsubscribeStream = this.ipc.taskNotificationsOnMessage((notification) => {
      this.zone.run(() => {
        if (!this.shouldHandleNotificationForCurrentUser(notification, currentUserId)) {
          return;
        }

        const next = [notification, ...this.notifications.filter((item) => item.id !== notification.id)];
        this.notificationsSubject.next(next.slice(0, 20));
        this.tasksRepository.invalidateMineListCache();
        this.pushToast(notification);
        void this.playSound();
        this.showSystemNotification(notification);
        if (currentUserId) {
          this.rememberAudibleNotification(currentUserId, notification.id);
        }
      });
    });
  }

  private announceUnreadNotificationsOnce(userId: string, notifications: TaskNotificationRecord[]): void {
    const latestUnread = notifications.find((notification) => !notification.isRead && this.shouldHandleNotificationForCurrentUser(notification, userId));
    if (!latestUnread) {
      return;
    }

    const lastAnnouncedId = this.readLastAudibleNotification(userId);
    if (lastAnnouncedId === latestUnread.id) {
      return;
    }

    this.pushToast(latestUnread);
    void this.playSound();
    this.showSystemNotification(latestUnread);
    this.rememberAudibleNotification(userId, latestUnread.id);
  }

  private shouldHandleNotificationForCurrentUser(notification: TaskNotificationRecord, currentUserId: string | null): boolean {
    const targetEmployeeId = String(notification.employeeId ?? '').trim();
    const activeUserId = String(currentUserId ?? '').trim();
    return !!targetEmployeeId && !!activeUserId && targetEmployeeId === activeUserId;
  }

  private readLastAudibleNotification(userId: string): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      return window.localStorage.getItem(this.lastAudibleNotificationStorageKey(userId)) || '';
    } catch {
      return '';
    }
  }

  private rememberAudibleNotification(userId: string, notificationId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.lastAudibleNotificationStorageKey(userId), notificationId);
    } catch {
      // Ignore storage failures.
    }
  }

  private lastAudibleNotificationStorageKey(userId: string): string {
    return `spa:task-notifications:last-audible:${userId}`;
  }

  private pushToast(notification: TaskNotificationRecord): void {
    const toast: TaskToast = {
      id: notification.id,
      title: this.notificationTitle(notification),
      message: this.notificationMessage(notification),
      createdAt: notification.createdAt
    };

    this.toastsSubject.next([toast, ...this.toastsSubject.value.filter((item) => item.id !== toast.id)].slice(0, 4));
    window.setTimeout(() => this.dismissToast(toast.id), 6000);
  }

  private async playSound(): Promise<void> {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      return;
    }

    try {
      if (this.activeBellAudio) {
        this.activeBellAudio.pause();
        this.activeBellAudio.currentTime = 0;
      }

      const audio = new window.Audio(TaskNotificationsService.bellSoundUrl);
      audio.preload = 'auto';
      audio.volume = 0.9;
      this.activeBellAudio = audio;
      audio.onended = () => {
        if (this.activeBellAudio === audio) {
          this.activeBellAudio = null;
        }
      };
      await audio.play();
    } catch {
      // Ignore audio playback failures.
    }
  }

  private showSystemNotification(notification: TaskNotificationRecord): void {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return;
    }

    const show = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      try {
        new Notification(this.notificationTitle(notification), {
          body: this.notificationMessage(notification)
        });
      } catch {
        // Ignore system notification failures.
      }
    };

    if (Notification.permission === 'granted') {
      show();
      return;
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          show();
        }
      });
    }
  }
}
