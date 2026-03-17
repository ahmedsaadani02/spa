import { Injectable } from '@angular/core';
import { Employee, EmployeeUpsertInput } from '../models/employee.models';
import { IpcService } from '../services/ipc.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeesRepository {
  constructor(private ipc: IpcService) {}

  async list(): Promise<Employee[]> {
    const raw = await this.ipc.employeesList();
    console.log('[employees-page] raw response', raw);
    const mapped = this.normalizeEmployeesPayload(raw);
    console.log('[employees-page] mapped employees', mapped);
    return mapped;
  }

  getById(id: string): Promise<Employee | null> {
    return this.ipc.employeesGetById(id);
  }

  create(payload: EmployeeUpsertInput): Promise<Employee | null> {
    return this.ipc.employeesCreate(payload);
  }

  update(id: string, payload: EmployeeUpsertInput): Promise<Employee | null> {
    return this.ipc.employeesUpdate(id, payload);
  }

  delete(id: string): Promise<boolean> {
    return this.ipc.employeesDelete(id);
  }

  async search(query: string): Promise<Employee[]> {
    const raw = await this.ipc.employeesSearch(query);
    console.log('[employees-page] raw response', raw);
    const mapped = this.normalizeEmployeesPayload(raw);
    console.log('[employees-page] mapped employees', mapped);
    return mapped;
  }

  setActive(id: string, actif: boolean): Promise<boolean> {
    return this.ipc.employeesSetActive(id, actif);
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
