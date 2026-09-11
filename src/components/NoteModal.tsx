import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  X,
  BookOpen,
  Pin,
  Tag as TagIcon,
  CheckSquare,
  Eye,
  Edit3,
  Check
} from 'lucide-react';
import { KnowledgeNote, Tag, Task } from '../types';
import { getTagColorClass } from '../utils/colors';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: KnowledgeNote;
  onSave: (note: KnowledgeNote) => void;
  tags: Tag[];
  onAddTag: (tagName: string) => void;
  tasks: Task[];
}

export default function NoteModal({
  isOpen,
  onClose,
  note,
  onSave,
  tags,
  onAddTag,
  tasks
}: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('업무');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category || '업무');
      setSelectedTags(note.tags || []);
      setIsPinned(note.isPinned || false);
      setLinkedTaskIds(note.linkedTaskIds || []);
    } else {
      setTitle('');
      setContent('# 새 지식 노트\n\n핵심 지식, 회고, 아키텍처 또는 아이디어를 작성하세요.\n\n## 1. 개요\n- 내용 1\n- 내용 2\n');
      setCategory('업무');
      setSelectedTags(['프로젝트']);
      setIsPinned(false);
      setLinkedTaskIds([]);
    }
    setPreviewMode(false);
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const noteData: KnowledgeNote = {
      id: note?.id || `note-${Date.now()}`,
      title: title.trim(),
      content,
      category,
      tags: selectedTags,
      isPinned,
      linkedTaskIds,
      author: note?.author || '김민준 (나)',
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: note?.comments || []
    };

    onSave(noteData);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
              {note ? '지식 노트 편집' : '새 지식 노트 작성'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title and Pin */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="지식 노트 제목을 입력하세요"
              className="flex-1 px-3.5 py-2 text-sm md:text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                isPinned
                  ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Pin className="w-4 h-4" />
              <span className="hidden sm:inline">{isPinned ? '고정됨' : '상단 고정'}</span>
            </button>
          </div>

          {/* Category & Linked Tasks */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                카테고리
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="예: 업무, 개발, 기획, 학습"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                연결할 할 일
              </label>
              <select
                value={linkedTaskIds[0] || ''}
                onChange={e => setLinkedTaskIds(e.target.value ? [e.target.value] : [])}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">(연결된 할 일 없음)</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                분류 태그
              </label>
              <span className="text-[11px] text-slate-400">
                선택됨: <strong className="text-indigo-600 dark:text-indigo-400">{selectedTags.length}개</strong>
              </span>
            </div>
            
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
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.5]" />}
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={handleAddNewTag}
                placeholder="새 태그 이름 입력 후 Enter (예: 회고)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

          {/* Content Editor & Preview Header */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                지식 본문 (마크다운)
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded ${
                    !previewMode
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>편집기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded ${
                    previewMode
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>미리보기</span>
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="prose dark:prose-invert max-w-none text-xs md:text-sm p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[200px] max-h-[350px] overflow-y-auto">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                rows={12}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="마크다운 형식으로 지식을 정리하세요."
                className="w-full p-3 font-mono text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            )}
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
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
            >
              {note ? '변경사항 저장' : '지식 노트 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
