import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import type { SpaDbBackupEntry, SpaUpdateStatusPayload, SpaUpdateStatusType } from '../types/electron';
import { IpcService } from '../services/ipc.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {
  backups: SpaDbBackupEntry[] = [];
  loading = false;
  creatingBackup = false;
  restoringFileName: string | null = null;
  infoMessage = '';
  errorMessage = '';
  updateStatus: SpaUpdateStatusType = 'none';
  updateMessage = 'Aucune verification effectuee.';
  updateError = '';
  updateProgress = 0;
  checkingUpdates = false;
  installingUpdate = false;
  private unsubscribeUpdateStatus: (() => void) | null = null;

  constructor(
    private readonly ipc: IpcService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get hasDbApi(): boolean {
    return this.ipc.isAvailable;
  }

  get hasUpdatesApi(): boolean {
    return this.ipc.isAvailable;
  }

  ngOnInit(): void {
    void this.loadBackups();
    void this.initUpdatesState();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeUpdateStatus) {
      this.unsubscribeUpdateStatus();
      this.unsubscribeUpdateStatus = null;
    }
  }

  trackByBackup = (_: number, backup: SpaDbBackupEntry): string => backup.fileName;

  async createBackup(): Promise<void> {
    if (this.creatingBackup) return;

    this.creatingBackup = true;
    this.errorMessage = '';
    this.infoMessage = '';
    this.cdr.markForCheck();

    try {
      const result = await this.ipc.dbBackup();
      if (!result?.ok) {
        this.errorMessage = result?.message ?? 'Sauvegarde impossible.';
        return;
      }

      this.infoMessage = `Sauvegarde creee: ${result.fileName ?? 'OK'}`;
      await this.loadBackups();
    } finally {
      this.creatingBackup = false;
      this.cdr.markForCheck();
    }
  }

  async restoreBackup(backup: SpaDbBackupEntry): Promise<void> {
    if (this.restoringFileName) return;

    const confirmed = globalThis.confirm(
      `Confirmer la restauration de "${backup.fileName}" ?\nLa base actuelle sera remplacee.`
    );
    if (!confirmed) return;

    this.restoringFileName = backup.fileName;
    this.errorMessage = '';
    this.infoMessage = '';
    this.cdr.markForCheck();

    try {
      const restored = await this.ipc.dbRestore(backup.fileName);
      if (!restored) {
        this.errorMessage = 'Restauration impossible.';
        return;
      }

      this.infoMessage = `Restauration terminee: ${backup.fileName}`;
      await this.loadBackups();
    } finally {
      this.restoringFileName = null;
      this.cdr.markForCheck();
    }
  }

  formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  private async loadBackups(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    try {
      this.backups = await this.ipc.dbListBackups();
    } catch {
      this.backups = [];
      this.errorMessage = 'Chargement des sauvegardes impossible.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async checkForUpdates(): Promise<void> {
    if (!this.hasUpdatesApi || this.checkingUpdates) return;

    this.checkingUpdates = true;
    this.updateError = '';
    this.updateMessage = 'Recherche des mises a jour...';
    this.cdr.markForCheck();

    try {
      await this.ipc.updatesCheck();
    } finally {
      this.checkingUpdates = false;
      this.cdr.markForCheck();
    }
  }

  async installUpdateNow(): Promise<void> {
    if (!this.hasUpdatesApi || this.installingUpdate) return;

    this.installingUpdate = true;
    this.cdr.markForCheck();

    try {
      await this.ipc.updatesInstall();
    } finally {
      this.installingUpdate = false;
      this.cdr.markForCheck();
    }
  }

  getUpdateStatusLabel(): string {
    switch (this.updateStatus) {
      case 'checking':
        return 'recherche...';
      case 'available':
        return 'mise a jour detectee';
      case 'downloading':
        return 'telechargement...';
      case 'downloaded':
        return 'pret a installer';
      case 'error':
        return 'erreur';
      case 'none':
      default:
        return 'a jour';
    }
  }

  private async initUpdatesState(): Promise<void> {
    if (!this.hasUpdatesApi) return;

    this.unsubscribeUpdateStatus = this.ipc.updatesOnStatus((payload) => {
      this.applyUpdateStatus(payload);
      this.cdr.markForCheck();
    });

    const current = await this.ipc.updatesGetStatus();
    if (current) {
      this.applyUpdateStatus(current);
      this.cdr.markForCheck();
    }
  }

  private applyUpdateStatus(payload: SpaUpdateStatusPayload): void {
    this.updateStatus = payload.status;
    this.updateMessage = payload.message ?? this.updateMessage;
    this.updateProgress = Number(payload.percent ?? 0);

    if (payload.status === 'error') {
      this.updateError = payload.message ?? 'Erreur pendant la mise a jour.';
    } else {
      this.updateError = '';
    }
  }
}
