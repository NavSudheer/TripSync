import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Body, Button, Danger, Field, Gap, Screen, Subtitle, Title } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function CreateGroup() {
  const { createGroup } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const result = await createGroup(name);
    if (result.ok) {
      router.replace(`/group/${result.group.id}`);
    } else {
      setBusy(false);
      setError(result.error);
    }
  };

  return (
    <Screen>
      <Title>New group trip</Title>
      <Subtitle>Give the trip a name — you’ll get an invite code to share right after.</Subtitle>
      <Gap size={24} />
      <Field
        label="Trip name"
        placeholder="e.g. Squad Summer 2026"
        value={name}
        onChangeText={setName}
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
      <Button label="Create group" onPress={submit} disabled={!name.trim()} loading={busy} />
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
      <Gap />
      <Body secondary>
        Once created, every member adds their own budget, destination picks, and available dates.
        TripSync then builds one itinerary that works for everyone.
      </Body>
    </Screen>
  );
}
