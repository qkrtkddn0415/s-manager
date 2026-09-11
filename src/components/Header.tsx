import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  RefreshCw,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  Menu,
  FileText,
  CheckSquare
} from 'lucide-react';
import { SyncStatus, AppNotification, Task } from '../types';
import { playNotificationChime, requestNotificationPermission } from '../services/storage';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  syncStatus: SyncStatus;
  lastSyncTime: string;
  onManualSync: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onOpenSearch: () => void;
  onOpenBackup: () => void;
  onOpenNewTask: () => void;
  onOpenNewNote: () => void;
  onSelectTask?: (task: Task) => void;
  onToggleMobileMenu: () => void;
  workspaceName: string;
}

export default function Header({
  darkMode,
  onToggleDarkMode,
  syncStatus,
  lastSyncTime,
  onManualSync,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onOpenSearch,
  onOpenBackup,
  onOpenNewTask,
  onOpenNewNote,
  onToggleMobileMenu,
  workspaceName,
}: HeaderProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playNotificationChime();
  };

  const handleRequestBrowserNotif = async () => {
    const granted = await requestNotificationPermission();
    if (granted && soundEnabled) playNotificationChime();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile hamburger & Workspace title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            K
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {workspaceName}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              개인 지식 & 할 일 일정 관리
            </p>
          </div>
        </div>
      </div>

      {/* Center: Search trigger (Desktop) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <button
          id="global-search-btn"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>지식 노트, 할 일, 태그 검색...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile search icon */}
        <button
          onClick={onOpenSearch}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          title="검색"
          aria-label="검색창 열기"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Sync Status Pill */}
        <button
          id="sync-status-btn"
          onClick={onManualSync}
          disabled={syncStatus === 'syncing'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            syncStatus === 'synced'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : syncStatus === 'syncing'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}
          title={`마지막 동기화: ${new Date(lastSyncTime).toLocaleTimeString('ko-KR')} (클릭하여 동기화)`}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
          ) : syncStatus === 'offline' ? (
            <CloudOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          ) : (
            <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="hidden sm:inline">
            {syncStatus === 'syncing'
              ? '동기화 중'
              : syncStatus === 'offline'
              ? '오프라인'
              : '동기화됨'}
          </span>
        </button>

        {/* Backup & Restore modal trigger */}
        <button
          id="backup-menu-btn"
          onClick={onOpenBackup}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="데이터 백업 및 복원"
          aria-label="데이터 백업 및 복원"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="마감일 및 시스템 알림"
            aria-label="알림 목록 보기"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    마감일 및 활동 알림
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-full text-[11px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSoundToggle}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={soundEnabled ? '알림 효과음 켜짐' : '효과음 꺼짐'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={onClearAllNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  >
                    모두 읽음
                  </button>
                </div>
              </div>

              {/* Browser notification permission banner if not granted */}
              {'Notification' in window && Notification.permission !== 'granted' && (
                <div className="px-4 py-2 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300">
                    브라우저 마감일 푸시 알림 허용
                  </span>
                  <button
                    onClick={handleRequestBrowserNotif}
                    className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-medium hover:bg-blue-700"
                  >
                    허용
                  </button>
                </div>
              )}

              {/* Notification Items */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    새로운 알림이 없습니다.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !notif.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'overdue' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ) : notif.type === 'due_soon' ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle-btn"
          onClick={onToggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          aria-label="화면 테마 전환"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Quick Add Button */}
        <div className="relative" ref={addRef}>
          <button
            id="quick-add-btn"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">생성</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <button
                id="create-new-task-btn"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenNewTask();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                새 할 일 / 일정 등록
              </button>
              <button
                id="create-new-note-btn"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenNewNote();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                새 지식 노트 작성
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
