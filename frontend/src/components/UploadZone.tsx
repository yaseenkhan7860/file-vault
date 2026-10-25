import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api/client';
import { FileItem } from '../pages/HomePage';

interface Props {
  onUploadComplete: (file: FileItem) => void;
}

interface UploadProgress {
  id: string;
  fileName: string;
  percent: number;
}

export default function UploadZone({ onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile);
    e.target.value = '';
  };

  const uploadFile = async (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    setUploads((prev) => [...prev, { id, fileName: file.name, percent: 0 }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percent = Math.round((progressEvent.loaded / total) * 100);
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, percent } : u))
          );
        },
      });

      onUploadComplete(res.data.file);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('Upload failed:', axiosErr.response?.data?.error || axiosErr.message);
    } finally {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group
          ${dragging
            ? 'border-gray-900 bg-gray-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors
          ${dragging ? 'bg-gray-900' : 'bg-gray-100 group-hover:bg-gray-200'}`}
        >
          <Upload
            className={`w-6 h-6 transition-colors ${dragging ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
          />
        </div>
        <p className="text-sm font-medium text-gray-700">
          {dragging ? 'Drop files here' : 'Drop files or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Any file type · No size limit</p>
      </div>

      {/* Active upload progress bars */}
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-white border border-gray-100 rounded-xl p-4 animate-slide-up"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {upload.fileName}
            </span>
            <span className="text-sm text-gray-500 font-mono ml-2">{upload.percent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-200"
              style={{ width: `${upload.percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {upload.percent < 100 ? 'Uploading to vault...' : 'Processing...'}
          </p>
        </div>
      ))}
    </div>
  );
}
