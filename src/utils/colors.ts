import { Priority } from '../types';

export const priorityConfig: Record<
  Priority,
  { label: string; badgeClass: string; borderClass: string; dotClass: string; textClass: string; bgClass: string }
> = {
  critical: {
    label: '긴급 (P1)',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    borderClass: 'border-l-rose-500',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500',
  },
  high: {
    label: '높음 (P2)',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    borderClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500',
  },
  medium: {
    label: '보통 (P3)',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    borderClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500',
  },
  low: {
    label: '낮음 (P4)',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
    borderClass: 'border-l-slate-400',
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-400',
  },
};

export const tagColorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  pink: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800',
  teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
};

export function getTagColorClass(colorName?: string): string {
  if (!colorName || !tagColorMap[colorName]) {
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
  return tagColorMap[colorName];
}

// Format relative deadline status
export function getDeadlineInfo(dueDateString: string, isCompleted = false) {
  if (isCompleted) {
    return {
      text: '완료됨',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      isOverdue: false,
      isDueSoon: false
    };
  }

  const due = new Date(dueDateString).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 0) {
    const overdueDays = Math.abs(Math.floor(diffHours / 24));
    return {
      text: overdueDays === 0 ? '기한 지남 (오늘)' : `${overdueDays}일 초과`,
      badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-semibold',
      isOverdue: true,
      isDueSoon: false
    };
  }

  if (diffHours <= 12) {
    const hours = Math.max(1, Math.round(diffHours));
    return {
      text: `${hours}시간 남음`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold animate-pulse',
      isOverdue: false,
      isDueSoon: true
    };
  }

  if (diffDays <= 1) {
    return {
      text: '오늘 마감',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      isOverdue: false,
      isDueSoon: true
    };
  }

  if (diffDays === 2) {
    return {
      text: '내일 마감',
      badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
      isOverdue: false,
      isDueSoon: false
    };
  }

  return {
    text: `D-${diffDays}`,
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    isOverdue: false,
    isDueSoon: false
  };
}
