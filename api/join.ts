import type { VercelRequest, VercelResponse } from '@vercel/node';

import type { Group, User } from '../src/types';
import { db, handleCors, saveGroup } from './_lib/db';

/** POST /api/join { code, user } → join a group by invite code */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST')) return;
  const { code, user } = (req.body ?? {}) as { code?: string; user?: User };
  if (!code?.trim() || !user?.id || !user?.name) {
    return res.status(400).json({ error: 'code and user are required' });
  }

  const q = await db();
  const rows = await q`SELECT data FROM groups WHERE code = ${code.trim().toUpperCase()}`;
  if (rows.length === 0) {
    return res.status(404).json({ error: 'No group found with that code.' });
  }
  const group = rows[0].data as Group;
  if (group.members.some((m) => m.userId === user.id)) {
    return res.status(409).json({ error: 'You are already in this group.' });
  }
  group.members.push({ userId: user.id, name: user.name });
  await saveGroup(group);
  return res.status(200).json({ group });
}
