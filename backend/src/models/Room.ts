import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  codeHash: string;
  label: string;
  passwordHash?: string; // Optional room security password
  isPasswordProtected: boolean;
  fileCount: number;
  totalBytes: number;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  codeHash: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  passwordHash: { type: String, required: false },
  isPasswordProtected: { type: Boolean, default: false },
  fileCount: { type: Number, default: 0 },
  totalBytes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
