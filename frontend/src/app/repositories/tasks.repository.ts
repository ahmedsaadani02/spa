import { Injectable } from '@angular/core';
import { MyTaskUpdateInput, TaskRecord, TaskUpsertInput } from '../models/task.models';
import { AppApiService } from '../services/app-api.service';

export type TaskFilters = {
  employeeId?: string;
  status?: string;
  priority?: string;
};

@Injectable({
  providedIn: 'root'
})
export class TasksRepository {
  private cachedDefaultList: TaskRecord[] = [];
  private hasCachedDefaultList = false;
  private cachedMineDefaultList: TaskRecord[] = [];
  private hasCachedMineDefaultList = false;
  private warmDefaultPromise: Promise<TaskRecord[]> | null = null;
  private warmMinePromise: Promise<TaskRecord[]> | null = null;

  constructor(private ipc: AppApiService) {}

  async list(filters: TaskFilters = {}): Promise<TaskRecord[]> {
    const tasks = await this.ipc.tasksList(filters);
    if (this.isDefaultFilters(filters)) {
      this.cachedDefaultList = tasks;
      this.hasCachedDefaultList = true;
    }
    return tasks;
  }

  getCachedDefaultList(): TaskRecord[] {
    return this.hasCachedDefaultList ? [...this.cachedDefaultList] : [];
  }

  async warmDefaultList(): Promise<TaskRecord[]> {
    if (this.hasCachedDefaultList) {
      return [...this.cachedDefaultList];
    }
    if (this.warmDefaultPromise) {
      return this.warmDefaultPromise;
    }

    this.warmDefaultPromise = this.ipc.tasksList({})
      .then((tasks) => {
        this.cachedDefaultList = tasks;
        this.hasCachedDefaultList = true;
        return tasks;
      })
      .finally(() => {
        this.warmDefaultPromise = null;
      });

    return this.warmDefaultPromise;
  }

  async getById(id: string): Promise<TaskRecord | null> {
    const task = await this.ipc.tasksGetById(id);
    if (task) {
      this.cachedDefaultList = this.cachedDefaultList.some((cachedTask) => cachedTask.id === id)
        ? this.cachedDefaultList.map((cachedTask) => cachedTask.id === id ? task : cachedTask)
        : [...this.cachedDefaultList, task];
      this.hasCachedDefaultList = true;
      return task;
    }
    return this.cachedDefaultList.find((cachedTask) => cachedTask.id === id) ?? null;
  }

  async create(payload: TaskUpsertInput): Promise<TaskRecord | null> {
    const created = await this.ipc.tasksCreate(payload);
    this.invalidateAdminCache();
    return created;
  }

  async update(id: string, payload: TaskUpsertInput): Promise<TaskRecord | null> {
    const updated = await this.ipc.tasksUpdate(id, payload);
    this.invalidateAdminCache();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.ipc.tasksDelete(id);
    this.invalidateAdminCache();
    this.invalidateMineCache();
    return deleted;
  }

  async listMine(filters: Omit<TaskFilters, 'employeeId'> = {}): Promise<TaskRecord[]> {
    const tasks = await this.ipc.myTasksList(filters);
    if (this.isDefaultMineFilters(filters)) {
      this.cachedMineDefaultList = tasks;
      this.hasCachedMineDefaultList = true;
    }
    return tasks;
  }

  getCachedMineDefaultList(): TaskRecord[] {
    return this.hasCachedMineDefaultList ? [...this.cachedMineDefaultList] : [];
  }

  async warmMineDefaultList(): Promise<TaskRecord[]> {
    if (this.hasCachedMineDefaultList) {
      return [...this.cachedMineDefaultList];
    }
    if (this.warmMinePromise) {
      return this.warmMinePromise;
    }

    this.warmMinePromise = this.ipc.myTasksList({})
      .then((tasks) => {
        this.cachedMineDefaultList = tasks;
        this.hasCachedMineDefaultList = true;
        return tasks;
      })
      .finally(() => {
        this.warmMinePromise = null;
      });

    return this.warmMinePromise;
  }

  async getMineById(id: string): Promise<TaskRecord | null> {
    const cached = this.cachedMineDefaultList.find((task) => task.id === id);
    if (cached) {
      return cached;
    }
    return this.ipc.myTasksGetById(id);
  }

  async updateMine(id: string, payload: MyTaskUpdateInput): Promise<TaskRecord | null> {
    const updated = await this.ipc.myTasksUpdate(id, payload);
    this.invalidateAdminCache();
    this.invalidateMineCache();
    return updated;
  }

  invalidateMineListCache(): void {
    this.invalidateMineCache();
  }

  private isDefaultFilters(filters: TaskFilters): boolean {
    return !filters.employeeId && !filters.status && !filters.priority;
  }

  private isDefaultMineFilters(filters: Omit<TaskFilters, 'employeeId'>): boolean {
    return !filters.status && !filters.priority;
  }

  private invalidateAdminCache(): void {
    this.cachedDefaultList = [];
    this.hasCachedDefaultList = false;
  }

  private invalidateMineCache(): void {
    this.cachedMineDefaultList = [];
    this.hasCachedMineDefaultList = false;
  }
}
