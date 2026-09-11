import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  Users,
  Tag as TagIcon,
  X,
  HardDrive,
  Share2
} from 'lucide-react';
import { ViewMode, Tag } from '../types';
import { getTagColorClass } from '../utils/colors';

interface NavigationProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  tags: Tag[];
  selectedTag: string | null;
  onSelectTag: (tagName: string | null) => void;
  taskCounts: {
    total: number;
    dueSoon: number;
    completed: number;
    notes: number;
    members?: number;
  };
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  onOpenBackup: () => void;
  onOpenShareModal: () => void;
}

export default function Navigation({
  currentView,
  onSelectView,
  tags,
  selectedTag,
  onSelectTag,
  taskCounts,
  mobileMenuOpen,
  onCloseMobileMenu,
  onOpenBackup,
  onOpenShareModal
}: NavigationProps) {
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: '대시보드',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'tasks' as ViewMode,
      label: '할 일 & 칸반',
      icon: CheckSquare,
      badge: taskCounts.total > 0 ? taskCounts.total : null
    },
    {
      id: 'schedule' as ViewMode,
      label: '일정 & 캘린더',
      icon: Calendar,
      badge: taskCounts.dueSoon > 0 ? `임박 ${taskCounts.dueSoon}` : null,
      badgeVariant: 'warning'
    },
    {
      id: 'knowledge' as ViewMode,
      label: '지식 보관함 (위키)',
      icon: BookOpen,
      badge: taskCounts.notes > 0 ? taskCounts.notes : null
    },
    {
      id: 'team' as ViewMode,
      label: '팀원 관리 & 워크스페이스',
      icon: Users,
      badge: taskCounts.members ? `${taskCounts.members}명` : '공유 중'
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Main Navigation links */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            메뉴
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobileMenu();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : isActive
                        ? 'bg-blue-200/70 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tag Classification & Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              태그 분류
            </p>
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                필터 해제
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1 px-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => onSelectTag(null)}
              className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors border ${
                selectedTag === null
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              전체
            </button>
            {tags.map(tag => {
              const isSelected = selectedTag === tag.name;
              return (
                <button
                  key={tag.id}
                  onClick={() => onSelectTag(isSelected ? null : tag.name)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md font-medium transition-colors border ${
                    isSelected
                      ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 font-semibold'
                      : ''
                  } ${getTagColorClass(tag.color)}`}
                >
                  <TagIcon className="w-2.5 h-2.5 opacity-70" />
                  <span>#{tag.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info: Storage, Share, Offline Mode */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              오프라인 & 로컬 저장
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              활성화됨
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            네트워크 연결 끊김 시에도 브라우저에 안전하게 보관됩니다.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onOpenBackup}
              className="flex-1 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium"
            >
              백업 / 복원
            </button>
            <button
              onClick={onOpenShareModal}
              className="px-2 py-1 flex items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded text-[11px] font-medium"
              title="공유 링크"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-60 lg:w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (When hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-4 shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                네비게이션 & 필터
              </span>
              <button
                onClick={onCloseMobileMenu}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 py-1.5 px-2 flex justify-around items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.badgeVariant === 'warning' && taskCounts.dueSoon > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <span>{item.id === 'team' ? '팀원 관리' : item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
