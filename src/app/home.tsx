import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Gap, Row, Screen, SectionTitle, Subtitle, Title, usePalette } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Home() {
  const { loading, user, myGroups, signOut, refresh } = useStore();
  const router = useRouter();
  const palette = usePalette();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!loading && !user) return <Redirect href="/" />;
  if (!user) return null;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Title>Hi, {user.name} 👋</Title>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}>
          <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </Row>
      <Subtitle>Your trips, all in one place.</Subtitle>
      <Gap />

      <Button label="＋ Create a group trip" onPress={() => router.push('/create-group')} />
      <Button
        label="Join a group with a code"
        variant="secondary"
        onPress={() => router.push('/join-group')}
      />
      <Gap size={Spacing.four} />

      <SectionTitle>My groups</SectionTitle>
      {myGroups.length === 0 ? (
        <Card>
          <Body secondary>
            No groups yet. Create one and share the invite code with your friends — or join a
            friend’s group with their code.
          </Body>
        </Card>
      ) : (
        myGroups.map((g) => (
          <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Body>
                    <Text style={{ fontWeight: '700', fontSize: 17 }}>{g.name}</Text>
                  </Body>
                  <Gap size={4} />
                  <Body secondary>
                    {g.members.length} member{g.members.length === 1 ? '' : 's'} · Code {g.code}
                    {g.itinerary ? ` · ${g.itinerary.emoji} ${g.itinerary.destinationName} planned` : ''}
                  </Body>
                </View>
                <Text style={{ color: palette.textSecondary, fontSize: 20 }}>›</Text>
              </Row>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
