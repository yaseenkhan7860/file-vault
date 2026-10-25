import { X } from 'lucide-react';
import { DownloadState } from '../pages/HomePage';
import { formatBytes, formatETA } from '../utils/formatters';

type Props = DownloadState & { onCancel: () => void };

export default function DownloadProgress({
  fileName,
  percent,
  receivedBytes,
  totalBytes,
  etaSeconds,
  onCancel,
}: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Downloading
          </p>
          <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all ml-2 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-gray-900 text-sm">{percent}%</span>
        <span className="text-gray-400">
          {formatBytes(receivedBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
      {etaSeconds > 0 && (
        <p className="text-xs text-gray-400 mt-1">{formatETA(etaSeconds)}</p>
      )}
    </div>
  );
}
