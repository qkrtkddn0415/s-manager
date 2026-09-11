import { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileJson
} from 'lucide-react';
import { AppState } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onRestoreState: (importedState: AppState) => void;
  onResetToSample: () => void;
  isOnline: boolean;
  lastSyncTime: string;
}

export default function BackupModal({
  isOpen,
  onClose,
  appState,
  onRestoreState,
  onResetToSample,
  isOnline,
  lastSyncTime
}: BackupModalProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const backupPayload = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      ...appState
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `knowledge_schedule_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setImportSuccess('백업 파일이 성공적으로 다운로드되었습니다.');
    setTimeout(() => setImportSuccess(null), 4000);
  };

  const processJsonFile = (file: File) => {
    setImportError(null);
    setImportSuccess(null);

    if (!file.name.endsWith('.json')) {
      setImportError('JSON 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.notes))) {
          setImportError('유효한 백업 파일 형식이 아닙니다 (tasks 또는 notes 배열 누락).');
          return;
        }

        const restored: AppState = {
          tasks: parsed.tasks || [],
          notes: parsed.notes || [],
          tags: parsed.tags || appState.tags,
          teamMembers: parsed.teamMembers || appState.teamMembers,
          notifications: parsed.notifications || [],
          workspace: {
            ...appState.workspace,
            ...(parsed.workspace || {}),
            lastSyncTimestamp: new Date().toISOString()
          }
        };

        onRestoreState(restored);
        setImportSuccess(
          `복원 완료: 할 일 ${restored.tasks.length}건, 지식 노트 ${restored.notes.length}건이 성공적으로 로드되었습니다.`
        );
      } catch (err) {
        setImportError('JSON 파일 파싱 실패: 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processJsonFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processJsonFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
              데이터 백업 및 오프라인 접근 관리
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status & Storage info */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-500" />
                네트워크 및 동기화 상태
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isOnline
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isOnline ? '온라인 (클라우드 동기화)' : '오프라인 (로컬 보관 중)'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              본 애플리케이션은 <strong>오프라인 우선(Offline-First)</strong> 구조로 설계되어 있습니다.
              인터넷 연결이 끊겨도 브라우저의 로컬 스토리지에 데이터가 안전하게 보관되며, 네트워크 재연결 시
              자동으로 동기화됩니다.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center text-xs">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-400 text-[10px]">보관된 할 일</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{appState.tasks.length}건</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-400 text-[10px]">지식 노트</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{appState.notes.length}개</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-400 text-[10px]">마지막 동기화</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Success / Error Messages */}
          {importSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* 1. Export Data */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              1. 전체 데이터 백업 파일 다운로드 (.json)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              현재 작성된 모든 할 일, 마감 일정, 지식 노트, 태그를 하나의 JSON 파일로 내보냅니다.
            </p>
            <button
              onClick={handleExportJson}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>JSON 데이터 백업 파일 생성 및 다운로드</span>
            </button>
          </div>

          {/* 2. Import Data (Drag & Drop or Click) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              2. 백업 파일에서 복원하기 (.json)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              이전에 다운로드한 백업 JSON 파일을 업로드하여 데이터를 복원합니다.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <FileJson className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                JSON 백업 파일을 이곳에 드래그 앤 드롭하거나 클릭하여 선택
              </p>
              <p className="text-[11px] text-slate-400 mt-1">.json 형식 파일 지원</p>
            </div>
          </div>

          {/* 3. Reset to Sample Data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                샘플 데모 데이터로 초기화
              </span>
              <span className="text-[11px] text-slate-400">
                기본 예시 지식 노트와 할 일 데이터셋으로 되돌립니다.
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('기존 데이터가 초기 예시 데이터로 덮어씌워집니다. 진행하시겠습니까?')) {
                  onResetToSample();
                  setImportSuccess('샘플 데이터로 초기화되었습니다.');
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
