import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Accent, Body, Button, Field, Gap, Screen, Subtitle, Title } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function SignIn() {
  const { loading, user, signIn } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Accent} />
        </View>
      </Screen>
    );
  }

  if (user) return <Redirect href="/home" />;

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    await signIn(name);
    router.replace('/home');
  };

  return (
    <Screen>
      <Gap size={48} />
      <Title>🧳 TripSync</Title>
      <Subtitle>
        Plan a group vacation everyone actually agrees on. Pool your budgets, destinations, and
        free dates — get a curated itinerary back.
      </Subtitle>
      <Gap size={32} />
      <Field
        label="Your name"
        placeholder="e.g. Navneeth"
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Button label="Start planning" onPress={submit} disabled={!name.trim()} loading={submitting} />
      <Gap />
      <Body secondary>
        Travelling solo? Sign in and join an existing group with its invite code.
      </Body>
    </Screen>
  );
}
