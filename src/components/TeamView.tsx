import { useState, useMemo } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Shield,
  UserPlus,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  RefreshCw,
  HelpCircle,
  Eye,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { TeamMember, Task, Workspace } from '../types';
import { generateLiveShareUrl } from '../services/storage';

interface TeamViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  workspace: Workspace;
  onUpdateWorkspace: (updated: Workspace) => void;
  onAddTeamMember: (newMember: Omit<TeamMember, 'id'>) => void;
  onUpdateTeamMember?: (updatedMember: TeamMember) => void;
  onDeleteTeamMember?: (memberId: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  initialSubTab?: 'members' | 'share' | 'matrix';
}

export default function TeamView({
  teamMembers,
  tasks,
  workspace,
  onUpdateWorkspace,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  onOpenTaskModal,
  initialSubTab = 'members'
}: TeamViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'share' | 'matrix'>(initialSubTab);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Form State for new member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  // Compute actual live share URL
  const liveShareUrl = useMemo(() => {
    // If the stored link is already a valid URL matching current host or not the old placeholder
    if (
      workspace.shareLink &&
      !workspace.shareLink.includes('workspace.app') &&
      !workspace.shareLink.includes('example.com') &&
      (workspace.shareLink.startsWith('http://') || workspace.shareLink.startsWith('https://'))
    ) {
      return workspace.shareLink;
    }
    return generateLiveShareUrl(workspace.id || 'ws-main', workspace.accessRole || 'edit');
  }, [workspace.shareLink, workspace.id, workspace.accessRole]);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(liveShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenShareLinkInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(liveShareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleResetToCurrentOrigin = () => {
    const freshUrl = generateLiveShareUrl(workspace.id || 'ws-main', workspace.accessRole || 'edit');
    onUpdateWorkspace({
      ...workspace,
      shareLink: freshUrl
    });
  };

  const handleToggleShare = () => {
    onUpdateWorkspace({
      ...workspace,
      isShared: !workspace.isShared
    });
  };

  const handleAccessRoleChange = (role: 'view' | 'edit') => {
    const updatedUrl = generateLiveShareUrl(workspace.id || 'ws-main', role);
    onUpdateWorkspace({
      ...workspace,
      accessRole: role,
      shareLink: updatedUrl
    });
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    onAddTeamMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMemberName.trim())}`,
      role: newMemberRole,
      status: 'online'
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('editor');
    setShowAddModal(false);
  };

  const handleRoleChange = (member: TeamMember, newRole: 'admin' | 'editor' | 'viewer') => {
    if (onUpdateTeamMember) {
      onUpdateTeamMember({ ...member, role: newRole });
    }
  };

  const handleToggleMemberStatus = (member: TeamMember) => {
    if (onUpdateTeamMember) {
      onUpdateTeamMember({
        ...member,
        status: member.status === 'online' ? 'offline' : 'online'
      });
    }
  };

  const handleConfirmDeleteMember = () => {
    if (memberToDelete && onDeleteTeamMember) {
      onDeleteTeamMember(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  const roleNames = {
    admin: '최고 관리자',
    editor: '편집자 (작성/수정)',
    viewer: '뷰어 (열람 전용)'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              팀원 관리 & 워크스페이스 공유
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            팀원을 추가·배정하고, 실제 접속 가능한 공유 링크를 통해 모바일과 PC에서 동일한 워크스페이스를 함께 사용하세요.
          </p>
        </div>

        {/* Quick action: Add member */}
        <button
          id="btn-add-member-top"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ 신규 팀원 추가하기</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl max-w-fit border border-slate-200/80 dark:border-slate-700/60">
        <button
          id="subtab-members"
          onClick={() => setActiveSubTab('members')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeSubTab === 'members'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>팀원 관리</span>
          <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[11px] font-bold">
            {teamMembers.length}명
          </span>
        </button>

        <button
          id="subtab-share"
          onClick={() => setActiveSubTab('share')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeSubTab === 'share'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>공유 링크 설정</span>
          {workspace.isShared && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="공유 활성화됨" />
          )}
        </button>

        <button
          id="subtab-matrix"
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeSubTab === 'matrix'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>업무 배정 현황</span>
        </button>
      </div>

      {/* SUBTAB 1: 팀원 관리 (Team Member Management) */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          {/* How-to-add Guide Card */}
          {showGuide && (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl relative shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1 pr-6">
                  <h4 className="font-bold text-xs md:text-sm text-blue-900 dark:text-blue-200">
                    신규 팀원을 추가하는 방법
                  </h4>
                  <ol className="text-xs text-blue-800/90 dark:text-blue-300/90 list-decimal list-inside space-y-0.5">
                    <li>
                      우측 상단의 <strong>'+ 신규 팀원 추가하기'</strong> 버튼 또는 아래 <strong>'새 팀원 추가'</strong> 카드를 클릭합니다.
                    </li>
                    <li>
                      팀원의 <strong>이름, 이메일</strong> 및 <strong>역할 권한</strong>(최고 관리자, 편집자, 뷰어)을 설정합니다.
                    </li>
                    <li>
                      <strong>'추가 완료'</strong>를 누르면 즉시 목록에 등록되며, 할 일 작성 시 담당자로 배정할 수 있습니다.
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 text-xs font-semibold p-1"
                  title="가이드 숨기기"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {/* Members Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                등록된 팀원 목록 ({teamMembers.length}명)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                온라인 {teamMembers.filter(m => m.status === 'online').length}명 / 오프라인 {teamMembers.filter(m => m.status === 'offline').length}명
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Existing Members */}
              {teamMembers.map(member => {
                const memberTasks = tasks.filter(t => t.assigneeId === member.id);
                const pendingTasks = memberTasks.filter(t => t.status !== 'completed');
                const isCurrentUser = member.id === 'user-1' || member.name.includes('(나)');

                return (
                  <div
                    key={member.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      {/* Avatar, Status & Name */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                          />
                          <button
                            onClick={() => handleToggleMemberStatus(member)}
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 cursor-pointer transition-colors ${
                              member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                            title={`현재: ${member.status === 'online' ? '온라인' : '오프라인'} (클릭하여 상태 변경)`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate">
                              {member.name}
                            </h4>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded">
                                본인
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0 opacity-70" />
                            <span>{member.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Role selection dropdown */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          권한 역할:
                        </span>
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member, e.target.value as any)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium"
                        >
                          <option value="admin">최고 관리자</option>
                          <option value="editor">편집자 (작성/수정)</option>
                          <option value="viewer">뷰어 (열람 전용)</option>
                        </select>
                      </div>
                    </div>

                    {/* Footer: Tasks Count & Delete Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        진행 중인 할 일: <strong className="text-blue-600 dark:text-blue-400">{pendingTasks.length}</strong> / {memberTasks.length}건
                      </span>

                      {!isCurrentUser && onDeleteTeamMember && (
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="팀원 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Member Card (Dotted border) */}
              <button
                onClick={() => setShowAddModal(true)}
                className="p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl flex flex-col items-center justify-center text-center gap-2 group transition-all min-h-[160px] bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs md:text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    새 팀원 추가하기
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    동료를 초대하여 업무를 배정하세요
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 워크스페이스 공유 링크 (Real Live Share URL) */}
      {activeSubTab === 'share' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-5 md:p-6 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    실제 접속 가능한 워크스페이스 공유 링크
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    가상의 도메인이 아닌, 현재 실행 중인 <strong>실제 웹 애플리케이션 접속 링크</strong>입니다.
                  </p>
                </div>
              </div>

              {/* Share On/Off Toggle */}
              <div className="flex items-center gap-2 self-start sm:self-center bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  공유 상태: {workspace.isShared ? '활성' : '비활성'}
                </span>
                <button
                  onClick={handleToggleShare}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    workspace.isShared ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      workspace.isShared ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {workspace.isShared ? (
              <div className="pt-4 border-t border-blue-200/80 dark:border-blue-900/40 space-y-4">
                {/* Real Live URL Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>초대 및 접속 URL:</span>
                    <button
                      onClick={handleResetToCurrentOrigin}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      title="현재 브라우저 주소로 갱신"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>현재 접속 주소로 동기화</span>
                    </button>
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono select-all break-all sm:truncate shadow-inner">
                      {liveShareUrl}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyShareLink}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '복사 완료!' : '링크 복사'}</span>
                      </button>

                      <button
                        onClick={handleOpenShareLinkInNewTab}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="새 창에서 실제 링크 열어보기 (테스트)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>직접 열기</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Access Role & Security Settings */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                          기본 링크 권한
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          링크로 접속한 사용자의 권한
                        </span>
                      </div>
                    </div>

                    <select
                      value={workspace.accessRole}
                      onChange={e => handleAccessRoleChange(e.target.value as any)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="edit">편집 가능 (할 일 생성 및 완료)</option>
                      <option value="view">읽기 전용 (뷰어 모드)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        실시간 다중 접속 지원
                      </span>
                      <span>모바일 브라우저나 다른 PC 탭에서 열어도 데이터가 연결됩니다.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>현재 공유가 비활성화되어 있습니다. 상단의 토글 스위치를 켜면 공유 링크가 활성화됩니다.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: 팀원별 업무 현황 & 매트릭스 */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              팀원별 진행 중인 할 일 현황 매트릭스
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              클릭하여 세부 일정 확인
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map(member => {
              const assigned = tasks.filter(t => t.assigneeId === member.id && t.status !== 'completed');
              return (
                <div
                  key={`matrix-${member.id}`}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      {member.name}
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 rounded-full">
                      {assigned.length}건 진행 중
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {assigned.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-3 text-center">
                        현재 할당된 작업이 없습니다.
                      </p>
                    ) : (
                      assigned.map(t => (
                        <div
                          key={t.id}
                          onClick={() => onOpenTaskModal(t)}
                          className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors shadow-2xs"
                        >
                          <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-300">
                            {t.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {new Date(t.dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Invite/Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    신규 팀원 추가
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    팀원을 추가하여 일정과 업무를 배정하세요.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              {/* Avatar Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMemberName || 'preview')}`}
                  alt="프로필 미리보기"
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {newMemberName || '이름을 입력하세요'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    이름에 따라 자동 생성되는 고유 프로필 아바타입니다.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  이름 (담당자명) *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  이메일 주소 *
                </label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="gildong.hong@workspace.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  권한 역할
                </label>
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="editor">편집자 (할 일 생성, 수정, 완료 체크, 지식 노트 작성)</option>
                  <option value="viewer">뷰어 (전체 일정 및 지식 열람 전용)</option>
                  <option value="admin">최고 관리자 (모든 권한 및 팀원 추가/삭제 가능)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * 추후 팀원 목록에서 언제든지 역할을 변경할 수 있습니다.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  팀원 추가 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                팀원 삭제 확인
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              정말로 <strong>{memberToDelete.name}</strong> 님을 워크스페이스 팀원에서 제외하시겠습니까?
              배정되어 있던 할 일은 '담당자 미지정' 상태로 안전하게 유지됩니다.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDeleteMember}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
