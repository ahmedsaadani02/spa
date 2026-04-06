import { Injectable } from '@angular/core';
import { Employee, EmployeeUpsertInput } from '../models/employee.models';
import { AppApiService } from '../services/app-api.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeesRepository {
  private cachedList: Employee[] = [];
  private hasCachedList = false;
  private warmListPromise: Promise<Employee[]> | null = null;

  constructor(private ipc: AppApiService) {}

  async list(forceRefresh = false): Promise<Employee[]> {
    if (!forceRefresh && this.hasCachedList) {
      return [...this.cachedList];
    }
    const raw = await this.ipc.employeesList();
    console.log('[employees-page] raw response', raw);
    const mapped = this.normalizeEmployeesPayload(raw);
    console.log('[employees-page] mapped employees', mapped);
    this.cachedList = mapped;
    this.hasCachedList = true;
    return [...mapped];
  }

  getCachedList(): Employee[] {
    return this.hasCachedList ? [...this.cachedList] : [];
  }

  async warmList(): Promise<Employee[]> {
    if (this.hasCachedList) {
      return [...this.cachedList];
    }
    if (this.warmListPromise) {
      return this.warmListPromise;
    }

    this.warmListPromise = this.list(true).finally(() => {
      this.warmListPromise = null;
    });
    return this.warmListPromise;
  }

  getById(id: string): Promise<Employee | null> {
    return this.ipc.employeesGetById(id);
  }

  async create(payload: EmployeeUpsertInput): Promise<Employee | null> {
    const created = await this.ipc.employeesCreate(payload);
    this.invalidateCache();
    return created;
  }

  async update(id: string, payload: EmployeeUpsertInput): Promise<Employee | null> {
    const updated = await this.ipc.employeesUpdate(id, payload);
    this.invalidateCache();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.ipc.employeesDelete(id);
    this.invalidateCache();
    return deleted;
  }

  async search(query: string): Promise<Employee[]> {
    const raw = await this.ipc.employeesSearch(query);
    console.log('[employees-page] raw response', raw);
    const mapped = this.normalizeEmployeesPayload(raw);
    console.log('[employees-page] mapped employees', mapped);
    return mapped;
  }

  async setActive(id: string, actif: boolean): Promise<boolean> {
    const updated = await this.ipc.employeesSetActive(id, actif);
    this.invalidateCache();
    return updated;
  }

  private invalidateCache(): void {
    this.cachedList = [];
    this.hasCachedList = false;
  }

  private normalizeEmployeesPayload(payload: unknown): Employee[] {
    if (Array.isArray(payload)) {
      return payload as Employee[];
    }

    if (payload && typeof payload === 'object') {
      const maybeObject = payload as {
        employees?: unknown;
        items?: unknown;
        data?: unknown;
        result?: unknown;
      };
      const collections = [maybeObject.employees, maybeObject.items, maybeObject.data, maybeObject.result];
      for (const collection of collections) {
        if (Array.isArray(collection)) {
          return collection as Employee[];
        }
      }
    }

    return [];
  }
}
