import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  roomId: mongoose.Types.ObjectId;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  driveFileId: string;
  driveDownloadUrl: string;
  uploadedAt: Date;
}

const FileSchema = new Schema<IFile>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  driveFileId: { type: String, required: true },
  driveDownloadUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const File = mongoose.model<IFile>('File', FileSchema);
