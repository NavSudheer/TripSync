import type { VercelRequest, VercelResponse } from '@vercel/node';

import { makeId, randomInviteCode } from '../src/lib/ids';
import type { Group, User } from '../src/types';
import { db, handleCors } from './_lib/db';

/**
 * GET  /api/groups?userId=...  → groups the user belongs to
 * POST /api/groups { name, user } → create a group
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (handleCors(req, res, 'GET')) return;
    const userId = String(req.query.userId ?? '');
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const q = await db();
    const rows = await q`
      SELECT data FROM groups
      WHERE data->'members' @> ${JSON.stringify([{ userId }])}::jsonb
      ORDER BY updated_at DESC
    `;
    return res.status(200).json({ groups: rows.map((r) => r.data as Group) });
  }

  if (handleCors(req, res, 'POST')) return;
  const { name, user } = (req.body ?? {}) as { name?: string; user?: User };
  if (!name?.trim() || !user?.id || !user?.name) {
    return res.status(400).json({ error: 'name and user are required' });
  }

  const q = await db();
  // Invite codes are unique; retry a few times on the off chance of a clash.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const group: Group = {
      id: makeId(),
      name: name.trim(),
      code: randomInviteCode(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      members: [{ userId: user.id, name: user.name }],
    };
    try {
      await q`INSERT INTO groups (id, code, data) VALUES (${group.id}, ${group.code}, ${JSON.stringify(group)}::jsonb)`;
      return res.status(200).json({ group });
    } catch (e: unknown) {
      const isUniqueViolation = e instanceof Error && 'code' in e && (e as { code?: string }).code === '23505';
      if (!isUniqueViolation || attempt === 4) throw e;
    }
  }
}
