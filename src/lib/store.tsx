import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Group, MemberPreferences, User } from '@/types';

const USER_KEY = 'tripsync:user';
const GROUPS_KEY = 'tripsync:groups';

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// No 0/O or 1/I so codes are easy to read out loud.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeInviteCode(existing: Group[]): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!existing.some((g) => g.code === code)) return code;
  }
}

type StoreValue = {
  loading: boolean;
  user: User | null;
  /** All groups on this device (the mock backend). */
  groups: Group[];
  /** Groups the signed-in user belongs to. */
  myGroups: Group[];
  signIn: (name: string) => Promise<User>;
  signOut: () => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  joinGroup: (code: string) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>;
  leaveGroup: (groupId: string) => Promise<void>;
  savePreferences: (groupId: string, prefs: MemberPreferences) => Promise<void>;
  updateGroup: (groupId: string, update: (g: Group) => Group) => Promise<void>;
  getGroup: (groupId: string) => Group | undefined;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [rawUser, rawGroups] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(GROUPS_KEY),
        ]);
        if (rawUser) setUser(JSON.parse(rawUser));
        if (rawGroups) setGroups(JSON.parse(rawGroups));
      } catch (e) {
        console.warn('Failed to load saved data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistGroups = useCallback(async (next: Group[]) => {
    setGroups(next);
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(next));
  }, []);

  const signIn = useCallback(async (name: string) => {
    const u: User = { id: makeId(), name: name.trim() };
    setUser(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const createGroup = useCallback(
    async (name: string) => {
      if (!user) throw new Error('Not signed in');
      const group: Group = {
        id: makeId(),
        name: name.trim(),
        code: makeInviteCode(groups),
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        members: [{ userId: user.id, name: user.name }],
      };
      await persistGroups([...groups, group]);
      return group;
    },
    [user, groups, persistGroups]
  );

  const joinGroup = useCallback(
    async (code: string) => {
      if (!user) return { ok: false as const, error: 'Not signed in.' };
      const normalized = code.trim().toUpperCase();
      const group = groups.find((g) => g.code === normalized);
      if (!group) return { ok: false as const, error: 'No group found with that code.' };
      if (group.members.some((m) => m.userId === user.id)) {
        return { ok: false as const, error: 'You are already in this group.' };
      }
      const updated: Group = {
        ...group,
        members: [...group.members, { userId: user.id, name: user.name }],
      };
      await persistGroups(groups.map((g) => (g.id === group.id ? updated : g)));
      return { ok: true as const, group: updated };
    },
    [user, groups, persistGroups]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      const next = groups
        .map((g) =>
          g.id === groupId ? { ...g, members: g.members.filter((m) => m.userId !== user.id) } : g
        )
        .filter((g) => g.members.length > 0);
      await persistGroups(next);
    },
    [user, groups, persistGroups]
  );

  const updateGroup = useCallback(
    async (groupId: string, update: (g: Group) => Group) => {
      await persistGroups(groups.map((g) => (g.id === groupId ? update(g) : g)));
    },
    [groups, persistGroups]
  );

  const savePreferences = useCallback(
    async (groupId: string, prefs: MemberPreferences) => {
      if (!user) return;
      await updateGroup(groupId, (g) => ({
        ...g,
        members: g.members.map((m) => (m.userId === user.id ? { ...m, prefs } : m)),
      }));
    },
    [user, updateGroup]
  );

  const value = useMemo<StoreValue>(() => {
    const myGroups = user ? groups.filter((g) => g.members.some((m) => m.userId === user.id)) : [];
    return {
      loading,
      user,
      groups,
      myGroups,
      signIn,
      signOut,
      createGroup,
      joinGroup,
      leaveGroup,
      savePreferences,
      updateGroup,
      getGroup: (id: string) => groups.find((g) => g.id === id),
    };
  }, [loading, user, groups, signIn, signOut, createGroup, joinGroup, leaveGroup, savePreferences, updateGroup]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
