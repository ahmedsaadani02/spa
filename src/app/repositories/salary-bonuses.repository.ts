import { Injectable } from '@angular/core';
import { SalaryBonus, SalaryBonusInput } from '../models/employee.models';
import { IpcService } from '../services/ipc.service';

@Injectable({
  providedIn: 'root'
})
export class SalaryBonusesRepository {
  constructor(private ipc: IpcService) {}

  listByEmployee(employeeId: string, month: number, year: number): Promise<SalaryBonus[]> {
    return this.ipc.salaryBonusesList(employeeId, month, year);
  }

  create(payload: SalaryBonusInput): Promise<SalaryBonus | null> {
    return this.ipc.salaryBonusesCreate(payload);
  }

  delete(id: string): Promise<boolean> {
    return this.ipc.salaryBonusesDelete(id);
  }

  getMonthlyTotal(employeeId: string, month: number, year: number): Promise<number> {
    return this.ipc.salaryBonusesTotal(employeeId, month, year);
  }
}
