import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TASKS_I18N } from '../../i18n/ui-i18n';
import { Employee } from '../../models/employee.models';
import { TaskPriority, TaskRecord, TaskStatus } from '../../models/task.models';
import { EmployeesRepository } from '../../repositories/employees.repository';
import { TasksRepository } from '../../repositories/tasks.repository';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

type SelectOption<T extends string> = {
  value: T | 'all';
  label: string;
};

type TaskMetric = {
  label: string;
  value: number;
  tone: 'neutral' | 'primary' | 'success' | 'danger';
};

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly employeeControl = new FormControl('all', { nonNullable: true });
  readonly statusControl = new FormControl<'all' | TaskStatus>('all', { nonNullable: true });
  readonly priorityControl = new FormControl<'all' | TaskPriority>('all', { nonNullable: true });

  tasks: TaskRecord[] = [];
  employees: Employee[] = [];
  loading = true;
  error = '';

  deleteConfirm = {
    open: false,
    task: null as TaskRecord | null,
    submitting: false
  };

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auth: AuthService,
    private readonly language: LanguageService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get ui() {
    return TASKS_I18N[this.language.currentLanguage];
  }

  get statusOptions(): Array<SelectOption<TaskStatus>> {
    return [
      { value: 'all', label: this.ui.status.all },
      { value: 'todo', label: this.ui.status.todo },
      { value: 'in_progress', label: this.ui.status.in_progress },
      { value: 'done', label: this.ui.status.done },
      { value: 'blocked', label: this.ui.status.blocked }
    ];
  }

  get priorityOptions(): Array<SelectOption<TaskPriority>> {
    return [
      { value: 'all', label: this.ui.priority.all },
      { value: 'low', label: this.ui.priority.low },
      { value: 'medium', label: this.ui.priority.medium },
      { value: 'high', label: this.ui.priority.high },
      { value: 'urgent', label: this.language.isArabic ? 'عاجلة' : 'Urgente' }
    ];
  }

  get canManageTasks(): boolean {
    return this.auth.hasPermission('manageTasks');
  }

  get taskMetrics(): TaskMetric[] {
    const todo = this.tasks.filter((task) => task.status === 'todo').length;
    const inProgress = this.tasks.filter((task) => task.status === 'in_progress').length;
    const done = this.tasks.filter((task) => task.status === 'done').length;
    const overdue = this.tasks.filter((task) => this.isOverdue(task)).length;

    return [
      { label: this.ui.admin.metrics.total, value: this.tasks.length, tone: 'neutral' },
      { label: this.ui.admin.metrics.active, value: todo + inProgress, tone: 'primary' },
      { label: this.ui.admin.metrics.done, value: done, tone: 'success' },
      { label: this.ui.admin.metrics.overdue, value: overdue, tone: 'danger' }
    ];
  }

  get highlightedTasks(): TaskRecord[] {
    return [...this.tasks]
      .sort((left, right) => {
        const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return leftDue - rightDue;
      })
      .slice(0, 4);
  }

  async ngOnInit(): Promise<void> {
    await this.auth.ensureInitialized();
    const cachedEmployees = this.employeesRepository.getCachedList();
    const cachedTasks = this.tasksRepository.getCachedDefaultList();

    if (cachedEmployees.length || cachedTasks.length) {
      this.syncView(() => {
        if (cachedEmployees.length) {
          this.employees = cachedEmployees;
        }
        if (cachedTasks.length) {
          this.tasks = cachedTasks;
          this.loading = false;
        }
      });
    }

    await Promise.all([
      this.loadEmployees(!cachedEmployees.length),
      this.loadTasks(!cachedTasks.length)
    ]);

    this.employeeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      void this.loadTasks();
    });
    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      void this.loadTasks();
    });
    this.priorityControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      void this.loadTasks();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByTask = (_index: number, task: TaskRecord): string => task.id;

  statusLabel(status: TaskStatus): string {
    return this.ui.status[status];
  }

  priorityLabel(priority: TaskPriority): string {
    if (priority === 'urgent') {
      return this.language.isArabic ? 'عاجلة' : 'Urgente';
    }
    return this.ui.priority[priority];
  }

  subtaskSummary(task: TaskRecord): string {
    if (!task.subtasks.length) {
      return '';
    }
    const completed = task.subtasks.filter((subtask) => subtask.completed).length;
    return this.language.isArabic
      ? `${completed}/${task.subtasks.length} مهام فرعية منجزة`
      : `${completed}/${task.subtasks.length} sous-tâches terminées`;
  }

  proofRequirementLabel(task: TaskRecord): string {
    if (!task.requiresPhotoProof) {
      return '';
    }
    return this.language.isArabic ? 'Photo requise à la fin' : 'Photo requise à la fin';
  }

  photoProofCountLabel(task: TaskRecord): string {
    const total = task.photoProofs.length;
    if (!total) {
      return '';
    }
    return this.language.isArabic
      ? `${total} ${total > 1 ? 'صور' : 'صورة'}`
      : `${total} ${total > 1 ? 'photos' : 'photo'}`;
  }

  photoProofPreview(task: TaskRecord): string | null {
    return task.photoProofs[0]?.imageUrl ?? null;
  }

  onProofThumbError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }

  taskTitle(task: TaskRecord): string {
    if (this.language.isArabic) {
      return task.titleAr || task.titleFr || task.title;
    }
    return task.titleFr || task.titleAr || task.title;
  }

  taskDescription(task: TaskRecord): string {
    if (this.language.isArabic) {
      return task.descriptionAr || task.descriptionFr || task.description || '';
    }
    return task.descriptionFr || task.descriptionAr || task.description || '';
  }

  taskCreatedBy(task: TaskRecord): string {
    return task.createdByName || this.ui.misc.unknownAuthor;
  }

  private isOverdue(task: TaskRecord): boolean {
    if (!task.dueDate || task.status === 'done') {
      return false;
    }
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }

  requestDelete(task: TaskRecord): void {
    this.syncView(() => {
      this.deleteConfirm = {
        open: true,
        task,
        submitting: false
      };
    });
  }

  cancelDelete(): void {
    if (this.deleteConfirm.submitting) {
      return;
    }
    this.syncView(() => {
      this.deleteConfirm = {
        open: false,
        task: null,
        submitting: false
      };
    });
  }

  async confirmDelete(): Promise<void> {
    const task = this.deleteConfirm.task;
    if (!task || this.deleteConfirm.submitting) {
      return;
    }

    this.syncView(() => {
      this.deleteConfirm = {
        ...this.deleteConfirm,
        submitting: true
      };
    });

    const ok = await this.tasksRepository.delete(task.id);
    if (!ok) {
      this.syncView(() => {
        this.error = 'Suppression impossible.';
        this.deleteConfirm = {
          ...this.deleteConfirm,
          submitting: false
        };
      });
      return;
    }

    this.syncView(() => {
      this.deleteConfirm = {
        open: false,
        task: null,
        submitting: false
      };
    });
    await this.loadTasks();
  }

  private async loadEmployees(showLoading = false): Promise<void> {
    try {
      if (showLoading && this.employees.length === 0) {
        this.syncView(() => {
          this.loading = true;
        });
      }
      const employees = await this.employeesRepository.list(true);
      this.syncView(() => {
        this.employees = employees;
      });
    } catch {
      this.syncView(() => {
        this.employees = [];
      });
    }
  }

  private async loadTasks(showLoading = true): Promise<void> {
    if (showLoading) {
      this.syncView(() => {
        this.loading = true;
        this.error = '';
      });
    } else {
      this.syncView(() => {
        this.error = '';
      });
    }
    try {
      const tasks = await this.tasksRepository.list({
        employeeId: this.employeeControl.value !== 'all' ? this.employeeControl.value : '',
        status: this.statusControl.value !== 'all' ? this.statusControl.value : '',
        priority: this.priorityControl.value !== 'all' ? this.priorityControl.value : ''
      });
      this.syncView(() => {
        this.tasks = tasks;
      });
    } catch {
      this.syncView(() => {
        this.error = 'Chargement impossible.';
        this.tasks = [];
      });
    } finally {
      if (showLoading || this.loading) {
        this.syncView(() => {
          this.loading = false;
        });
      }
    }
  }

  private syncView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }
}
