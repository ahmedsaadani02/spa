import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TASKS_I18N } from '../../i18n/ui-i18n';
import { Employee } from '../../models/employee.models';
import { TaskPriority, TaskRecord, TaskStatus, TaskUpsertInput } from '../../models/task.models';
import { EmployeesRepository } from '../../repositories/employees.repository';
import { TasksRepository } from '../../repositories/tasks.repository';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  taskId: string | null = null;
  employees: Employee[] = [];
  loading = true;
  saving = false;
  error = '';

  task: TaskRecord | null = null;

  readonly form = this.fb.group({
    titleFr: ['', [Validators.minLength(2)]],
    titleAr: ['', [Validators.minLength(2)]],
    descriptionFr: [''],
    descriptionAr: [''],
    employeeId: [''],
    status: ['todo' as TaskStatus, Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    dueDate: [''],
    progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    requiresPhotoProof: [false],
    subtasks: this.fb.array<TaskSubtaskFormGroup>([])
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tasksRepository: TasksRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly language: LanguageService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get ui() {
    return TASKS_I18N[this.language.currentLanguage];
  }

  get isArabic(): boolean {
    return this.language.isArabic;
  }

  get activeTitleControlName(): 'titleFr' | 'titleAr' {
    return this.isArabic ? 'titleAr' : 'titleFr';
  }

  get activeDescriptionControlName(): 'descriptionFr' | 'descriptionAr' {
    return this.isArabic ? 'descriptionAr' : 'descriptionFr';
  }

  get activeTitleLabel(): string {
    return this.isArabic ? this.ui.form.titleAr : this.ui.form.titleFr;
  }

  get activeDescriptionLabel(): string {
    return this.isArabic ? this.ui.form.descriptionAr : this.ui.form.descriptionFr;
  }

  get activeFieldDirection(): 'rtl' | 'ltr' {
    return this.isArabic ? 'rtl' : 'ltr';
  }

  get statusOptions(): Array<{ value: TaskStatus; label: string }> {
    return [
      { value: 'todo', label: this.ui.status.todo },
      { value: 'in_progress', label: this.ui.status.in_progress },
      { value: 'done', label: this.ui.status.done },
      { value: 'blocked', label: this.ui.status.blocked }
    ];
  }

  get priorityOptions(): Array<{ value: TaskPriority; label: string }> {
    return [
      { value: 'low', label: this.ui.priority.low },
      { value: 'medium', label: this.ui.priority.medium },
      { value: 'high', label: this.ui.priority.high },
      { value: 'urgent', label: this.isArabic ? 'عاجلة' : 'Urgente' }
    ];
  }

  get isEditMode(): boolean {
    return !!this.taskId;
  }

  get subtasksArray(): FormArray<TaskSubtaskFormGroup> {
    return this.form.controls.subtasks;
  }

  subtaskTitleControl(index: number): FormControl<string> {
    return this.subtasksArray.at(index).controls.title;
  }

  get subtasksTitle(): string {
    return this.isArabic ? 'المهام الفرعية' : 'Sous-tâches';
  }

  get subtasksHint(): string {
    return this.isArabic
      ? 'أضف قائمة بسيطة قابلة للتتبع للميدان أو الورشة.'
      : 'Ajoutez une checklist simple pour le terrain ou l atelier.';
  }

  get addSubtaskLabel(): string {
    return this.isArabic ? 'إضافة مهمة فرعية' : 'Ajouter une sous-tâche';
  }

  get removeSubtaskLabel(): string {
    return this.isArabic ? 'Supprimer' : 'Supprimer';
  }

  get subtaskPlaceholder(): string {
    return this.isArabic ? 'عنوان المهمة الفرعية' : 'Titre de la sous-tâche';
  }

  get requiresPhotoProofLabel(): string {
    return this.isArabic ? 'إثبات صورة obligatoire en fin de tâche' : 'Preuve photo obligatoire en fin de tâche';
  }

  get requiresPhotoProofHint(): string {
    return this.isArabic
      ? 'Si activé, la tâche ne pourra pas être finalisée sans photo de preuve.'
      : 'Si active, la tache ne pourra pas etre finalisee sans photo de preuve.';
  }

  get existingProofsTitle(): string {
    return this.isArabic ? 'صور المتابعة' : 'Photos d avancement';
  }

  get existingProofsHint(): string {
    return this.isArabic
      ? 'الصور المضافة من الموظف تظهر هنا للمتابعة.'
      : 'Les photos ajoutees par l employe apparaissent ici pour le suivi.';
  }

  onProofImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const anchor = img.closest('a');
    if (anchor instanceof HTMLElement) {
      anchor.style.display = 'none';
    } else {
      img.style.display = 'none';
    }
  }

  async ngOnInit(): Promise<void> {
    this.language.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLanguageFieldValidators();
      });

    this.taskId = this.route.snapshot.paramMap.get('id');
    const cachedEmployees = this.employeesRepository.getCachedList();
    this.syncView(() => {
      if (cachedEmployees.length) {
        this.employees = cachedEmployees;
      }
      this.loading = this.taskId ? true : cachedEmployees.length === 0;
    });
    try {
      const [employees, task] = await Promise.all([
        this.employeesRepository.list(),
        this.taskId ? this.tasksRepository.getById(this.taskId) : Promise.resolve(null)
      ]);
      this.syncView(() => {
        this.employees = employees;
        this.task = task;
      });
      if (task) {
        this.patchForm(task);
      }
      if (this.taskId && !task) {
        this.syncView(() => {
          this.error = 'Tache introuvable.';
        });
      }
    } catch {
      this.syncView(() => {
        this.error = 'Chargement impossible.';
      });
    } finally {
      this.syncView(() => {
        this.loading = false;
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async submit(): Promise<void> {
    this.syncView(() => {
      this.error = '';
    });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const raw = this.form.getRawValue();
    const titleFr = raw.titleFr?.trim() || null;
    const titleAr = raw.titleAr?.trim() || null;
    const descriptionFr = raw.descriptionFr?.trim() || null;
    const descriptionAr = raw.descriptionAr?.trim() || null;
    const activeTitle = this.isArabic ? titleAr : titleFr;
    const fallbackTitle = titleFr || titleAr || '';

    if (!activeTitle) {
      this.syncView(() => {
        this.error = 'TASK_TITLE_REQUIRED';
      });
      return;
    }

    const payload: TaskUpsertInput = {
      title: activeTitle || fallbackTitle,
      titleFr,
      titleAr,
      description: this.isArabic ? (descriptionAr || descriptionFr) : (descriptionFr || descriptionAr),
      descriptionFr,
      descriptionAr,
      employeeId: raw.employeeId?.trim() || null,
      status: raw.status ?? 'todo',
      priority: raw.priority ?? 'medium',
      dueDate: raw.dueDate || null,
      progress: Number(raw.progress ?? 0),
      requiresPhotoProof: !!raw.requiresPhotoProof,
      subtasks: this.subtasksArray.controls
        .map((control) => {
          const value = control.getRawValue() as { id?: string | null; title?: string | null };
          return {
            id: value.id?.trim() || null,
            title: value.title?.trim() || ''
          };
        })
        .filter((subtask) => !!subtask.title)
    };

    this.syncView(() => {
      this.saving = true;
    });
    try {
      const result = this.taskId
        ? await this.tasksRepository.update(this.taskId, payload)
        : await this.tasksRepository.create(payload);

      if (!result) {
        this.syncView(() => {
          this.error = 'Enregistrement impossible.';
        });
        return;
      }

      await this.router.navigate(['/tasks']);
    } catch (error) {
      const message = error instanceof Error ? error.message.trim() : '';
      this.syncView(() => {
        this.error = message || 'Enregistrement impossible.';
      });
    } finally {
      this.syncView(() => {
        this.saving = false;
      });
    }
  }

  private patchForm(task: TaskRecord): void {
    this.syncView(() => {
      this.form.patchValue({
        titleFr: task.titleFr || task.title || '',
        titleAr: task.titleAr || '',
        descriptionFr: task.descriptionFr || task.description || '',
        descriptionAr: task.descriptionAr || '',
        employeeId: task.employeeId || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || '',
        progress: task.progress,
        requiresPhotoProof: task.requiresPhotoProof
      });
      this.subtasksArray.clear();
      task.subtasks.forEach((subtask) => {
        this.subtasksArray.push(this.createSubtaskGroup(subtask.title, subtask.id));
      });
    });
  }

  addSubtask(title = '', id: string | null = null): void {
    this.subtasksArray.push(this.createSubtaskGroup(title, id));
    this.cdr.detectChanges();
  }

  removeSubtask(index: number): void {
    this.subtasksArray.removeAt(index);
    this.cdr.detectChanges();
  }

  private updateLanguageFieldValidators(): void {
    const activeTitleControl = this.form.controls[this.activeTitleControlName];
    const hiddenTitleControl = this.form.controls[this.isArabic ? 'titleFr' : 'titleAr'];

    activeTitleControl.setValidators([Validators.required, Validators.minLength(2)]);
    hiddenTitleControl.setValidators([Validators.minLength(2)]);

    activeTitleControl.updateValueAndValidity({ emitEvent: false });
    hiddenTitleControl.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  private createSubtaskGroup(title = '', id: string | null = null): TaskSubtaskFormGroup {
    return this.fb.group({
      id: this.fb.control<string | null>(id),
      title: this.fb.control(title, { nonNullable: true })
    });
  }

  private syncView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }
}

type TaskSubtaskFormGroup = FormGroup<{
  id: FormControl<string | null>;
  title: FormControl<string>;
}>;
