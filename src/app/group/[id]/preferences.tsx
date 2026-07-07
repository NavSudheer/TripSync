import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { RangeCalendar } from '@/components/range-calendar';
import {
  Body,
  Button,
  Card,
  Chip,
  Danger,
  Field,
  Gap,
  Row,
  Screen,
  SectionTitle,
  Subtitle,
  Title,
  usePalette,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { DESTINATIONS } from '@/data/destinations';
import { prettyRange } from '@/lib/dates';
import { useStore } from '@/lib/store';
import type { DateRange } from '@/types';

export default function Preferences() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, user, getGroup, savePreferences } = useStore();
  const router = useRouter();
  const palette = usePalette();

  const group = getGroup(id);
  const existing = group?.members.find((m) => m.userId === user?.id)?.prefs;

  const [budget, setBudget] = useState(existing ? String(existing.budget) : '');
  const [destinationIds, setDestinationIds] = useState<string[]>(existing?.destinationIds ?? []);
  const [ranges, setRanges] = useState<DateRange[]>(existing?.dateRanges ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && !user) return <Redirect href="/" />;
  if (loading) return <Screen scroll={false}>{null}</Screen>;
  if (!group || !user) return <Redirect href="/home" />;

  const toggleDestination = (destId: string) => {
    setDestinationIds((prev) =>
      prev.includes(destId) ? prev.filter((d) => d !== destId) : [...prev, destId]
    );
  };

  const addRange = (range: DateRange) => {
    setError(null);
    // Skip exact duplicates so tapping twice doesn't stack the same window.
    setRanges((prev) =>
      prev.some((r) => r.start === range.start && r.end === range.end) ? prev : [...prev, range]
    );
  };

  const removeRange = (index: number) => {
    setRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setError(null);
    const budgetNum = Number(budget.replace(/[^0-9.]/g, ''));
    if (!budgetNum || budgetNum <= 0) {
      setError('Enter your total trip budget (per person, in USD).');
      return;
    }
    if (ranges.length === 0) {
      setError('Add at least one window of dates when you can travel.');
      return;
    }
    setBusy(true);
    const result = await savePreferences(group.id, {
      budget: Math.round(budgetNum),
      destinationIds,
      dateRanges: ranges,
    });
    if (result.ok) {
      router.back();
    } else {
      setBusy(false);
      setError(result.error);
    }
  };

  return (
    <Screen>
      <Text
        onPress={() => router.back()}
        style={{ color: palette.textSecondary, fontWeight: '600', marginBottom: Spacing.two }}>
        ‹ {group.name}
      </Text>
      <Title>My preferences</Title>
      <Subtitle>These are combined with everyone else’s to build the group itinerary.</Subtitle>
      <Gap size={24} />

      <SectionTitle>💵 Budget</SectionTitle>
      <Field
        label="Total budget per person (USD)"
        placeholder="e.g. 1500"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <SectionTitle>📍 Preferred destinations</SectionTitle>
      <Body secondary>Pick any that excite you — the most-voted affordable spot wins.</Body>
      <Gap size={Spacing.two} />
      <Row style={{ flexWrap: 'wrap' }}>
        {DESTINATIONS.map((d) => (
          <Chip
            key={d.id}
            label={`${d.emoji} ${d.name}`}
            selected={destinationIds.includes(d.id)}
            onPress={() => toggleDestination(d.id)}
          />
        ))}
      </Row>
      <Gap />

      <SectionTitle>📅 Available dates</SectionTitle>
      <Body secondary>Tap a start and end day to add a window. More windows = better overlap.</Body>
      <Gap size={Spacing.two} />
      {ranges.map((r, i) => (
        <Card key={`${r.start}-${r.end}-${i}`}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>{prettyRange(r.start, r.end)}</Body>
            <Pressable onPress={() => removeRange(i)}>
              <Text style={{ color: Danger, fontWeight: '700' }}>Remove</Text>
            </Pressable>
          </Row>
        </Card>
      ))}
      <RangeCalendar onConfirm={addRange} />
      <Gap />

      {error ? (
        <>
          <Text style={{ color: Danger, fontWeight: '600' }}>{error}</Text>
          <Gap size={Spacing.two} />
        </>
      ) : null}
      <Button label="Save preferences" onPress={submit} loading={busy} />
    </Screen>
  );
}
