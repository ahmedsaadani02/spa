export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSubtaskRecord {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
}

export interface TaskPhotoProofRecord {
  id: string;
  imageRef: string;
  imageUrl: string | null;
  fileName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string | null;
}

export interface TaskUpdateHistoryRecord {
  id: string;
  actionType: string;
  comment: string | null;
  status: TaskStatus | null;
  progress: number | null;
  actorId: string | null;
  actorName: string | null;
  subtaskId: string | null;
  subtaskTitle: string | null;
  subtaskCompleted: boolean | null;
  photoCount: number;
  createdAt: string | null;
}

export interface TaskSubtaskInput {
  id?: string | null;
  title?: string | null;
}

export interface TaskSubtaskUpdateInput {
  id: string;
  completed: boolean;
}

export interface TaskPhotoUploadInput {
  fileName?: string | null;
  dataUrl: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  titleFr: string | null;
  titleAr: string | null;
  description: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  employeeId: string | null;
  employeeName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  progress: number;
  employeeNote: string | null;
  requiresPhotoProof: boolean;
  updatedByEmployeeAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  subtasks: TaskSubtaskRecord[];
  photoProofs: TaskPhotoProofRecord[];
  updateHistory: TaskUpdateHistoryRecord[];
}

export interface TaskUpsertInput {
  title?: string;
  titleFr?: string | null;
  titleAr?: string | null;
  description?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  employeeId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  progress?: number;
  requiresPhotoProof?: boolean;
  subtasks?: TaskSubtaskInput[];
}

export interface MyTaskUpdateInput {
  status?: TaskStatus;
  progress?: number;
  employeeNote?: string | null;
  subtaskUpdates?: TaskSubtaskUpdateInput[];
  newPhotoProofs?: TaskPhotoUploadInput[];
}

export interface TaskNotificationRecord {
  id: string;
  employeeId: string;
  taskId: string | null;
  kind: 'task_assigned';
  actorName: string | null;
  taskTitleFr: string | null;
  taskTitleAr: string | null;
  createdAt: string | null;
  readAt: string | null;
  isRead: boolean;
}
