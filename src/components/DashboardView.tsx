import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Plus
} from 'lucide-react';
import { Task, KnowledgeNote, Tag, ViewMode, Priority } from '../types';
import { priorityConfig, getDeadlineInfo, getTagColorClass } from '../utils/colors';

interface DashboardViewProps {
  tasks: Task[];
  notes: KnowledgeNote[];
  tags: Tag[];
  onToggleTaskComplete: (taskId: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenNoteModal: (note?: KnowledgeNote) => void;
  onNavigate: (view: ViewMode) => void;
  onSelectTag: (tag: string) => void;
  onQuickCapture: (text: string, type: 'task' | 'note') => void;
  selectedTag: string | null;
}

export default function DashboardView({
  tasks,
  notes,
  tags,
  onToggleTaskComplete,
  onOpenTaskModal,
  onOpenNoteModal,
  onNavigate,
  onSelectTag,
  onQuickCapture,
  selectedTag
}: DashboardViewProps) {
  const [quickInput, setQuickInput] = useState('');
  const [quickType, setQuickType] = useState<'task' | 'note'>('task');

  // Filter tasks and notes by selected tag if set
  const filteredTasks = selectedTag
    ? tasks.filter(t => t.tags.includes(selectedTag))
    : tasks;

  const filteredNotes = selectedTag
    ? notes.filter(n => n.tags.includes(selectedTag))
    : notes;

  // Key metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue and Due soon calculations
  const now = Date.now();
  const overdueTasks = filteredTasks.filter(t => {
    if (t.status === 'completed') return false;
    return new Date(t.dueDate).getTime() < now;
  });

  const dueTodayTasks = filteredTasks.filter(t => {
    if (t.status === 'completed') return false;
    const diff = new Date(t.dueDate).getTime() - now;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24;
  });

  // Tasks ordered by due date
  const upcomingTasks = [...filteredTasks]
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Recent notes
  const recentNotes = [...filteredNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  // Priority counts
  const priorityBreakdown: Record<Priority, number> = {
    critical: filteredTasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length,
    high: filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    medium: filteredTasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length,
    low: filteredTasks.filter(t => t.priority === 'low' && t.status !== 'completed').length,
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickCapture(quickInput.trim(), quickType);
    setQuickInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Tag filter reminder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            종합 대시보드
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            지식 노트와 주요 마감 일정을 한눈에 파악하고 즉시 조치하세요.
          </p>
        </div>

        {selectedTag && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              선택된 태그: <strong>#{selectedTag}</strong>
            </span>
            <button
              onClick={() => onSelectTag('')}
              className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-200 font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Quick Capture Widget */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setQuickType('task')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                quickType === 'task'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              할 일 추가
            </button>
            <button
              type="button"
              onClick={() => setQuickType('note')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                quickType === 'note'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              지식 메모
            </button>
          </div>

          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              placeholder={
                quickType === 'task'
                  ? '새로운 할 일 입력 (예: 서버 배포 점검 #개발 #긴급)'
                  : '새로운 지식이나 메모 입력 (예: React 최적화 메모 #학습)'
              }
              className="w-full pl-3 pr-20 py-1.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-md text-xs font-medium disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today / Urgent */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              오늘 마감 & 기한 초과
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {dueTodayTasks.length + overdueTasks.length}
            </span>
            {overdueTasks.length > 0 && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                (지연 {overdueTasks.length}건)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>오늘 예정: {dueTodayTasks.length}건</span>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              캘린더 보기
            </button>
          </div>
        </div>

        {/* Metric 2: In Progress Tasks */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              진행 중인 작업
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {inProgressTasks}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / 총 {totalTasks}건
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>대기 중: {totalTasks - completedTasks - inProgressTasks}건</span>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              목록 보기
            </button>
          </div>
        </div>

        {/* Metric 3: Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              할 일 완료율
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {completionRate}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {completedTasks}건 완료
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Knowledge Notes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              지식 노트 (위키)
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredNotes.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">개 보관 중</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>고정 노트: {filteredNotes.filter(n => n.isPinned).length}개</span>
            <button
              onClick={() => onNavigate('knowledge')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              보관함 열기
            </button>
          </div>
        </div>
      </div>

      {/* Urgent & Overdue Alert Box (if any) */}
      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-sm font-bold text-rose-900 dark:text-rose-200">
              즉각적인 확인이 필요한 마감 일정 ({overdueTasks.length + dueTodayTasks.length}건)
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {[...overdueTasks, ...dueTodayTasks].slice(0, 4).map(task => {
              const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200/80 dark:border-rose-900/40 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                      title="완료 처리"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <p
                        onClick={() => onOpenTaskModal(task)}
                        className="font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline"
                      >
                        {task.title}
                      </p>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${deadline.badgeClass}`}>
                        {deadline.text}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenTaskModal(task)}
                    className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium hover:bg-slate-200 shrink-0"
                  >
                    상세
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 2-column layout: Upcoming Schedule & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Upcoming Schedule & Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                마감일 순 주요 할 일
              </h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
            {upcomingTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                예정된 할 일이 없습니다. 새로운 할 일을 추가해보세요!
              </div>
            ) : (
              upcomingTasks.map(task => {
                const priority = priorityConfig[task.priority];
                const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
                return (
                  <div
                    key={task.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTaskComplete(task.id)}
                        className="p-1 text-slate-300 hover:text-emerald-600 rounded transition-colors"
                        title="완료 체크"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onOpenTaskModal(task)}
                            className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline"
                          >
                            {task.title}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${priority.badgeClass}`}>
                            {priority.label.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${deadline.badgeClass}`}>
                            {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} • {deadline.text}
                          </span>
                          {task.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              onClick={() => onSelectTag(tag)}
                              className="text-[10px] text-slate-500 hover:text-blue-600 dark:text-slate-400 cursor-pointer"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenTaskModal(task)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium shrink-0"
                    >
                      편집
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 col: Priority Distribution & Quick Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              우선순위 분포
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            {(['critical', 'high', 'medium', 'low'] as Priority[]).map(p => {
              const cfg = priorityConfig[p];
              const count = priorityBreakdown[p];
              return (
                <div key={p} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cfg.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {count}건
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Tag Cloud */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              주요 분류 태그
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => onSelectTag(tag.name)}
                  className={`px-2 py-1 text-[11px] rounded-md border font-medium transition-all ${getTagColorClass(
                    tag.color
                  )}`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Recent Knowledge Notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              최근 지식 노트 & 위키
            </h3>
          </div>
          <button
            onClick={() => onNavigate('knowledge')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            지식 보관함 전체 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {recentNotes.map(note => (
            <div
              key={note.id}
              onClick={() => onOpenNoteModal(note)}
              className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    {note.category}
                  </span>
                  {note.isPinned && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      ★ 고정
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                  {note.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {note.content.replace(/[#*`]/g, '')}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>{new Date(note.updatedAt).toLocaleDateString('ko-KR')}</span>
                <span className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                  {note.author}
                </span>
              </div>
            </div>
          ))}

          {/* New note card button */}
          <button
            onClick={() => onOpenNoteModal()}
            className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors gap-1.5 min-h-[120px]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-semibold">새 지식 노트 작성</span>
          </button>
        </div>
      </div>
    </div>
  );
}
