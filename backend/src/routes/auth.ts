import { Router, Request, Response } from 'express';
import { Room } from '../models/Room';
import { hashCode, compareCode, signToken } from '../services/authService';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { code, password } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length < 1) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  // Preserve whatever casing/numbers the user chose, trim whitespace
  const normalizedCode = code.trim();

  // Find matching room by comparing hash against all rooms
  const rooms = await Room.find({});
  let matchedRoom = null;

  for (const room of rooms) {
    const match = await compareCode(normalizedCode, room.codeHash);
    if (match) {
      matchedRoom = room;
      break;
    }
  }

  if (!matchedRoom) {
    // First time using this room code — auto-create a new room
    const roomCount = await Room.countDocuments();
    const label = `Room-${(roomCount + 1).toString().padStart(3, '0')}`;
    const codeHash = await hashCode(normalizedCode);

    matchedRoom = await Room.create({
      codeHash,
      label,
      isPasswordProtected: false,
      fileCount: 0,
      totalBytes: 0,
    });

    console.log(`✨ New room created: ${label}`);
  } else if (matchedRoom.isPasswordProtected && matchedRoom.passwordHash) {
    // Room has password protection enabled!
    if (!password) {
      // Prompt user for room password
      res.status(403).json({
        requiresPassword: true,
        roomLabel: matchedRoom.label,
        error: 'This room is locked with a password. Please enter the password to enter.',
      });
      return;
    }

    const passwordMatch = await compareCode(password, matchedRoom.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({
        requiresPassword: true,
        error: 'Incorrect room password',
      });
      return;
    }
  }

  const token = signToken(matchedRoom._id.toString());

  res.json({
    token,
    room: {
      id: matchedRoom._id,
      label: matchedRoom.label,
      isPasswordProtected: !!matchedRoom.isPasswordProtected,
      fileCount: matchedRoom.fileCount,
      totalBytes: matchedRoom.totalBytes,
    },
  });
});

// POST /api/auth/room-password — Set or remove password for current room
router.post('/room-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { password, remove } = req.body;
  const room = await Room.findById(req.roomId);

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  if (remove) {
    room.passwordHash = undefined;
    room.isPasswordProtected = false;
    await room.save();
    res.json({ message: 'Room password removed successfully', isPasswordProtected: false });
    return;
  }

  if (!password || typeof password !== 'string' || password.trim().length < 3) {
    res.status(400).json({ error: 'Password must be at least 3 characters long' });
    return;
  }

  const passwordHash = await hashCode(password.trim());
  room.passwordHash = passwordHash;
  room.isPasswordProtected = true;
  await room.save();

  res.json({ message: 'Room password updated successfully', isPasswordProtected: true });
});

export default router;
