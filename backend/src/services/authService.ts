import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code.toUpperCase().trim(), SALT_ROUNDS);
}

export async function compareCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code.toUpperCase().trim(), hash);
}

export function signToken(roomId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ roomId }, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { roomId: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.verify(token, secret) as { roomId: string };
}
