import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Tag as TagIcon,
  Edit3,
  Eye,
  Trash2,
  Copy,
  Download,
  CheckSquare,
  MessageSquare,
  Calendar,
  Send,
  User,
  Share2
} from 'lucide-react';
import { KnowledgeNote, Task, Tag, TeamMember } from '../types';
import { getTagColorClass } from '../utils/colors';

interface KnowledgeViewProps {
  notes: KnowledgeNote[];
  tasks: Task[];
  tags: Tag[];
  teamMembers: TeamMember[];
  onOpenNoteModal: (note?: KnowledgeNote) => void;
  onSaveNote: (note: KnowledgeNote) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  activeNoteId?: string;
}

export default function KnowledgeView({
  notes,
  tasks,
  tags,
  teamMembers,
  onOpenNoteModal,
  onSaveNote,
  onDeleteNote,
  onOpenTaskModal,
  selectedTag,
  onSelectTag,
  activeNoteId
}: KnowledgeViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    activeNoteId || (notes.length > 0 ? notes[0].id : '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTag = note.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTag) return false;
    }

    if (selectedTag && !note.tags.includes(selectedTag)) {
      return false;
    }

    return true;
  });

  // Sort notes (pinned first, then recent updatedAt)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId) || sortedNotes[0];

  const startEdit = (note: KnowledgeNote) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditTags(note.tags);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNote) return;
    const updated: KnowledgeNote = {
      ...selectedNote,
      title: editTitle.trim() || '제목 없는 노트',
      content: editContent,
      category: editCategory || '일반',
      tags: editTags,
      updatedAt: new Date().toISOString()
    };
    onSaveNote(updated);
    setIsEditing(false);
  };

  const handleTogglePin = (note: KnowledgeNote) => {
    onSaveNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString()
    });
  };

  const handleCopyMarkdown = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!selectedNote) return;
    const blob = new Blob([`${selectedNote.title}\n\n${selectedNote.content}`], {
      type: 'text/markdown;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedNote.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedNote) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: 'user-1',
      authorName: '김민준 (나)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      content: commentInput.trim(),
      createdAt: new Date().toISOString()
    };

    onSaveNote({
      ...selectedNote,
      comments: [...(selectedNote.comments || []), newComment],
      updatedAt: new Date().toISOString()
    });

    setCommentInput('');
  };

  // Find linked tasks
  const linkedTasks = selectedNote
    ? tasks.filter(t => selectedNote.linkedTaskIds?.includes(t.id) || t.linkedNoteIds?.includes(selectedNote.id))
    : [];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            개인 지식 보관함 (위키)
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            마크다운 기반의 지식 정리, 태그 분류, 그리고 관련 할 일과의 연계 기능을 제공합니다.
          </p>
        </div>

        <button
          onClick={() => onOpenNoteModal()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 지식 노트</span>
        </button>
      </div>

      {/* 2-Column Split: Note Navigator & Reading/Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        {/* Left Column: Note List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col h-[650px] shadow-xs">
          {/* Search bar */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="지식 노트 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Active Tag filter indicator */}
          {selectedTag && (
            <div className="flex items-center justify-between px-2 py-1 mb-2 bg-blue-50 dark:bg-blue-950/60 rounded text-[11px] text-blue-700 dark:text-blue-300">
              <span>태그: #{selectedTag}</span>
              <button onClick={() => onSelectTag(null)} className="font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
            {sortedNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                작성된 지식 노트가 없습니다.
              </div>
            ) : (
              sortedNotes.map(note => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-3 border-indigo-600 dark:border-indigo-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        {note.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {note.isPinned && (
                          <span className="text-[10px] text-amber-500 font-bold">★ 고정</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.updatedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <h4
                      className={`text-xs md:text-sm font-semibold truncate ${
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {note.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {note.content.replace(/[#*`]/g, '')}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Reader & Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-[650px] shadow-xs overflow-y-auto">
          {selectedNote ? (
            <div className="space-y-4">
              {/* Note Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold">
                    {isEditing ? editCategory : selectedNote.category}
                  </span>
                  <button
                    onClick={() => handleTogglePin(selectedNote)}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                      selectedNote.isPinned
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={selectedNote.isPinned ? '고정 해제' : '상단 고정'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">
                      {selectedNote.isPinned ? '고정됨' : '고정'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyMarkdown}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
                    title="마크다운 복사"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{copied ? '복사됨!' : '복사'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
                    title=".md 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px]">.md 저장</span>
                  </button>

                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      저장 완료
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(selectedNote)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      편집
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteNote(selectedNote.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="노트 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Metadata */}
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="노트 제목 입력"
                    className="w-full text-lg md:text-xl font-bold p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      placeholder="카테고리 (예: 업무, 학습)"
                      className="text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedNote.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>작성자: {selectedNote.author}</span>
                    <span>•</span>
                    <span>
                      수정일: {new Date(selectedNote.updatedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(isEditing ? editTags : selectedNote.tags).map(tag => (
                  <span
                    key={tag}
                    onClick={() => onSelectTag(tag)}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 rounded text-xs font-medium cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Content / Markdown Editor */}
              {isEditing ? (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">
                    마크다운 본문 (제목, 리스트, 코드블록 지원)
                  </span>
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full font-mono text-xs md:text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed py-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                </div>
              )}

              {/* Linked Tasks Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    이 지식과 연결된 할 일 ({linkedTasks.length})
                  </h4>
                  <button
                    onClick={() => onOpenTaskModal()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 연계 할 일 등록
                  </button>
                </div>

                {linkedTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    연결된 할 일이 없습니다. 작업 계획이 필요하면 연계 할 일을 등록하세요.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {linkedTasks.map(lt => (
                      <div
                        key={lt.id}
                        onClick={() => onOpenTaskModal(lt)}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs cursor-pointer hover:border-blue-400"
                      >
                        <div className="min-w-0 pr-2">
                          <span
                            className={`font-semibold block truncate ${
                              lt.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {lt.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            마감: {new Date(lt.dueDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                          {lt.status === 'completed' ? '완료' : '진행'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Comments / Discussion thread */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  팀 협업 코멘트 ({selectedNote.comments?.length || 0})
                </h4>

                <div className="space-y-2">
                  {selectedNote.comments?.map(comm => (
                    <div
                      key={comm.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={comm.authorAvatar}
                            alt={comm.authorName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {comm.authorName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comm.createdAt).toLocaleString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 pl-5 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="노트에 대한 의견이나 피드백을 남기세요..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-indigo-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400">
              노트를 선택하거나 새 지식 노트를 작성하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
