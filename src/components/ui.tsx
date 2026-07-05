import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const Accent = '#0E7C66';
export const AccentSoft = '#0E7C6622';
export const Danger = '#C33C3C';

export function usePalette() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[styles.inner, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five }]}>
      {children}
    </View>
  );
  if (!scroll) return <View style={[styles.screen, { backgroundColor: palette.background }]}>{inner}</View>;
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const palette = usePalette();
  return <Text style={[styles.title, { color: palette.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const palette = usePalette();
  return <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const palette = usePalette();
  return <Text style={[styles.sectionTitle, { color: palette.text }]}>{children}</Text>;
}

export function Body({ children, secondary }: { children: React.ReactNode; secondary?: boolean }) {
  const palette = usePalette();
  return (
    <Text style={[styles.body, { color: secondary ? palette.textSecondary : palette.text }]}>{children}</Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const palette = usePalette();
  return <View style={[styles.card, { backgroundColor: palette.backgroundElement }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const palette = usePalette();
  const background =
    variant === 'primary' ? Accent : variant === 'danger' ? Danger : palette.backgroundSelected;
  const color = variant === 'secondary' ? palette.text : '#ffffff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? AccentSoft : palette.backgroundElement,
          borderColor: selected ? Accent : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.chipLabel, { color: selected ? Accent : palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...inputProps
}: { label: string } & TextInputProps) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.textSecondary}
        {...inputProps}
        style={[
          styles.input,
          { backgroundColor: palette.backgroundElement, color: palette.text },
          inputProps.style,
        ]}
      />
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Gap({ size = Spacing.three }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: Spacing.one, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.two },
  body: { fontSize: 15, lineHeight: 21 },
  card: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.two },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: Spacing.two,
    marginBottom: Spacing.two,
  },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  field: { marginBottom: Spacing.three },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
