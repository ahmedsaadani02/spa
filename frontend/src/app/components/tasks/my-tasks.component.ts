import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TASKS_I18N } from '../../i18n/ui-i18n';
import { TaskPriority, TaskRecord, TaskStatus, TaskUpdateHistoryRecord } from '../../models/task.models';
import { TasksRepository } from '../../repositories/tasks.repository';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { TaskNotificationsService } from '../../services/task-notifications.service';

type SelectOption<T extends string> = {
  value: T | 'all';
  label: string;
};

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly statusControl = new FormControl<'all' | TaskStatus>('all', { nonNullable: true });
  readonly priorityControl = new FormControl<'all' | TaskPriority>('all', { nonNullable: true });

  readonly updateForm = this.formBuilder.group({
    status: ['todo' as TaskStatus, Validators.required],
    priorityReadonly: [''],
    progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    employeeNote: [''],
    subtasks: this.formBuilder.array<FormControl<boolean>>([])
  });

  tasks: TaskRecord[] = [];
  loading = true;
  saving = false;
  error = '';
  selectedProofPhotos: Array<{ fileName: string; dataUrl: string }> = [];

  updateModal = {
    open: false,
    task: null as TaskRecord | null
  };

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly auth: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly language: LanguageService,
    private readonly taskNotifications: TaskNotificationsService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get ui() {
    return TASKS_I18N[this.language.currentLanguage];
  }

  get updateCommentLabel(): string {
    return this.language.isArabic ? 'تعليق (اختياري)' : 'Commentaire (optionnel)';
  }

  get updateCommentPlaceholder(): string {
    return this.language.isArabic ? 'أضف تعليقًا (اختياري)' : 'Ajouter un commentaire (optionnel)';
  }

  get updatePhotoLabel(): string {
    return this.language.isArabic ? 'Ø£Ø¶Ù ØµÙˆØ±Ø© (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)' : 'Ajouter une photo (optionnel)';
  }

  get updatePhotoHint(): string {
    return this.language.isArabic
      ? 'Ø£Ø¶Ù ØµÙˆØ±Ø© Ø£Ùˆ Ø£ÙƒØ«Ø± Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„ØªÙ‚Ø¯Ù… Ø¥Ø°Ø§ Ù„Ø²Ù… Ø§Ù„Ø£Ù…Ø±.'
      : 'Ajoutez une ou plusieurs photos si vous voulez documenter l avancement.';
  }

  get updateSubtasksLabel(): string {
    return this.language.isArabic ? 'Checklist terrain' : 'Checklist terrain';
  }

  get updateHistoryLabel(): string {
    return this.language.isArabic ? 'Historique des mises à jour' : 'Historique des mises à jour';
  }

  get updateProofsLabel(): string {
    return this.language.isArabic ? 'Preuves photo' : 'Preuves photo';
  }

  get updateFormSubtasks(): FormArray<FormControl<boolean>> {
    return this.updateForm.controls.subtasks;
  }

  subtaskControlAt(index: number): FormControl<boolean> {
    return this.updateFormSubtasks.at(index) as FormControl<boolean>;
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
      { value: 'urgent', label: this.language.isArabic ? 'Ø¹Ø§Ø¬Ù„Ø©' : 'Urgente' }
    ];
  }

  get username(): string | null {
    return this.auth.displayName() || this.auth.username();
  }

  async ngOnInit(): Promise<void> {
    await this.auth.ensureInitialized();
    const cachedTasks = this.tasksRepository.getCachedMineDefaultList();
    if (cachedTasks.length) {
      this.syncView(() => {
        this.tasks = cachedTasks;
        this.loading = false;
      });
    }
    await this.loadTasks(!cachedTasks.length);

    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      void this.loadTasks();
    });
    this.priorityControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      void this.loadTasks();
    });
    this.updateForm.controls.status.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status === 'done') {
          this.updateForm.controls.progress.patchValue(100, { emitEvent: false });
        }
      });

    this.taskNotifications.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        const hasAssignedTaskMissingFromList = notifications.some((notification) =>
          !notification.isRead
          && !!notification.taskId
          && !this.tasks.some((task) => task.id === notification.taskId)
        );

        if (hasAssignedTaskMissingFromList) {
          void this.loadTasks(false);
        }
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
      return this.language.isArabic ? 'Ø¹Ø§Ø¬Ù„Ø©' : 'Urgente';
    }
    return this.ui.priority[priority];
  }

  completedSubtasksCount(task: TaskRecord): number {
    return task.subtasks.filter((subtask) => subtask.completed).length;
  }

  proofRequirementText(task: TaskRecord): string {
    if (!task.requiresPhotoProof) {
      return '';
    }
    return this.language.isArabic ? 'Photo requise pour terminer' : 'Photo requise pour terminer';
  }

  historyLabel(entry: TaskUpdateHistoryRecord): string {
    if (entry.actionType === 'subtask_completed' && entry.subtaskTitle) {
      return this.language.isArabic ? `Sous-tâche terminée: ${entry.subtaskTitle}` : `Sous-tâche terminée: ${entry.subtaskTitle}`;
    }
    if (entry.actionType === 'subtask_reopened' && entry.subtaskTitle) {
      return this.language.isArabic ? `Sous-tâche rouverte: ${entry.subtaskTitle}` : `Sous-tâche rouverte: ${entry.subtaskTitle}`;
    }
    if (entry.actionType === 'comment_added') {
      return this.language.isArabic ? 'Commentaire ajouté' : 'Commentaire ajouté';
    }
    if (entry.actionType === 'photos_added') {
      return this.language.isArabic ? `Photos ajoutées (${entry.photoCount})` : `Photos ajoutées (${entry.photoCount})`;
    }
    if (entry.actionType === 'task_created') {
      return this.language.isArabic ? 'Tâche créée' : 'Tâche créée';
    }
    return this.language.isArabic ? 'Mise à jour de la tâche' : 'Mise à jour de la tâche';
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

  async openUpdate(task: TaskRecord): Promise<void> {
    const detailedTask = await this.tasksRepository.getMineById(task.id) || task;
    this.syncView(() => {
      this.updateModal = {
        open: true,
        task: detailedTask
      };
      this.updateForm.patchValue({
        status: detailedTask.status,
        priorityReadonly: this.priorityLabel(detailedTask.priority),
        progress: detailedTask.progress,
        employeeNote: detailedTask.employeeNote || ''
      });
      this.updateFormSubtasks.clear();
      detailedTask.subtasks.forEach((subtask) => {
        this.updateFormSubtasks.push(this.formBuilder.nonNullable.control(!!subtask.completed));
      });
      this.selectedProofPhotos = [];
    });
  }

  closeUpdate(force = false): void {
    if (this.saving && !force) {
      return;
    }
    this.syncView(() => {
      this.updateModal = {
        open: false,
        task: null
      };
      this.updateFormSubtasks.clear();
      this.selectedProofPhotos = [];
    });
  }

  onSubtaskToggle(): void {
    const task = this.updateModal.task;
    if (!task || !task.subtasks.length) {
      return;
    }

    const completedCount = this.updateFormSubtasks.controls.filter((control) => !!control.value).length;
    const progress = Math.round((completedCount / task.subtasks.length) * 100);
    const currentStatus = this.updateForm.controls.status.value;
    this.updateForm.patchValue({
      progress,
      status: currentStatus === 'blocked'
        ? 'blocked'
        : progress >= 100
          ? 'done'
          : progress > 0
            ? 'in_progress'
            : 'todo'
    }, { emitEvent: false });
  }

  async onProofFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) {
      return;
    }

    const nextPhotos = await Promise.all(files.map(async (file) => ({
      fileName: file.name,
      dataUrl: await this.readFileAsDataUrl(file)
    })));

    this.syncView(() => {
      this.selectedProofPhotos = [...this.selectedProofPhotos, ...nextPhotos];
    });

    if (input) {
      input.value = '';
    }
  }

  removeSelectedProof(index: number): void {
    this.syncView(() => {
      this.selectedProofPhotos = this.selectedProofPhotos.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async submitUpdate(): Promise<void> {
    const task = this.updateModal.task;
    if (!task || this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    this.syncView(() => {
      this.saving = true;
      this.error = '';
    });
    const raw = this.updateForm.getRawValue();
    const trimmedEmployeeNote = raw.employeeNote?.trim() ?? '';
    const subtaskUpdates = task.subtasks
      .map((subtask, index) => ({
        id: subtask.id,
        completed: !!this.updateFormSubtasks.at(index)?.value,
        initialCompleted: !!subtask.completed
      }))
      .filter((subtask) => subtask.completed !== subtask.initialCompleted)
      .map(({ id, completed }) => ({ id, completed }));
    const payload = {
      status: raw.status ?? task.status,
      progress: Number(raw.progress ?? task.progress),
      ...(trimmedEmployeeNote ? { employeeNote: trimmedEmployeeNote } : {}),
      ...(subtaskUpdates.length ? { subtaskUpdates } : {}),
      ...(this.selectedProofPhotos.length ? { newPhotoProofs: this.selectedProofPhotos } : {})
    };

    try {
      const result = await this.tasksRepository.updateMine(task.id, payload);

      if (!result) {
        this.syncView(() => {
          this.error = 'Mise a jour impossible.';
        });
        return;
      }

      this.closeUpdate(true);
      await this.loadTasks();
    } catch (error) {
      const message = error instanceof Error ? error.message.trim() : '';
      this.syncView(() => {
        this.error = message === 'TASK_PROOF_REQUIRED'
          ? 'Une photo de preuve est requise pour terminer cette tache.'
          : message || 'Mise a jour impossible.';
      });
    } finally {
      this.syncView(() => {
        this.saving = false;
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
      const tasks = await this.tasksRepository.listMine({
        status: this.statusControl.value !== 'all' ? this.statusControl.value : '',
        priority: this.priorityControl.value !== 'all' ? this.priorityControl.value : ''
      });
      this.syncView(() => {
        this.tasks = tasks;
      });
    } catch {
      this.syncView(() => {
        this.tasks = [];
        this.error = 'Chargement impossible.';
      });
    } finally {
      if (showLoading || this.loading) {
        this.syncView(() => {
          this.loading = false;
        });
      }
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('TASK_PHOTO_READ_FAILED'));
      reader.readAsDataURL(file);
    });
  }

  private syncView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }
}
