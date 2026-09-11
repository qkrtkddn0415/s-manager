import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag as TagIcon,
  User,
  BookOpen,
  AlertCircle,
  MessageSquare,
  Send,
  Plus,
  Check
} from 'lucide-react';
import { Task, Priority, TaskStatus, Tag, TeamMember, KnowledgeNote, Comment } from '../types';
import { priorityConfig, getTagColorClass } from '../utils/colors';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSave: (task: Task) => void;
  tags: Tag[];
  onAddTag: (tagName: string) => void;
  teamMembers: TeamMember[];
  notes: KnowledgeNote[];
  defaultDueDate?: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  onSave,
  tags,
  onAddTag,
  teamMembers,
  notes,
  defaultDueDate
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [category, setCategory] = useState('업무');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [assigneeId, setAssigneeId] = useState('user-1');
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [linkedNoteIds, setLinkedNoteIds] = useState<string[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      // Format to datetime-local input "YYYY-MM-DDTHH:mm"
      const d = new Date(task.dueDate);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDueDate(localIso);
      setPriority(task.priority);
      setStatus(task.status);
      setCategory(task.category || '업무');
      setSelectedTags(task.tags || []);
      setAssigneeId(task.assigneeId || 'user-1');
      setReminderMinutes(task.reminderMinutesBefore || 60);
      setLinkedNoteIds(task.linkedNoteIds || []);
      setCommentsList(task.comments || []);
    } else {
      setTitle('');
      setDescription('');
      const baseDate = defaultDueDate ? new Date(defaultDueDate) : new Date(Date.now() + 1000 * 60 * 60 * 6);
      const localIso = new Date(baseDate.getTime() - baseDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDueDate(localIso);
      setPriority('medium');
      setStatus('todo');
      setCategory('업무');
      setSelectedTags(['프로젝트']);
      setAssigneeId('user-1');
      setReminderMinutes(60);
      setLinkedNoteIds([]);
      setCommentsList([]);
    }
  }, [task, defaultDueDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: title.trim(),
      description,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status,
      category,
      tags: selectedTags,
      assigneeId,
      reminderMinutesBefore: reminderMinutes,
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedNoteIds,
      comments: commentsList
    };

    onSave(taskData);
    onClose();
  };

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleAddNewTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = newTagInput.trim().replace(/^#/, '');
    if (!val) return;
    onAddTag(val);
    if (!selectedTags.includes(val)) {
      setSelectedTags([...selectedTags, val]);
    }
    setNewTagInput('');
  };

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentItem: Comment = {
      id: `c-${Date.now()}`,
      authorId: 'user-1',
      authorName: '김민준 (나)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const nextComments = [...commentsList, newCommentItem];
    setCommentsList(nextComments);
    setNewComment('');

    // If already an existing saved task, persist comment immediately
    if (task) {
      const updatedTask: Task = {
        ...task,
        comments: nextComments,
        updatedAt: new Date().toISOString()
      };
      onSave(updatedTask);
    }
  };

  // Quick preset dates
  const setQuickDate = (hoursFromNow: number) => {
    const target = new Date(Date.now() + 1000 * 60 * 60 * hoursFromNow);
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDueDate(localIso);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
            {task ? '할 일 & 일정 수정' : '새로운 할 일 / 일정 등록'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              할 일 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 클라우드 인프라 설계서 검토 및 승인"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Priority selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              우선순위 지정
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['critical', 'high', 'medium', 'low'] as Priority[]).map(p => {
                const cfg = priorityConfig[p];
                const isSelected = priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? `ring-2 ring-blue-500 ${cfg.badgeClass}`
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time & Quick chips */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                마감일시
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDate(4)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-400 rounded"
                >
                  오늘(+4h)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(24)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-400 rounded"
                >
                  내일
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(72)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-400 rounded"
                >
                  3일 뒤
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(168)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-400 rounded"
                >
                  1주일 뒤
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                마감 알림 설정
              </label>
              <select
                value={reminderMinutes}
                onChange={e => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value={15}>15분 전 알림</option>
                <option value={30}>30분 전 알림</option>
                <option value={60}>1시간 전 알림</option>
                <option value={120}>2시간 전 알림</option>
                <option value={1440}>1일(24시간) 전 알림</option>
                <option value={0}>알림 끄기</option>
              </select>
            </div>
          </div>

          {/* Status & Category */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                진행 상태
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="todo">대기 중 (To-Do)</option>
                <option value="in_progress">진행 중 (In Progress)</option>
                <option value="completed">완료 (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                카테고리 분류
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="예: 업무, 개발, 기획, 학습, 개인"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                태그 분류
              </label>
              <span className="text-[11px] text-slate-400">
                선택됨: <strong className="text-blue-600 dark:text-blue-400">{selectedTags.length}개</strong>
              </span>
            </div>
            
            {/* Tag Selection Chips Container with proper inner padding to prevent border clipping */}
            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 max-h-32 overflow-y-auto mb-2.5 flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />}
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Add new custom tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={handleAddNewTag}
                placeholder="새 태그 이름 입력 후 Enter (예: 긴급배포)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                태그 추가
              </button>
            </div>
          </div>

          {/* Assignee & Linked Knowledge Notes */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                담당 팀원 배정
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                연결할 지식 노트 (위키)
              </label>
              <select
                value={linkedNoteIds[0] || ''}
                onChange={e => setLinkedNoteIds(e.target.value ? [e.target.value] : [])}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">(연결된 지식 없음)</option>
                {notes.map(note => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              상세 설명 및 체크리스트 (마크다운 지원)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="상세 내용 및 세부 체크리스트를 적어주세요.&#10;- [ ] 항목 1&#10;- [ ] 항목 2"
              className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Comments Section (Real-time live reflected) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                팀 댓글 & 업무 메모 ({commentsList.length}건)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">등록 즉시 실시간 반영</span>
            </div>

            {commentsList.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50/70 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
                {commentsList.map(c => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-lg text-xs space-y-1 border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                          {c.authorName.slice(0, 1)}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{c.authorName}</span>
                      </div>
                      <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 pl-6 text-xs whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="팀원들과 공유할 댓글이나 진행상황을 입력하세요..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddComment()}
                disabled={!newComment.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>댓글 등록</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {task ? '변경사항 저장' : '할 일 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
