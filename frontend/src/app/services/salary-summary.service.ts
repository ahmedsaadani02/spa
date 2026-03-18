import { Injectable } from '@angular/core';
import { SalarySummary } from '../models/employee.models';
import { IpcService } from './ipc.service';

@Injectable({
  providedIn: 'root'
})
export class SalarySummaryService {
  constructor(private ipc: IpcService) {}

  getEmployeeSalarySummary(employeeId: string, month: number, year: number): Promise<SalarySummary | null> {
    return this.ipc.salarySummary(employeeId, month, year);
  }
}
