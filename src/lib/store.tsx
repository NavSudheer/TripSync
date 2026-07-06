import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { makeId } from '@/lib/ids';
import type { Group, MemberPreferences, User } from '@/types';

const USER_KEY = 'tripsync:user';

type Result = { ok: true } | { ok: false; error: string };
type GroupResult = { ok: true; group: Group } | { ok: false; error: string };

type StoreValue = {
  loading: boolean;
  user: User | null;
  /** Groups the signed-in user belongs to (fetched from the server). */
  myGroups: Group[];
  signIn: (name: string) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string) => Promise<GroupResult>;
  joinGroup: (code: string) => Promise<GroupResult>;
  leaveGroup: (groupId: string) => Promise<void>;
  savePreferences: (groupId: string, prefs: MemberPreferences) => Promise<Result>;
  generatePlan: (groupId: string, destinationId?: string) => Promise<GroupResult>;
  getGroup: (groupId: string) => Group | undefined;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem(USER_KEY);
        if (rawUser) setUser(JSON.parse(rawUser));
      } catch (e) {
        console.warn('Failed to load saved user', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mergeGroup = useCallback((group: Group) => {
    setMyGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      return exists ? prev.map((g) => (g.id === group.id ? group : g)) : [group, ...prev];
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const res = await api<{ groups: Group[] }>(`/api/groups?userId=${encodeURIComponent(user.id)}`);
    if (res.ok) setMyGroups(res.data.groups);
  }, [user]);

  // Load the user's groups whenever a user signs in / is restored.
  useEffect(() => {
    if (user) void refresh();
    else setMyGroups([]);
  }, [user, refresh]);

  const refreshGroup = useCallback(
    async (groupId: string) => {
      const res = await api<{ group: Group }>(`/api/group?id=${encodeURIComponent(groupId)}`);
      if (res.ok) mergeGroup(res.data.group);
    },
    [mergeGroup]
  );

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
    async (name: string): Promise<GroupResult> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      const res = await api<{ group: Group }>('/api/groups', { method: 'POST', body: { name, user } });
      if (!res.ok) return res;
      mergeGroup(res.data.group);
      return { ok: true, group: res.data.group };
    },
    [user, mergeGroup]
  );

  const joinGroup = useCallback(
    async (code: string): Promise<GroupResult> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      const res = await api<{ group: Group }>('/api/join', { method: 'POST', body: { code, user } });
      if (!res.ok) return res;
      mergeGroup(res.data.group);
      return { ok: true, group: res.data.group };
    },
    [user, mergeGroup]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      await api('/api/leave', { method: 'POST', body: { groupId, userId: user.id } });
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    },
    [user]
  );

  const savePreferences = useCallback(
    async (groupId: string, prefs: MemberPreferences): Promise<Result> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      const res = await api<{ group: Group }>('/api/preferences', {
        method: 'POST',
        body: { groupId, userId: user.id, prefs },
      });
      if (!res.ok) return res;
      mergeGroup(res.data.group);
      return { ok: true };
    },
    [user, mergeGroup]
  );

  const generatePlan = useCallback(
    async (groupId: string, destinationId?: string): Promise<GroupResult> => {
      const res = await api<{ group: Group }>('/api/generate', {
        method: 'POST',
        body: { groupId, destinationId },
      });
      if (!res.ok) return res;
      mergeGroup(res.data.group);
      return { ok: true, group: res.data.group };
    },
    [mergeGroup]
  );

  const value = useMemo<StoreValue>(
    () => ({
      loading,
      user,
      myGroups,
      signIn,
      signOut,
      refresh,
      refreshGroup,
      createGroup,
      joinGroup,
      leaveGroup,
      savePreferences,
      generatePlan,
      getGroup: (id: string) => myGroups.find((g) => g.id === id),
    }),
    [loading, user, myGroups, signIn, signOut, refresh, refreshGroup, createGroup, joinGroup, leaveGroup, savePreferences, generatePlan]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
