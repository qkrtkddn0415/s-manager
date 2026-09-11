import { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  CheckSquare,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Task, KnowledgeNote } from '../types';
import { priorityConfig, getDeadlineInfo } from '../utils/colors';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: KnowledgeNote[];
  onSelectTask: (task: Task) => void;
  onSelectNote: (note: KnowledgeNote) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  tasks,
  notes,
  onSelectTask,
  onSelectNote
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'notes'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard escape handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedTasks = tasks.filter(t => {
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const matchedNotes = notes.filter(n => {
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(tag => tag.toLowerCase().includes(q)) ||
      n.category.toLowerCase().includes(q)
    );
  });

  const totalMatches = (typeFilter === 'notes' ? 0 : matchedTasks.length) + (typeFilter === 'tasks' ? 0 : matchedNotes.length);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="지식 노트 본문, 할 일 제목, #태그 검색... (ESC로 닫기)"
            className="w-full bg-transparent text-sm md:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 px-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">유형:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            전체 ({matchedTasks.length + matchedNotes.length})
          </button>
          <button
            onClick={() => setTypeFilter('tasks')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              typeFilter === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            할 일만 ({matchedTasks.length})
          </button>
          <button
            onClick={() => setTypeFilter('notes')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              typeFilter === 'notes'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            지식 노트만 ({matchedNotes.length})
          </button>
        </div>

        {/* Search Results list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {totalMatches === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-50" />
              검색어와 일치하는 지식 노트 또는 할 일이 없습니다.
            </div>
          ) : (
            <>
              {/* Tasks Results */}
              {typeFilter !== 'notes' && matchedTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    할 일 & 일정 ({matchedTasks.length})
                  </div>

                  <div className="space-y-1.5">
                    {matchedTasks.slice(0, 5).map(task => {
                      const priority = priorityConfig[task.priority];
                      const deadline = getDeadlineInfo(task.dueDate, task.status === 'completed');
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            onSelectTask(task);
                            onClose();
                          }}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 cursor-pointer flex items-center justify-between text-xs transition-all"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {task.title}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${priority.badgeClass}`}>
                                {priority.label.split(' ')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span>마감: {deadline.text}</span>
                              {task.tags.map(t => (
                                <span key={t}>#{t}</span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Results */}
              {typeFilter !== 'tasks' && matchedNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    지식 노트 & 위키 ({matchedNotes.length})
                  </div>

                  <div className="space-y-1.5">
                    {matchedNotes.slice(0, 5).map(note => (
                      <div
                        key={note.id}
                        onClick={() => {
                          onSelectNote(note);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 cursor-pointer flex items-center justify-between text-xs transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {note.title}
                            </span>
                            <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-semibold">
                              {note.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            {note.content.replace(/[#*`]/g, '')}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            단축키 <strong>ESC</strong>로 닫기
          </span>
          <span>선택하여 바로 상세 화면으로 이동</span>
        </div>
      </div>
    </div>
  );
}
