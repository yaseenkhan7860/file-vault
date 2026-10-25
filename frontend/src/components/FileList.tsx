import { FileItem } from '../pages/HomePage';
import FileCard from './FileCard';

interface Props {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
  onDelete: (id: string, name: string) => void;
}

export default function FileList({ files, onDownload, onDelete }: Props) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-widest">
        Files · {files.length}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file, i) => (
          <div
            key={file._id}
            className="animate-slide-up"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            <FileCard file={file} onDownload={onDownload} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}
