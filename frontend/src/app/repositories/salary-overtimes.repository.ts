import { Injectable } from '@angular/core';
import { SalaryOvertime, SalaryOvertimeInput } from '../models/employee.models';
import { AppApiService } from '../services/app-api.service';

@Injectable({
  providedIn: 'root'
})
export class SalaryOvertimesRepository {
  constructor(private ipc: AppApiService) {}

  listByEmployee(employeeId: string, month: number, year: number): Promise<SalaryOvertime[]> {
    return this.ipc.salaryOvertimesList(employeeId, month, year);
  }

  create(payload: SalaryOvertimeInput): Promise<SalaryOvertime | null> {
    return this.ipc.salaryOvertimesCreate(payload);
  }

  delete(id: string): Promise<boolean> {
    return this.ipc.salaryOvertimesDelete(id);
  }

  getMonthlyTotalHours(employeeId: string, month: number, year: number): Promise<number> {
    return this.ipc.salaryOvertimesTotalHours(employeeId, month, year);
  }
}
