import { Injectable } from '@angular/core';
import { SalaryAdvance, SalaryAdvanceInput } from '../models/employee.models';
import { AppApiService } from '../services/app-api.service';

@Injectable({
  providedIn: 'root'
})
export class SalaryAdvancesRepository {
  constructor(private ipc: AppApiService) {}

  listByEmployee(employeeId: string, month: number, year: number): Promise<SalaryAdvance[]> {
    return this.ipc.salaryAdvancesList(employeeId, month, year);
  }

  create(payload: SalaryAdvanceInput): Promise<SalaryAdvance | null> {
    return this.ipc.salaryAdvancesCreate(payload);
  }

  delete(id: string): Promise<boolean> {
    return this.ipc.salaryAdvancesDelete(id);
  }

  getMonthlyTotal(employeeId: string, month: number, year: number): Promise<number> {
    return this.ipc.salaryAdvancesTotal(employeeId, month, year);
  }
}
