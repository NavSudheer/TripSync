import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Body, Button, Field, Gap, Screen, Subtitle, Title } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function CreateGroup() {
  const { createGroup } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const group = await createGroup(name);
    router.replace(`/group/${group.id}`);
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
