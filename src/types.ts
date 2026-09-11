export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO String
  priority: Priority;
  status: TaskStatus;
  tags: string[];
  category: string;
  assigneeId?: string;
  reminderMinutesBefore?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  linkedNoteIds: string[];
  comments: Comment[];
}

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string; // Markdown
  tags: string[];
  category: string;
  isPinned: boolean;
  linkedTaskIds: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'online' | 'offline';
}

export interface AppNotification {
  id: string;
  type: 'due_soon' | 'overdue' | 'sync' | 'team_mention' | 'backup';
  title: string;
  message: string;
  date: string;
  read: boolean;
  taskId?: string;
}

export interface Workspace {
  id: string;
  name: string;
  lastSyncTimestamp: string;
  isShared: boolean;
  shareLink: string;
  accessRole: 'view' | 'edit';
}

export interface AppState {
  tasks: Task[];
  notes: KnowledgeNote[];
  tags: Tag[];
  teamMembers: TeamMember[];
  notifications: AppNotification[];
  workspace: Workspace;
}

export type ViewMode = 'dashboard' | 'tasks' | 'schedule' | 'knowledge' | 'team';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
