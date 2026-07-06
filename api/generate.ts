import type { VercelRequest, VercelResponse } from '@vercel/node';

import { generateItinerary } from '../src/lib/itinerary';
import { getGroupById, handleCors, saveGroup } from './_lib/db';

/** POST /api/generate { groupId, destinationId? } → build and save the group itinerary */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST')) return;
  const { groupId, destinationId } = (req.body ?? {}) as { groupId?: string; destinationId?: string };
  if (!groupId) return res.status(400).json({ error: 'groupId is required' });

  const group = await getGroupById(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const result = generateItinerary(group, destinationId);
  if (!result.ok) return res.status(422).json({ error: result.error });

  group.itinerary = result.itinerary;
  await saveGroup(group);
  return res.status(200).json({ group });
}
