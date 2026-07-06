import type { VercelRequest, VercelResponse } from '@vercel/node';

import { db, getGroupById, handleCors, saveGroup } from './_lib/db';

/** POST /api/leave { groupId, userId } → leave a group; empty groups are deleted */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST')) return;
  const { groupId, userId } = (req.body ?? {}) as { groupId?: string; userId?: string };
  if (!groupId || !userId) return res.status(400).json({ error: 'groupId and userId are required' });

  const group = await getGroupById(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  group.members = group.members.filter((m) => m.userId !== userId);
  if (group.members.length === 0) {
    const q = await db();
    await q`DELETE FROM groups WHERE id = ${groupId}`;
  } else {
    await saveGroup(group);
  }
  return res.status(200).json({ ok: true });
}
