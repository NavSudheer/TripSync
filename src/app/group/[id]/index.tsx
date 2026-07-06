import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Share, Text, View } from 'react-native';

import {
  Accent,
  Body,
  Button,
  Card,
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
import { membersWithPrefs } from '@/lib/itinerary';
import { useStore } from '@/lib/store';

export default function GroupDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, user, getGroup, refreshGroup, generatePlan, leaveGroup } = useStore();
  const router = useRouter();
  const palette = usePalette();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Pull the latest group state (other members' prefs) from the server.
  useEffect(() => {
    if (id) void refreshGroup(id);
  }, [id, refreshGroup]);

  if (!loading && !user) return <Redirect href="/" />;
  const group = getGroup(id);

  if (loading || !group) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Accent} />
          <Gap />
          <Text
            onPress={() => router.replace('/home')}
            style={{ color: palette.textSecondary, fontWeight: '600' }}>
            ‹ Back to home
          </Text>
        </View>
      </Screen>
    );
  }
  if (!user) return <Redirect href="/" />;

  const ready = membersWithPrefs(group);
  const iAmReady = ready.some((m) => m.userId === user.id);

  const shareCode = async () => {
    const message = `Join my trip "${group.name}" on TripSync! Invite code: ${group.code}`;
    if (Platform.OS === 'web') {
      Alert.alert('Invite code', message);
    } else {
      await Share.share({ message });
    }
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    const result = await generatePlan(group.id);
    setBusy(false);
    if (result.ok) {
      router.push(`/group/${group.id}/itinerary`);
    } else {
      setError(result.error);
    }
  };

  const leave = async () => {
    await leaveGroup(group.id);
    router.replace('/home');
  };

  return (
    <Screen>
      <Text
        onPress={() => router.replace('/home')}
        style={{ color: palette.textSecondary, fontWeight: '600', marginBottom: Spacing.two }}>
        ‹ Home
      </Text>
      <Title>{group.name}</Title>
      <Subtitle>
        Invite code: <Text style={{ fontWeight: '800', color: Accent }}>{group.code}</Text>
      </Subtitle>
      <Gap size={Spacing.two} />
      <Button label="Share invite code" variant="secondary" onPress={shareCode} />
      <Gap />

      <SectionTitle>
        Members ({ready.length}/{group.members.length} ready)
      </SectionTitle>
      {group.members.map((m) => {
        const hasPrefs = ready.some((r) => r.userId === m.userId);
        return (
          <Card key={m.userId}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Body>
                  <Text style={{ fontWeight: '700' }}>
                    {m.name}
                    {m.userId === user.id ? ' (you)' : ''}
                  </Text>
                </Body>
                <Gap size={4} />
                <Body secondary>
                  {hasPrefs
                    ? `Budget $${m.prefs!.budget.toLocaleString()} · ${m.prefs!.destinationIds.length} destination pick${m.prefs!.destinationIds.length === 1 ? '' : 's'} · ${m.prefs!.dateRanges.length} date window${m.prefs!.dateRanges.length === 1 ? '' : 's'}`
                    : 'Preferences not submitted yet'}
                </Body>
              </View>
              <Text style={{ fontSize: 18 }}>{hasPrefs ? '✅' : '⏳'}</Text>
            </Row>
          </Card>
        );
      })}
      <Gap size={Spacing.two} />

      <Button
        label={iAmReady ? 'Edit my preferences' : 'Add my preferences'}
        onPress={() => router.push(`/group/${group.id}/preferences`)}
      />

      <Gap size={Spacing.four} />
      <SectionTitle>Itinerary</SectionTitle>
      {group.itinerary ? (
        <Card>
          <Body>
            <Text style={{ fontWeight: '700', fontSize: 17 }}>
              {group.itinerary.emoji} {group.itinerary.destinationName}, {group.itinerary.country}
            </Text>
          </Body>
          <Gap size={4} />
          <Body secondary>
            {group.itinerary.days.length} days · est. $
            {group.itinerary.estCostPerPerson.toLocaleString()} per person
          </Body>
          <Gap size={Spacing.two} />
          <Button label="View itinerary" onPress={() => router.push(`/group/${group.id}/itinerary`)} />
          <Button
            label="Regenerate with latest preferences"
            variant="secondary"
            onPress={generate}
            loading={busy}
          />
        </Card>
      ) : (
        <Card>
          <Body secondary>
            {ready.length === 0
              ? 'Waiting for members to add preferences. At least one member must submit before generating.'
              : `Ready when you are — the itinerary will use preferences from ${ready.length} member${ready.length === 1 ? '' : 's'}.`}
          </Body>
          <Gap size={Spacing.two} />
          <Button
            label="✨ Generate group itinerary"
            onPress={generate}
            disabled={ready.length === 0}
            loading={busy}
          />
        </Card>
      )}
      {error ? <Text style={{ color: Danger, fontWeight: '600' }}>{error}</Text> : null}

      <Gap size={Spacing.four} />
      <Button label="Leave group" variant="danger" onPress={leave} />
    </Screen>
  );
}
