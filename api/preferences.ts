import type { VercelRequest, VercelResponse } from '@vercel/node';

import type { MemberPreferences } from '../src/types';
import { getGroupById, handleCors, saveGroup } from './_lib/db';

/** POST /api/preferences { groupId, userId, prefs } → save a member's preferences */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST')) return;
  const { groupId, userId, prefs } = (req.body ?? {}) as {
    groupId?: string;
    userId?: string;
    prefs?: MemberPreferences;
  };
  if (!groupId || !userId || !prefs || typeof prefs.budget !== 'number' || !Array.isArray(prefs.dateRanges)) {
    return res.status(400).json({ error: 'groupId, userId and prefs are required' });
  }

  const group = await getGroupById(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const member = group.members.find((m) => m.userId === userId);
  if (!member) return res.status(403).json({ error: 'You are not a member of this group.' });

  member.prefs = {
    budget: Math.round(prefs.budget),
    destinationIds: Array.isArray(prefs.destinationIds) ? prefs.destinationIds : [],
    dateRanges: prefs.dateRanges,
  };
  await saveGroup(group);
  return res.status(200).json({ group });
}
