import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FolderOpen, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import UploadZone from '../components/UploadZone';
import FileList from '../components/FileList';
import ConfirmDialog from '../components/ConfirmDialog';
import DownloadProgress from '../components/DownloadProgress';
import RoomPasswordModal from '../components/RoomPasswordModal';
import { formatBytes } from '../utils/formatters';

export interface FileItem {
  _id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  driveDownloadUrl: string;
  uploadedAt: string;
}

export interface DownloadState {
  fileName: string;
  percent: number;
  receivedBytes: number;
  totalBytes: number;
  etaSeconds: number;
  active: boolean;
  abortController?: AbortController;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<{
    label: string;
    fileCount: number;
    totalBytes: number;
    isPasswordProtected?: boolean;
  } | null>(null);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; fileId: string; fileName: string }>({
    open: false,
    fileId: '',
    fileName: '',
  });
  const [downloadState, setDownloadState] = useState<DownloadState>({
    fileName: '',
    percent: 0,
    receivedBytes: 0,
    totalBytes: 0,
    etaSeconds: 0,
    active: false,
  });

  const loadFiles = useCallback(async () => {
    try {
      const res = await api.get('/api/files');
      setFiles(res.data.files);
    } catch {
      // 401 handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const roomData = localStorage.getItem('vault_room');
    if (roomData) setRoom(JSON.parse(roomData));
    loadFiles();
  }, [loadFiles]);

  const handleUploadComplete = (newFile: FileItem) => {
    setFiles((prev) => [newFile, ...prev]);
    if (room) {
      const updated = {
        ...room,
        fileCount: room.fileCount + 1,
        totalBytes: room.totalBytes + newFile.sizeBytes,
      };
      setRoom(updated);
      localStorage.setItem('vault_room', JSON.stringify(updated));
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const res = await api.get(`/api/files/${file._id}/download`);
      const { downloadUrl, fileName, sizeBytes } = res.data;

      const abortController = new AbortController();
      setDownloadState({
        fileName,
        percent: 0,
        receivedBytes: 0,
        totalBytes: sizeBytes,
        etaSeconds: 0,
        active: true,
        abortController,
      });

      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${downloadUrl}`;

      const response = await fetch(fullUrl, { signal: abortController.signal });
      const contentLength = +(response.headers.get('Content-Length') || sizeBytes);
      const reader = response.body!.getReader();

      let received = 0;
      const startTime = Date.now();
      const chunks: BlobPart[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        const elapsed = (Date.now() - startTime) / 1000 || 0.001;
        const speed = received / elapsed;
        const eta = (contentLength - received) / speed;
        const percent = Math.min(99, Math.round((received / contentLength) * 100));

        setDownloadState((prev) => ({
          ...prev,
          percent,
          receivedBytes: received,
          totalBytes: contentLength,
          etaSeconds: eta,
        }));
      }

      // Assemble and trigger browser download
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadState((prev) => ({ ...prev, percent: 100, active: false }));
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name !== 'AbortError') {
        console.error('Download failed:', err);
      }
      setDownloadState((prev) => ({ ...prev, active: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/files/${deleteDialog.fileId}`);
      const deleted = files.find((f) => f._id === deleteDialog.fileId);
      setFiles((prev) => prev.filter((f) => f._id !== deleteDialog.fileId));
      if (room && deleted) {
        const updated = {
          ...room,
          fileCount: room.fileCount - 1,
          totalBytes: room.totalBytes - deleted.sizeBytes,
        };
        setRoom(updated);
        localStorage.setItem('vault_room', JSON.stringify(updated));
      }
    } finally {
      setDeleteDialog({ open: false, fileId: '', fileName: '' });
    }
  };

  const handlePasswordStatusUpdated = (isProtected: boolean) => {
    if (room) {
      const updated = { ...room, isPasswordProtected: isProtected };
      setRoom(updated);
      localStorage.setItem('vault_room', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_room');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">File Vault</h1>
              {room && (
                <p className="text-xs text-gray-400">
                  {room.label} · {room.fileCount} {room.fileCount === 1 ? 'file' : 'files'} ·{' '}
                  {formatBytes(room.totalBytes)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPasswordModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                room?.isPasswordProtected
                  ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {room?.isPasswordProtected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Room Locked</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Lock Room</span>
                </>
              )}
            </button>
            <button
              onClick={() => setLogoutDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <UploadZone onUploadComplete={handleUploadComplete} />

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Your vault is empty</p>
            <p className="text-xs text-gray-400 mt-1">Upload files above to get started</p>
          </div>
        ) : (
          <FileList
            files={files}
            onDownload={handleDownload}
            onDelete={(id, name) => setDeleteDialog({ open: true, fileId: id, fileName: name })}
          />
        )}
      </main>

      {/* Download overlay */}
      {downloadState.active && (
        <DownloadProgress
          {...downloadState}
          onCancel={() => {
            downloadState.abortController?.abort();
            setDownloadState((prev) => ({ ...prev, active: false }));
          }}
        />
      )}

      {/* Room Password Security Modal */}
      <RoomPasswordModal
        open={passwordModalOpen}
        isPasswordProtected={!!room?.isPasswordProtected}
        onClose={() => setPasswordModalOpen(false)}
        onUpdate={handlePasswordStatusUpdated}
      />

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteDialog.fileName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, fileId: '', fileName: '' })}
      />

      <ConfirmDialog
        open={logoutDialog}
        title="Logout"
        message="You'll need your room code to log back in. Make sure you remember it!"
        confirmLabel="Logout"
        confirmVariant="default"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialog(false)}
      />
    </div>
  );
}
