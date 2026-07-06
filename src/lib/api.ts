import { Platform } from 'react-native';

/**
 * Production deployment URL. Used by native apps and local dev servers;
 * the deployed web app talks to its own origin instead.
 */
const PROD_API = 'https://tripsync-beige.vercel.app';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' && !__DEV__ ? '' : PROD_API);

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function api<T>(
  path: string,
  options?: { method?: 'GET' | 'POST'; body?: unknown }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options?.method ?? 'GET',
      headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: typeof json.error === 'string' ? json.error : `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
}
