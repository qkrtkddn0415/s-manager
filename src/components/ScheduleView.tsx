import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { Task } from '../types';
import { priorityConfig, getDeadlineInfo } from '../utils/colors';
import { getHolidayInfo } from '../utils/holidays';

interface ScheduleViewProps {
  tasks: Task[];
  onOpenTaskModal: (task?: Task, defaultDueDate?: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
}

export default function ScheduleView({
  tasks,
  onOpenTaskModal,
  onToggleTaskComplete
}: ScheduleViewProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  // Group tasks by date string "YYYY-MM-DD"
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const d = new Date(task.dueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(
    selectedDate.getDate()
  ).padStart(2, '0')}`;

  const selectedDayTasks = tasksByDate[selectedKey] || [];

  // Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    return new Date(t.dueDate).getTime() < Date.now();
  });

  const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // Calendar cells
  const calendarCells = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    calendarCells.push({
      date: new Date(year, month - 1, dayNum),
      isCurrentMonth: false,
      dayNum
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarCells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
      dayNum: i
    });
  }

  // Next month padding to fill 35 or 42 grid
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
      dayNum: i
    });
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            일정 & 마감 캘린더
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            월별 캘린더에서 마감 일정을 확인하고 날짜를 클릭하여 일정을 관리하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            오늘
          </button>
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[90px] text-center">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenTaskModal(undefined, selectedDate.toISOString())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">선택일 일정 추가</span>
          </button>
        </div>
      </div>

      {/* Calendar Legend for Holidays & Rest Days */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          공휴일 · 일요일 (빨간날/쉬는날)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          토요일 (주말 휴일)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          오늘
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            {weekDayLabels.map((w, idx) => (
              <span
                key={w}
                className={`text-xs font-bold ${
                  idx === 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : idx === 6
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const cellKey = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(
                2,
                '0'
              )}-${String(cell.date.getDate()).padStart(2, '0')}`;
              const dayTasks = tasksByDate[cellKey] || [];
              const isSelected = isSameDay(cell.date, selectedDate);
              const isCellToday = isSameDay(cell.date, today);
              const holiday = getHolidayInfo(cell.date);
              const isSunday = cell.date.getDay() === 0;
              const isSaturday = cell.date.getDay() === 6;
              const isRedDay = isSunday || holiday.isHoliday;
              const isBlueDay = isSaturday && !holiday.isHoliday;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[88px] md:min-h-[100px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-50/60 dark:bg-blue-950/40 border-blue-400'
                      : isCellToday
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                      : holiday.isHoliday
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                      : cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-transparent text-slate-300 dark:text-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isCellToday
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? isRedDay
                              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                              : isBlueDay
                              ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                              : 'text-blue-600 dark:text-blue-400 font-extrabold'
                            : isRedDay
                            ? cell.isCurrentMonth
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-rose-300/80 dark:text-rose-700/80'
                            : isBlueDay
                            ? cell.isCurrentMonth
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-blue-300/80 dark:text-blue-700/80'
                            : cell.isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 px-1">
                          {dayTasks.length}건
                        </span>
                      )}
                    </div>

                    {/* Holiday / Rest Day Badge */}
                    {holiday.name && (holiday.isHoliday || holiday.name === '근로자의 날') && (
                      <div className="mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded border block truncate leading-tight ${
                            cell.isCurrentMonth
                              ? 'bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                              : 'bg-rose-50/50 dark:bg-rose-950/40 text-rose-400/70 border-rose-100/50'
                          }`}
                          title={holiday.name}
                        >
                          {holiday.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tasks preview in day cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map(task => {
                      const priority = priorityConfig[task.priority];
                      return (
                        <div
                          key={task.id}
                          className={`px-1 py-0.5 rounded text-[9px] md:text-[10px] truncate font-medium flex items-center gap-1 ${
                            task.status === 'completed'
                              ? 'line-through bg-slate-100 dark:bg-slate-800 text-slate-400'
                              : `${priority.badgeClass}`
                          }`}
                          title={task.title}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dotClass} shrink-0`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-slate-400 block pl-1">
                        +{dayTasks.length - 2}건 더보기
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Day Tasks & Overdue Alerts */}
        <div className="space-y-4">
          {/* Selected day tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            {(() => {
              const selectedHoliday = getHolidayInfo(selectedDate);
              return (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                      <span>
                        {selectedDate.toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}{' '}
                        일정
                      </span>
                      {selectedHoliday.isHoliday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
                          🎌 {selectedHoliday.name}
                        </span>
                      )}
                      {!selectedHoliday.isHoliday && selectedHoliday.isRestDay && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                          🏖️ {selectedHoliday.name}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400">총 {selectedDayTasks.length}개 할 일</span>
                  </div>
                  <button
                    onClick={() => onOpenTaskModal(undefined, selectedDate.toISOString())}
                    className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 rounded-lg hover:bg-blue-100 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    추가
                  </button>
                </div>
              );
            })()}

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {selectedDayTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  이 날짜에 등록된 마감 일정이 없습니다.
                </div>
              ) : (
                selectedDayTasks.map(task => {
                  const priority = priorityConfig[task.priority];
                  const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            className="p-0.5 text-slate-300 hover:text-emerald-600 rounded"
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                task.status === 'completed' ? 'text-emerald-600' : ''
                              }`}
                            />
                          </button>
                          <span
                            onClick={() => onOpenTaskModal(task)}
                            className={`text-xs font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline ${
                              task.status === 'completed' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${priority.badgeClass}`}>
                          {priority.label.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pl-6">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={deadline.badgeClass + ' px-1 rounded text-[10px]'}>
                          {deadline.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overdue alert card */}
          {overdueTasks.length > 0 && (
            <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 p-4">
              <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                기한 초과된 일정 ({overdueTasks.length}건)
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mb-2 leading-relaxed">
                마감일이 지난 할 일들입니다. 일정을 재조정하거나 완료 처리해 주세요.
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {overdueTasks.slice(0, 3).map(ot => (
                  <div
                    key={ot.id}
                    onClick={() => onOpenTaskModal(ot)}
                    className="p-2 bg-white dark:bg-slate-900 rounded border border-rose-200 dark:border-rose-900 text-xs flex items-center justify-between cursor-pointer hover:bg-rose-50/40"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                      {ot.title}
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold shrink-0">
                      {new Date(ot.dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
