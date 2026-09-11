import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppState,
  Task,
  KnowledgeNote,
  Tag,
  TeamMember,
  AppNotification,
  Workspace,
  ViewMode,
  SyncStatus,
  TaskStatus
} from './types';
import {
  getLocalState,
  saveLocalState,
  initialFallbackState,
  checkDeadlinesAndAlerts,
  playNotificationChime,
  showSystemNotification
} from './services/storage';
import Header from './components/Header';
import Navigation from './components/Navigation';
import DashboardView from './components/DashboardView';
import TasksView from './components/TasksView';
import ScheduleView from './components/ScheduleView';
import KnowledgeView from './components/KnowledgeView';
import TeamView from './components/TeamView';
import SearchModal from './components/SearchModal';
import TaskModal from './components/TaskModal';
import NoteModal from './components/NoteModal';
import BackupModal from './components/BackupModal';

export default function App() {
  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Core Data State (Loaded from LocalStorage initially)
  const [appState, setAppState] = useState<AppState>(() => getLocalState());
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [taskModalDefaultDueDate, setTaskModalDefaultDueDate] = useState<string | undefined>(undefined);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<KnowledgeNote | undefined>(undefined);
  const [activeNoteIdInView, setActiveNoteIdInView] = useState<string | undefined>(undefined);

  // Debounce sync timer ref
  const syncTimeoutRef = useRef<any>(null);

  // Save state to LocalStorage and trigger background server sync
  const updateAndPersistState = useCallback((updater: (prev: AppState) => AppState) => {
    setAppState(prev => {
      const next = updater(prev);
      saveLocalState(next);

      // Trigger background sync to server if online
      if (navigator.onLine) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            setSyncStatus('syncing');
            const res = await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(next)
            });
            if (res.ok) {
              const resJson = await res.json();
              if (resJson.serverTimestamp) {
                setAppState(s => ({
                  ...s,
                  workspace: {
                    ...s.workspace,
                    lastSyncTimestamp: resJson.serverTimestamp
                  }
                }));
              }
              setSyncStatus('synced');
            } else {
              setSyncStatus('error');
            }
          } catch (err) {
            setSyncStatus('offline');
          }
        }, 600);
      } else {
        setSyncStatus('offline');
      }

      return next;
    });
  }, []);

  // Initial sync from server on mount
  useEffect(() => {
    async function loadFromServer() {
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }
      try {
        setSyncStatus('syncing');
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.tasks) {
            setAppState(json.data);
            saveLocalState(json.data);
          }
          setSyncStatus('synced');
        }
      } catch (e) {
        setSyncStatus('offline');
      }
    }
    loadFromServer();
  }, []);

  // Monitor network online / offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      // trigger sync immediately
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appState)
      })
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appState]);

  // Global deadline check & alert generator loop (every 60s)
  useEffect(() => {
    const checkAlerts = () => {
      const generatedAlerts = checkDeadlinesAndAlerts(appState.tasks);
      if (generatedAlerts.length > 0) {
        // Merge with existing notifications if not already present
        updateAndPersistState(prev => {
          const existingIds = new Set(prev.notifications.map(n => n.id));
          const newAlerts = generatedAlerts.filter(a => !existingIds.has(a.id));

          if (newAlerts.length > 0) {
            // Play notification chime and show browser notification
            playNotificationChime();
            showSystemNotification(newAlerts[0].title, newAlerts[0].message);
            return {
              ...prev,
              notifications: [...newAlerts, ...prev.notifications]
            };
          }
          return prev;
        });
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [appState.tasks, updateAndPersistState]);

  // Global Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manual Sync trigger
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appState)
      });
      if (res.ok) {
        const json = await res.json();
        setAppState(json.data);
        saveLocalState(json.data);
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('offline');
    }
  };

  // Task actions
  const handleToggleTaskComplete = (taskId: string) => {
    updateAndPersistState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const nextStatus: TaskStatus = t.status === 'completed' ? 'todo' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      })
    }));
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    updateAndPersistState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    if (!window.confirm('이 할 일을 삭제하시겠습니까?')) return;
    updateAndPersistState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleSaveTask = (savedTask: Task) => {
    updateAndPersistState(prev => {
      const exists = prev.tasks.some(t => t.id === savedTask.id);
      return {
        ...prev,
        tasks: exists
          ? prev.tasks.map(t => (t.id === savedTask.id ? savedTask : t))
          : [savedTask, ...prev.tasks]
      };
    });
    setActiveTask(prev => (prev && prev.id === savedTask.id ? savedTask : prev));
  };

  // Note actions
  const handleSaveNote = (savedNote: KnowledgeNote) => {
    updateAndPersistState(prev => {
      const exists = prev.notes.some(n => n.id === savedNote.id);
      return {
        ...prev,
        notes: exists
          ? prev.notes.map(n => (n.id === savedNote.id ? savedNote : n))
          : [savedNote, ...prev.notes]
      };
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm('이 지식 노트를 삭제하시겠습니까?')) return;
    updateAndPersistState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== noteId)
    }));
  };

  // Tag creation
  const handleAddTag = (tagName: string) => {
    updateAndPersistState(prev => {
      if (prev.tags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
        return prev;
      }
      const colors = ['blue', 'indigo', 'emerald', 'purple', 'amber', 'pink', 'teal', 'sky', 'rose', 'orange'];
      const randomColor = colors[prev.tags.length % colors.length];
      const newTag: Tag = {
        id: `tag-${Date.now()}`,
        name: tagName,
        color: randomColor
      };
      return {
        ...prev,
        tags: [...prev.tags, newTag]
      };
    });
  };

  // Quick Capture from Dashboard
  const handleQuickCapture = (text: string, type: 'task' | 'note') => {
    // Extract tags (e.g. #개발 #프로젝트)
    const tagMatches = text.match(/#([a-zA-Z0-9가-힣_-]+)/g);
    const extractedTags = tagMatches ? tagMatches.map(t => t.slice(1)) : ['일반'];
    const cleanTitle = text.replace(/#([a-zA-Z0-9가-힣_-]+)/g, '').trim();

    extractedTags.forEach(t => handleAddTag(t));

    if (type === 'task') {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: cleanTitle || text,
        description: '',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(), // 8 hours later
        priority: 'medium',
        status: 'todo',
        tags: extractedTags,
        category: '업무',
        assigneeId: 'user-1',
        reminderMinutesBefore: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedNoteIds: [],
        comments: []
      };
      handleSaveTask(newTask);
    } else {
      const newNote: KnowledgeNote = {
        id: `note-${Date.now()}`,
        title: cleanTitle || text,
        content: `# ${cleanTitle || text}\n\n빠른 캡처로 기록된 메모입니다.`,
        tags: extractedTags,
        category: '일반',
        isPinned: false,
        linkedTaskIds: [],
        author: '김민준 (나)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
      };
      handleSaveNote(newNote);
    }
  };

  // Check for shared workspace link access in URL query
  const [sharedBanner, setSharedBanner] = useState<{
    show: boolean;
    workspaceId?: string;
    role?: string;
  }>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const ws = params.get('workspace');
        const role = params.get('role');
        if (ws) {
          return { show: true, workspaceId: ws, role: role || 'edit' };
        }
      }
    } catch {
      // ignore
    }
    return { show: false };
  });

  // Team actions
  const handleAddTeamMember = (newMember: Omit<TeamMember, 'id'>) => {
    updateAndPersistState(prev => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          ...newMember,
          id: `user-${Date.now()}`
        }
      ]
    }));
  };

  const handleUpdateTeamMember = (updatedMember: TeamMember) => {
    updateAndPersistState(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(m => (m.id === updatedMember.id ? updatedMember : m))
    }));
  };

  const handleDeleteTeamMember = (memberId: string) => {
    updateAndPersistState(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.id !== memberId),
      tasks: prev.tasks.map(t => (t.assigneeId === memberId ? { ...t, assigneeId: undefined } : t))
    }));
  };

  const handleUpdateWorkspace = (workspace: Workspace) => {
    updateAndPersistState(prev => ({
      ...prev,
      workspace
    }));
  };

  // Notification actions
  const handleMarkNotificationRead = (id: string) => {
    updateAndPersistState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    }));
  };

  const handleClearAllNotifications = () => {
    updateAndPersistState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  };

  // Backup & Restore
  const handleRestoreState = (restored: AppState) => {
    setAppState(restored);
    saveLocalState(restored);
    if (navigator.onLine) {
      fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restored)
      }).catch(err => console.error(err));
    }
  };

  const handleResetToSample = async () => {
    setAppState(initialFallbackState);
    saveLocalState(initialFallbackState);
    if (navigator.onLine) {
      await fetch('/api/reset', { method: 'POST' }).catch(() => {});
    }
  };

  // Calculated counts for navigation
  const nowMs = Date.now();
  const taskCounts = {
    total: appState.tasks.length,
    dueSoon: appState.tasks.filter(
      t =>
        t.status !== 'completed' &&
        new Date(t.dueDate).getTime() - nowMs >= 0 &&
        new Date(t.dueDate).getTime() - nowMs <= 1000 * 60 * 60 * 24
    ).length,
    completed: appState.tasks.filter(t => t.status === 'completed').length,
    notes: appState.notes.length,
    members: appState.teamMembers.length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Sticky Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        syncStatus={syncStatus}
        lastSyncTime={appState.workspace.lastSyncTimestamp}
        onManualSync={handleManualSync}
        notifications={appState.notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenBackup={() => setBackupModalOpen(true)}
        onOpenNewTask={() => {
          setActiveTask(undefined);
          setTaskModalDefaultDueDate(undefined);
          setTaskModalOpen(true);
        }}
        onOpenNewNote={() => {
          setActiveNote(undefined);
          setNoteModalOpen(true);
        }}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        workspaceName={appState.workspace.name}
      />

      {/* Shared Workspace Participation Banner */}
      {sharedBanner.show && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between text-xs md:text-sm shadow-xs border-b border-blue-700/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              🔗 <strong>공유 워크스페이스에 접속되었습니다.</strong> ({appState.workspace.name} ·{' '}
              {sharedBanner.role === 'view' ? '읽기 전용 모드' : '실시간 편집 가능 모드'})
            </span>
          </div>
          <button
            onClick={() => setSharedBanner({ show: false })}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            확인
          </button>
        </div>
      )}

      {/* Main layout: Sidebar + Content Area */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        {/* Navigation Sidebar (Desktop + Mobile drawer/bottom bar) */}
        <Navigation
          currentView={currentView}
          onSelectView={view => {
            setCurrentView(view);
            setMobileMenuOpen(false);
          }}
          tags={appState.tags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          taskCounts={taskCounts}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
          onOpenBackup={() => setBackupModalOpen(true)}
          onOpenShareModal={() => setCurrentView('team')}
        />

        {/* View Content Canvas */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              tasks={appState.tasks}
              notes={appState.notes}
              tags={appState.tags}
              onToggleTaskComplete={handleToggleTaskComplete}
              onOpenTaskModal={task => {
                setActiveTask(task);
                setTaskModalDefaultDueDate(undefined);
                setTaskModalOpen(true);
              }}
              onOpenNoteModal={note => {
                if (note) {
                  setActiveNoteIdInView(note.id);
                  setCurrentView('knowledge');
                } else {
                  setActiveNote(undefined);
                  setNoteModalOpen(true);
                }
              }}
              onNavigate={setCurrentView}
              onSelectTag={setSelectedTag}
              onQuickCapture={handleQuickCapture}
              selectedTag={selectedTag}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              tasks={appState.tasks}
              tags={appState.tags}
              teamMembers={appState.teamMembers}
              onToggleTaskComplete={handleToggleTaskComplete}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onOpenTaskModal={task => {
                setActiveTask(task);
                setTaskModalDefaultDueDate(undefined);
                setTaskModalOpen(true);
              }}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              onOpenNoteModalById={noteId => {
                setActiveNoteIdInView(noteId);
                setCurrentView('knowledge');
              }}
            />
          )}

          {currentView === 'schedule' && (
            <ScheduleView
              tasks={appState.tasks}
              onOpenTaskModal={(task, defaultDueDate) => {
                setActiveTask(task);
                setTaskModalDefaultDueDate(defaultDueDate);
                setTaskModalOpen(true);
              }}
              onToggleTaskComplete={handleToggleTaskComplete}
            />
          )}

          {currentView === 'knowledge' && (
            <KnowledgeView
              notes={appState.notes}
              tasks={appState.tasks}
              tags={appState.tags}
              teamMembers={appState.teamMembers}
              onOpenNoteModal={note => {
                setActiveNote(note);
                setNoteModalOpen(true);
              }}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onOpenTaskModal={task => {
                setActiveTask(task);
                setTaskModalDefaultDueDate(undefined);
                setTaskModalOpen(true);
              }}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              activeNoteId={activeNoteIdInView}
            />
          )}

          {currentView === 'team' && (
            <TeamView
              teamMembers={appState.teamMembers}
              tasks={appState.tasks}
              workspace={appState.workspace}
              onUpdateWorkspace={handleUpdateWorkspace}
              onAddTeamMember={handleAddTeamMember}
              onUpdateTeamMember={handleUpdateTeamMember}
              onDeleteTeamMember={handleDeleteTeamMember}
              onOpenTaskModal={task => {
                setActiveTask(task);
                setTaskModalDefaultDueDate(undefined);
                setTaskModalOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        tasks={appState.tasks}
        notes={appState.notes}
        onSelectTask={task => {
          setActiveTask(task);
          setTaskModalDefaultDueDate(undefined);
          setTaskModalOpen(true);
        }}
        onSelectNote={note => {
          setActiveNoteIdInView(note.id);
          setCurrentView('knowledge');
        }}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setActiveTask(undefined);
          setTaskModalDefaultDueDate(undefined);
        }}
        task={activeTask}
        onSave={handleSaveTask}
        tags={appState.tags}
        onAddTag={handleAddTag}
        teamMembers={appState.teamMembers}
        notes={appState.notes}
        defaultDueDate={taskModalDefaultDueDate}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setActiveNote(undefined);
        }}
        note={activeNote}
        onSave={handleSaveNote}
        tags={appState.tags}
        onAddTag={handleAddTag}
        tasks={appState.tasks}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        appState={appState}
        onRestoreState={handleRestoreState}
        onResetToSample={handleResetToSample}
        isOnline={isOnline}
        lastSyncTime={appState.workspace.lastSyncTimestamp}
      />
    </div>
  );
}
