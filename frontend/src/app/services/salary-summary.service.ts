import { Injectable } from '@angular/core';
import { SalarySummary } from '../models/employee.models';
import { AppApiService } from './app-api.service';

@Injectable({
  providedIn: 'root'
})
export class SalarySummaryService {
  constructor(private ipc: AppApiService) {}

  getEmployeeSalarySummary(employeeId: string, month: number, year: number): Promise<SalarySummary | null> {
    return this.ipc.salarySummary(employeeId, month, year);
  }
}
