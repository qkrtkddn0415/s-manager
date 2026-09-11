import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Data file directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Default initial state
const defaultState = {
  tasks: [
    {
      id: 'task-1',
      title: 'Q3 프로젝트 기술 아키텍처 및 일정 수립',
      description: '클라우드 마이그레이션 전략과 마이크로서비스 데이터 모델링 완료하기.\n\n- [ ] 데이터베이스 스키마 검토\n- [ ] API 게이트웨이 인증 구조 설계\n- [ ] 배포 파이프라인 구성',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours later (Today / Due soon!)
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
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
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
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days later
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
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // Overdue or completed
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
- **충돌 해결(Conflict Resolution)**: 최신 타임스탬프(Last-Write-Wins) 기반 자동 병합

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
    shareLink: 'https://workspace.app/share/team-alpha-924',
    accessRole: 'edit'
  }
};

// Ensure data folder exists
function loadState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
      if (raw) {
        return JSON.parse(raw);
      }
    }
    // If file does not exist or is empty, write default state
    saveState(defaultState);
    return defaultState;
  } catch (err) {
    // If corrupted or invalid JSON, fall back and regenerate safely
    saveState(defaultState);
    return defaultState;
  }
}

function saveState(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write data file:', err);
  }
}

let appState = loadState();

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all application state
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    data: appState,
    serverTimestamp: new Date().toISOString()
  });
});

// Sync data from client (PC or mobile)
app.post('/api/sync', (req, res) => {
  const clientData = req.body;
  if (!clientData) {
    return res.status(400).json({ error: 'Payload missing' });
  }

  // Merge client data with current state
  if (Array.isArray(clientData.tasks)) appState.tasks = clientData.tasks;
  if (Array.isArray(clientData.notes)) appState.notes = clientData.notes;
  if (Array.isArray(clientData.tags)) appState.tags = clientData.tags;
  if (Array.isArray(clientData.teamMembers)) appState.teamMembers = clientData.teamMembers;
  if (Array.isArray(clientData.notifications)) appState.notifications = clientData.notifications;
  if (clientData.workspace) appState.workspace = { ...appState.workspace, ...clientData.workspace };

  appState.workspace.lastSyncTimestamp = new Date().toISOString();
  saveState(appState);

  res.json({
    success: true,
    data: appState,
    serverTimestamp: appState.workspace.lastSyncTimestamp
  });
});

// Export full backup
app.get('/api/backup', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=knowledge_schedule_backup_${Date.now()}.json`);
  res.json({
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    ...appState
  });
});

// Restore / Import backup
app.post('/api/restore', (req, res) => {
  const backupData = req.body;
  if (!backupData || (!backupData.tasks && !backupData.notes)) {
    return res.status(400).json({ error: '유효한 백업 파일 형식이 아닙니다.' });
  }

  appState = {
    tasks: backupData.tasks || [],
    notes: backupData.notes || [],
    tags: backupData.tags || defaultState.tags,
    teamMembers: backupData.teamMembers || defaultState.teamMembers,
    notifications: backupData.notifications || [],
    workspace: {
      ...defaultState.workspace,
      ...(backupData.workspace || {}),
      lastSyncTimestamp: new Date().toISOString()
    }
  };

  saveState(appState);
  res.json({ success: true, data: appState });
});

// Reset to sample initial state
app.post('/api/reset', (req, res) => {
  appState = JSON.parse(JSON.stringify(defaultState));
  saveState(appState);
  res.json({ success: true, data: appState });
});

// Vite middleware & Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
