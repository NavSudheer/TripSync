import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getGroupById, handleCors } from './_lib/db';

/** GET /api/group?id=... → a single group */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'GET')) return;
  const id = String(req.query.id ?? '');
  if (!id) return res.status(400).json({ error: 'id is required' });
  const group = await getGroupById(id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  return res.status(200).json({ group });
}
