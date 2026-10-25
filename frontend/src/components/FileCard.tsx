import { Download, Trash2 } from 'lucide-react';
import { FileItem } from '../pages/HomePage';
import { formatBytes, formatDate, getMimeIcon } from '../utils/formatters';

interface Props {
  file: FileItem;
  onDownload: (file: FileItem) => void;
  onDelete: (id: string, name: string) => void;
}

export default function FileCard({ file, onDownload, onDelete }: Props) {
  const icon = getMimeIcon(file.mimeType);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group flex flex-col">
      {/* Icon + Name */}
      <div className="flex items-start gap-3 mb-4 flex-1">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-gray-100">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium text-gray-900 truncate leading-snug"
            title={file.fileName}
          >
            {file.fileName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.sizeBytes)}</p>
        </div>
      </div>

      {/* Footer: date + actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">{formatDate(file.uploadedAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={() => onDelete(file._id, file.fileName)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
