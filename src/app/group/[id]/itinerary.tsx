import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import {
  Accent,
  Body,
  Card,
  Chip,
  Danger,
  Gap,
  Row,
  Screen,
  SectionTitle,
  Subtitle,
  Title,
  usePalette,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { prettyDate, prettyRange } from '@/lib/dates';
import { useStore } from '@/lib/store';

const SLOT_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌙' } as const;

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, user, getGroup, generatePlan } = useStore();
  const router = useRouter();
  const palette = usePalette();
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  if (!loading && !user) return <Redirect href="/" />;
  const group = getGroup(id);
  if (loading || !group) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Accent} />
        </View>
      </Screen>
    );
  }
  if (!user) return <Redirect href="/" />;

  const itinerary = group.itinerary;
  if (!itinerary) return <Redirect href={`/group/${group.id}`} />;

  const switchDestination = async (destinationId: string) => {
    if (destinationId === itinerary.destinationId || switching) return;
    setError(null);
    setSwitching(true);
    const result = await generatePlan(group.id, destinationId);
    setSwitching(false);
    if (!result.ok) setError(result.error);
  };

  const overBudget = itinerary.estCostPerPerson > itinerary.groupBudgetPerPerson;

  return (
    <Screen>
      <Text
        onPress={() => router.replace(`/group/${group.id}`)}
        style={{ color: palette.textSecondary, fontWeight: '600', marginBottom: Spacing.two }}>
        ‹ {group.name}
      </Text>
      <Title>
        {itinerary.emoji} {itinerary.destinationName}
      </Title>
      <Subtitle>
        {itinerary.country} · {prettyRange(itinerary.startDate, itinerary.endDate)} ·{' '}
        {itinerary.days.length} days
      </Subtitle>
      <Gap size={Spacing.two} />

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body secondary>Estimated cost per person</Body>
          <Body>
            <Text style={{ fontWeight: '800', color: overBudget ? Danger : Accent }}>
              ${itinerary.estCostPerPerson.toLocaleString()}
            </Text>
          </Body>
        </Row>
        <Gap size={4} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Body secondary>Group budget per person</Body>
          <Body>${itinerary.groupBudgetPerPerson.toLocaleString()}</Body>
        </Row>
      </Card>

      <SectionTitle>Why this trip</SectionTitle>
      <Card>
        {itinerary.notes.map((note, i) => (
          <View key={i} style={{ marginBottom: i === itinerary.notes.length - 1 ? 0 : Spacing.two }}>
            <Body secondary>• {note}</Body>
          </View>
        ))}
      </Card>
      <Gap />

      <SectionTitle>Day by day</SectionTitle>
      {itinerary.days.map((day) => (
        <Card key={day.date}>
          <Body>
            <Text style={{ fontWeight: '700' }}>{day.label}</Text>
            <Text style={{ color: palette.textSecondary }}> · {prettyDate(day.date)}</Text>
          </Body>
          <Gap size={Spacing.two} />
          {day.items.map((item, i) => (
            <View key={i} style={{ marginBottom: i === day.items.length - 1 ? 0 : Spacing.three }}>
              <Body>
                {SLOT_ICONS[item.slot]}{' '}
                <Text style={{ fontWeight: '600' }}>{item.title}</Text>
                {item.cost > 0 ? (
                  <Text style={{ color: palette.textSecondary }}> · ${item.cost}/person</Text>
                ) : null}
              </Body>
              <Body secondary>{item.description}</Body>
            </View>
          ))}
        </Card>
      ))}
      <Gap />

      <SectionTitle>Other options for the group</SectionTitle>
      <Body secondary>Tap one to rebuild the itinerary around it.</Body>
      <Gap size={Spacing.two} />
      <Row style={{ flexWrap: 'wrap' }}>
        {itinerary.candidates.map((c) => (
          <Chip
            key={c.destinationId}
            label={`${c.emoji} ${c.name} · $${c.estCostPerPerson.toLocaleString()}${c.votes > 0 ? ` · ${c.votes}🗳` : ''}`}
            selected={c.destinationId === itinerary.destinationId}
            onPress={() => switchDestination(c.destinationId)}
          />
        ))}
      </Row>
      {error ? (
        <>
          <Gap size={Spacing.two} />
          <Text style={{ color: Danger, fontWeight: '600' }}>{error}</Text>
        </>
      ) : null}
    </Screen>
  );
}
