import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Body, Button, Danger, Field, Gap, Screen, Subtitle, Title } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function JoinGroup() {
  const { joinGroup } = useStore();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const result = await joinGroup(code);
    setBusy(false);
    if (result.ok) {
      router.replace(`/group/${result.group.id}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <Screen>
      <Title>Join a group</Title>
      <Subtitle>
        Travelling solo or invited by a friend? Enter the 6-character invite code from the group’s
        organizer.
      </Subtitle>
      <Gap size={24} />
      <Field
        label="Invite code"
        placeholder="e.g. K7PQ2M"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {error ? (
        <>
          <Text style={{ color: Danger, fontWeight: '600' }}>{error}</Text>
          <Gap size={8} />
        </>
      ) : null}
      <Button label="Join group" onPress={submit} disabled={code.trim().length < 6} loading={busy} />
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
      <Gap />
      <Body secondary>
        After joining, add your budget, destination picks, and dates — the group itinerary takes
        your preferences into account too.
      </Body>
    </Screen>
  );
}
