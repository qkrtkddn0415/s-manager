import { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  MessageSquare,
  BookOpen,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  User,
  ChevronRight
} from 'lucide-react';
import { Task, Priority, TaskStatus, Tag, TeamMember } from '../types';
import { priorityConfig, getDeadlineInfo, getTagColorClass } from '../utils/colors';

interface TasksViewProps {
  tasks: Task[];
  tags: Tag[];
  teamMembers: TeamMember[];
  onToggleTaskComplete: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenNoteModalById?: (noteId: string) => void;
}

export default function TasksView({
  tasks,
  tags,
  teamMembers,
  onToggleTaskComplete,
  onUpdateTaskStatus,
  onDeleteTask,
  onOpenTaskModal,
  selectedTag,
  onSelectTag,
  onOpenNoteModalById
}: TasksViewProps) {
  const [viewStyle, setViewStyle] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'due' | 'priority' | 'created'>('due');

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.85 }
    });
  };

  const handleCheckboxClick = (task: Task) => {
    if (task.status !== 'completed') {
      triggerConfetti();
    }
    onToggleTaskComplete(task.id);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchTag = task.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    // Selected Tag from global filter
    if (selectedTag && !task.tags.includes(selectedTag)) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'due') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'priority') {
      const weight: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Columns for Kanban
  const kanbanColumns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: '대기 중 (To-Do)', color: 'border-slate-300 dark:border-slate-700' },
    { id: 'in_progress', title: '진행 중 (In Progress)', color: 'border-blue-400 dark:border-blue-700' },
    { id: 'completed', title: '완료됨 (Done)', color: 'border-emerald-400 dark:border-emerald-700' }
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            할 일 & 일정 관리
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            우선순위, 마감일, 태그별로 분류하고 칸반 보드로 시각화하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewStyle('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewStyle === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>목록</span>
            </button>
            <button
              onClick={() => setViewStyle('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewStyle === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>칸반 보드</span>
            </button>
          </div>

          <button
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>할 일 추가</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="할 일 제목, 설명, 태그로 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">우선순위:</span>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">전체 우선순위</option>
                <option value="critical">긴급 (P1)</option>
                <option value="high">높음 (P2)</option>
                <option value="medium">보통 (P3)</option>
                <option value="low">낮음 (P4)</option>
              </select>
            </div>

            {/* Status Filter (in list view) */}
            {viewStyle === 'list' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">상태:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">전체 상태</option>
                  <option value="todo">대기 중</option>
                  <option value="in_progress">진행 중</option>
                  <option value="completed">완료</option>
                </select>
              </div>
            )}

            {/* Sort order */}
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="due">마감일 순</option>
                <option value="priority">우선순위 순</option>
                <option value="created">최신 등록순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Tag Filter indicator */}
        {selectedTag && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">태그 필터:</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold flex items-center gap-1">
              #{selectedTag}
              <button
                onClick={() => onSelectTag(null)}
                className="ml-1 text-blue-500 hover:text-blue-800"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {/* VIEW: LIST MODE */}
      {viewStyle === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
          {sortedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              조건에 맞는 할 일이 없습니다. 새 할 일을 생성하거나 필터를 변경해보세요.
            </div>
          ) : (
            sortedTasks.map(task => {
              const priority = priorityConfig[task.priority];
              const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
              const assignee = teamMembers.find(m => m.id === task.assigneeId);
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors border-l-4 ${priority.borderClass} ${
                    isCompleted ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/40' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheckboxClick(task)}
                      className={`mt-0.5 sm:mt-0 p-1 rounded-md transition-colors ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                          : 'text-slate-300 dark:text-slate-600 hover:text-emerald-600'
                      }`}
                      title={isCompleted ? '미완료로 변경' : '완료로 표시'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          onClick={() => onOpenTaskModal(task)}
                          className={`text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:underline ${
                            isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${priority.badgeClass}`}>
                          {priority.label}
                        </span>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${deadline.badgeClass}`}>
                          <Clock className="w-2.5 h-2.5 inline mr-1" />
                          {deadline.text}
                        </span>
                      </div>

                      {/* Details row: Tags, linked notes, assignee */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] text-slate-400">
                          {new Date(task.dueDate).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {task.tags.map(tag => (
                          <span
                            key={tag}
                            onClick={() => onSelectTag(tag)}
                            className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-400 rounded text-[10px] cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}

                        {task.linkedNoteIds && task.linkedNoteIds.length > 0 && (
                          <span
                            onClick={() => onOpenNoteModalById && onOpenNoteModalById(task.linkedNoteIds[0])}
                            className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded"
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            연결 지식 ({task.linkedNoteIds.length})
                          </span>
                        )}

                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {task.comments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Assignee */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {assignee && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mr-2" title={assignee.name}>
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="hidden lg:inline text-[11px]">{assignee.name.split(' ')[0]}</span>
                      </div>
                    )}

                    <select
                      value={task.status}
                      onChange={e => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
                    >
                      <option value="todo">대기</option>
                      <option value="in_progress">진행 중</option>
                      <option value="completed">완료</option>
                    </select>

                    <button
                      onClick={() => onOpenTaskModal(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: KANBAN BOARD MODE */}
      {viewStyle === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map(column => {
            const colTasks = sortedTasks.filter(t => t.status === column.id);
            return (
              <div
                key={column.id}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">
                      {column.title}
                    </h3>
                    <span className="px-1.5 py-0.2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-bold shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenTaskModal()}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="이 상태로 할 일 추가"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Task Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                      작업 없음
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const priority = priorityConfig[task.priority];
                      const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
                      const assignee = teamMembers.find(m => m.id === task.assigneeId);

                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700/70 shadow-2xs space-y-2 hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${priority.badgeClass}`}>
                              {priority.label.split(' ')[0]}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] ${deadline.badgeClass}`}>
                              {deadline.text}
                            </span>
                          </div>

                          <h4
                            onClick={() => onOpenTaskModal(task)}
                            className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:underline leading-snug"
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description.replace(/[#*`]/g, '')}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {task.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Footer: Assignee & Column Mover */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              {assignee ? (
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                  title={assignee.name}
                                />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Quick status shift */}
                            <div className="flex items-center gap-1">
                              {column.id !== 'todo' && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, 'todo')}
                                  className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200"
                                  title="대기 중으로 이동"
                                >
                                  대기
                                </button>
                              )}
                              {column.id !== 'in_progress' && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                                  className="px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100"
                                  title="진행 중으로 이동"
                                >
                                  진행
                                </button>
                              )}
                              {column.id !== 'completed' && (
                                <button
                                  onClick={() => {
                                    triggerConfetti();
                                    onUpdateTaskStatus(task.id, 'completed');
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded hover:bg-emerald-100"
                                  title="완료 처리"
                                >
                                  완료
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
