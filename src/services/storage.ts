import { AppState, Task, KnowledgeNote, AppNotification } from '../types';

const STORAGE_KEY = 'knowledge_schedule_app_v1';

// Initial fallback state if offline and empty
export function generateLiveShareUrl(workspaceId: string = 'ws-main', role: 'view' | 'edit' = 'edit'): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?workspace=${encodeURIComponent(workspaceId)}&role=${encodeURIComponent(role)}`;
  }
  return `/?workspace=${encodeURIComponent(workspaceId)}&role=${encodeURIComponent(role)}`;
}

export const initialFallbackState: AppState = {
  tasks: [
    {
      id: 'task-1',
      title: 'Q3 프로젝트 기술 아키텍처 및 일정 수립',
      description: '클라우드 마이그레이션 전략과 마이크로서비스 데이터 모델링 완료하기.\n\n- [ ] 데이터베이스 스키마 검토\n- [ ] API 게이트웨이 인증 구조 설계\n- [ ] 배포 파이프라인 구성',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      priority: 'critical',
      status: 'in_progress',
      tags: ['프로젝트', '아키텍처', '개발'],
      category: '업무',
      assigneeId: 'user-1',
      reminderMinutesBefore: 60,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      linkedNoteIds: ['note-1'],
      comments: [
        {
          id: 'c-1',
          authorId: 'user-2',
          authorName: '이서연',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
          content: '인증 구조 초안을 지식 노트에 작성해 두었습니다. 참고 부탁드립니다!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        }
      ]
    },
    {
      id: 'task-2',
      title: '주간 팀 스프린트 회고 및 공유 미팅',
      description: '지난 주 릴리즈 이슈 리뷰 및 신규 피처 데모 시연 준비',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      priority: 'high',
      status: 'todo',
      tags: ['팀협업', '미팅', '기획'],
      category: '업무',
      assigneeId: 'user-2',
      reminderMinutesBefore: 30,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      linkedNoteIds: ['note-2'],
      comments: []
    },
    {
      id: 'task-3',
      title: 'TypeScript 5.8 신기능 및 최적화 기법 스터디',
      description: '타입 추론 성능 개선점과 ECMAScript 신규 기능 메모 정리',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      priority: 'medium',
      status: 'todo',
      tags: ['학습', 'TypeScript', '자기계발'],
      category: '학습',
      assigneeId: 'user-1',
      reminderMinutesBefore: 120,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      linkedNoteIds: ['note-3'],
      comments: []
    },
    {
      id: 'task-4',
      title: '모바일 반응형 UI 터치 제스처 검증',
      description: '스마트폰 화면에서 스와이프 및 하단 탭 내비게이션 동작 테스트 완료',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      priority: 'high',
      status: 'completed',
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      tags: ['모바일', 'UI/UX', 'QA'],
      category: '개발',
      assigneeId: 'user-3',
      reminderMinutesBefore: 15,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      linkedNoteIds: [],
      comments: []
    },
    {
      id: 'task-5',
      title: '오프라인 캐싱 및 데이터 백업 루틴 점검',
      description: 'LocalStorage 와 서버 간 동기화 충돌 방지 로직 검증',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      priority: 'low',
      status: 'todo',
      tags: ['개발', '동기화', '오프라인'],
      category: '개발',
      assigneeId: 'user-1',
      reminderMinutesBefore: 60,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      linkedNoteIds: ['note-1'],
      comments: []
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: '클라우드 인프라 및 실시간 동기화 아키텍처 가이드',
      content: `# 클라우드 & 실시간 동기화 아키텍처

본 문서는 PC와 모바일 간의 무중단 동기화와 오프라인 우선(Offline-First) 데이터 설계를 다룹니다.

## 1. 핵심 원칙
- **로컬 우선(Local-First)**: 네트워크 단절 시에도 로컬 브라우저 저장소(LocalStorage)에 즉각 반영
- **낙관적 업데이트(Optimistic Update)**: 사용자 인터랙션 즉시 UI 렌더링 후 백그라운드 동기화
- **충돌 해결(Conflict Resolution)**: 최신 타임스탬프 기반 자동 병합

\`\`\`typescript
interface SyncPayload {
  tasks: Task[];
  notes: KnowledgeNote[];
  timestamp: string;
}
\`\`\`

## 2. 보안 및 백업
- 정기적인 JSON 스냅샷 내보내기 지원
- 암호화된 토큰 인증 및 팀 단위 권한 분리`,
      tags: ['아키텍처', '동기화', '클라우드'],
      category: '업무',
      isPinned: true,
      linkedTaskIds: ['task-1', 'task-5'],
      author: '김민준 (수석 엔지니어)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      comments: [
        {
          id: 'nc-1',
          authorId: 'user-2',
          authorName: '이서연',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
          content: '모바일 웹 브라우저에서 캐싱 전략 매우 안정적으로 동작합니다.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        }
      ]
    },
    {
      id: 'note-2',
      title: '효율적인 시간 관리와 우선순위 프레임워크 (아이젠하워 매트릭스)',
      content: `# 아이젠하워 매트릭스 활용법

할 일을 **중요도**와 **긴급도**의 2개 축으로 나누어 4사분면으로 분류합니다.

### 1사분면 (긴급 & 중요): 즉시 실행
- 마감 임박 프로젝트, 시스템 긴급 장애, 핵심 고객 대응

### 2사분면 (중요하나 긴급하지 않음): 일정 계획 후 집중
- 개인 지식 정리, 아키텍처 학습, 건강 관리, 장기 비전

### 3사분면 (긴급하나 중요하지 않음): 위임 또는 최소화
- 일부 불필요한 회의, 단순 반복 요청

### 4사분면 (긴급하지도 중요하지도 않음): 과감한 삭제
- 목적 없는 웹서핑, 불필요한 알림 노이즈`,
      tags: ['생산성', '시간관리', '기획'],
      category: '학습',
      isPinned: true,
      linkedTaskIds: ['task-2'],
      author: '이서연 (프로덕트 리드)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      comments: []
    },
    {
      id: 'note-3',
      title: '모던 웹 개발 체크리스트: 반응형, 다크모드, 웹접근성',
      content: `# 웹 애플리케이션 품질 체크리스트

1. **디스플레이 반응형**
   - 데스크톱(1024px+): 다단 대시보드와 칸반 보드
   - 모바일(<768px>): 하단 탭 내비게이션, 터치 편의성(44px 이상 터치 타겟)

2. **다크 모드(Dark Mode)**
   - 명도 대비 WCAG AA (4.5:1 이상) 준수
   - 무채색 Slate 팔레트로 눈의 피로 최소화

3. **검색 최적화**
   - 단축키 \`Ctrl + K\` 또는 \`Cmd + K\` 즉시 진입
   - 제목, 본문, 태그 통합 인덱싱`,
      tags: ['개발', 'UI/UX', 'TypeScript'],
      category: '개발',
      isPinned: false,
      linkedTaskIds: ['task-3'],
      author: '박도윤 (프론트엔드)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      comments: []
    }
  ],
  tags: [
    { id: 'tag-1', name: '프로젝트', color: 'blue' },
    { id: 'tag-2', name: '아키텍처', color: 'indigo' },
    { id: 'tag-3', name: '개발', color: 'emerald' },
    { id: 'tag-4', name: '팀협업', color: 'purple' },
    { id: 'tag-5', name: '미팅', color: 'amber' },
    { id: 'tag-6', name: '기획', color: 'pink' },
    { id: 'tag-7', name: '학습', color: 'teal' },
    { id: 'tag-8', name: 'TypeScript', color: 'sky' },
    { id: 'tag-9', name: 'UI/UX', color: 'rose' },
    { id: 'tag-10', name: '생산성', color: 'orange' }
  ],
  teamMembers: [
    {
      id: 'user-1',
      name: '김민준 (나)',
      email: 'minjun.kim@workspace.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'admin',
      status: 'online'
    },
    {
      id: 'user-2',
      name: '이서연',
      email: 'seoyeon.lee@workspace.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      role: 'editor',
      status: 'online'
    },
    {
      id: 'user-3',
      name: '박도윤',
      email: 'doyun.park@workspace.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      role: 'editor',
      status: 'offline'
    },
    {
      id: 'user-4',
      name: '최지우',
      email: 'jiwoo.choi@workspace.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
      role: 'viewer',
      status: 'online'
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'due_soon',
      title: '마감 임박 알림 (오늘 마감)',
      message: '"Q3 프로젝트 기술 아키텍처 및 일정 수립" 마감 시간이 4시간 남았습니다.',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      taskId: 'task-1'
    },
    {
      id: 'notif-2',
      type: 'team_mention',
      title: '팀 댓글 알림',
      message: '이서연 님이 "Q3 프로젝트 기술 아키텍처 및 일정 수립"에 새 댓글을 남겼습니다.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
      taskId: 'task-1'
    },
    {
      id: 'notif-3',
      type: 'sync',
      title: '데이터 동기화 완료',
      message: '모바일 및 PC 디바이스 간 최신 데이터가 성공적으로 동기화되었습니다.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      read: true
    }
  ],
  workspace: {
    id: 'ws-main',
    name: '개인 & 팀 통합 워크스페이스',
    lastSyncTimestamp: new Date().toISOString(),
    isShared: true,
    shareLink: generateLiveShareUrl('ws-main', 'edit'),
    accessRole: 'edit'
  }
};

// Local storage access
export function getLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AppState = JSON.parse(raw);
      // Auto-heal fake or outdated workspace shareLinks (e.g. placeholder workspace.app)
      if (
        !parsed.workspace?.shareLink ||
        parsed.workspace.shareLink.includes('workspace.app') ||
        parsed.workspace.shareLink.includes('example.com')
      ) {
        parsed.workspace = {
          ...parsed.workspace,
          shareLink: generateLiveShareUrl(parsed.workspace?.id || 'ws-main', parsed.workspace?.accessRole || 'edit')
        };
        saveLocalState(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage read failed', e);
  }
  return initialFallbackState;
}

export function saveLocalState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage write failed', e);
  }
}

// Check deadline warnings and generate notifications
export function checkDeadlinesAndAlerts(tasks: Task[]): AppNotification[] {
  const now = Date.now();
  const alerts: AppNotification[] = [];

  tasks.forEach(task => {
    if (task.status === 'completed') return;
    const dueTime = new Date(task.dueDate).getTime();
    const diffHours = (dueTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue
      alerts.push({
        id: `overdue-${task.id}`,
        type: 'overdue',
        title: '마감 기한 초과!',
        message: `"${task.title}" 마감 기한(${new Date(task.dueDate).toLocaleDateString('ko-KR')})이 지났습니다.`,
        date: new Date().toISOString(),
        read: false,
        taskId: task.id
      });
    } else if (diffHours <= 24) {
      // Due within 24 hours
      const hoursLeft = Math.max(1, Math.round(diffHours));
      alerts.push({
        id: `due-soon-${task.id}`,
        type: 'due_soon',
        title: '마감 임박 알림 (D-Day)',
        message: `"${task.title}" 마감까지 약 ${hoursLeft}시간 남았습니다.`,
        date: new Date().toISOString(),
        read: false,
        taskId: task.id
      });
    }
  });

  return alerts;
}

// Web Audio API gentle notification chime
export function playNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (err) {
    // AudioContext blocked or not supported
  }
}

// Request Browser Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function showSystemNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico'
    });
  }
}
