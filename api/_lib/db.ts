import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import type { Group } from '../../src/types';

const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<unknown> | null = null;

/** Runs once per lambda instance; cheap no-op afterwards. */
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

export async function db() {
  await ensureSchema();
  return sql;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const q = await db();
  const rows = await q`SELECT data FROM groups WHERE id = ${id}`;
  return rows.length ? (rows[0].data as Group) : null;
}

export async function saveGroup(group: Group): Promise<void> {
  const q = await db();
  await q`
    UPDATE groups SET data = ${JSON.stringify(group)}::jsonb, updated_at = now()
    WHERE id = ${group.id}
  `;
}

/**
 * Applies permissive CORS (native apps and local dev hit this API
 * cross-origin) and handles preflight. Returns true if the request was
 * fully handled (OPTIONS or wrong method) and the caller should stop.
 */
export function handleCors(req: VercelRequest, res: VercelResponse, method: 'GET' | 'POST'): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  if (req.method !== method) {
    res.status(405).json({ error: `Use ${method}` });
    return true;
  }
  return false;
}
