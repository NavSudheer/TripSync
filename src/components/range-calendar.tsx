import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Accent, AccentSoft, Button, usePalette } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { monthLabel, monthMatrix, parseDate, prettyRange, todayISO } from '@/lib/dates';
import type { DateRange } from '@/types';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Inline calendar for picking a start→end date window. Tapping a day sets the
 * start (clearing any prior end); tapping a later day sets the end; tapping an
 * earlier day restarts the selection. Past dates are disabled.
 */
export function RangeCalendar({ onConfirm }: { onConfirm: (range: DateRange) => void }) {
  const palette = usePalette();
  const today = todayISO();

  const initial = parseDate(today)!;
  const [viewYear, setViewYear] = useState(initial.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getUTCMonth());
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const weeks = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const onPickDay = (iso: string) => {
    if (iso < today) return;
    if (!start || end) {
      setStart(iso);
      setEnd(null);
    } else if (iso < start) {
      setStart(iso);
    } else {
      setEnd(iso);
    }
  };

  const confirm = () => {
    if (start && end) {
      onConfirm({ start, end });
      setStart(null);
      setEnd(null);
    }
  };

  const inRange = (iso: string) => start && end && iso >= start && iso <= end;
  const isEndpoint = (iso: string) => iso === start || iso === end;

  return (
    <View style={[styles.wrap, { backgroundColor: palette.backgroundElement }]}>
      <View style={styles.header}>
        <Pressable onPress={() => goMonth(-1)} hitSlop={12} style={styles.nav}>
          <Text style={[styles.navText, { color: Accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: palette.text }]}>{monthLabel(viewYear, viewMonth)}</Text>
        <Pressable onPress={() => goMonth(1)} hitSlop={12} style={styles.nav}>
          <Text style={[styles.navText, { color: Accent }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_INITIALS.map((w, i) => (
          <Text key={i} style={[styles.weekday, { color: palette.textSecondary }]}>
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((cell) => {
            const disabled = cell.iso < today;
            const selected = isEndpoint(cell.iso);
            const within = inRange(cell.iso);
            return (
              <Pressable
                key={cell.iso}
                onPress={() => onPickDay(cell.iso)}
                disabled={disabled}
                style={[
                  styles.cell,
                  within ? { backgroundColor: AccentSoft } : null,
                  selected ? { backgroundColor: Accent } : null,
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    { color: cell.inMonth ? palette.text : palette.textSecondary },
                    disabled ? { color: palette.textSecondary, opacity: 0.35 } : null,
                    selected ? { color: '#ffffff', fontWeight: '800' } : null,
                    within && !selected ? { color: Accent, fontWeight: '700' } : null,
                  ]}>
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: start ? palette.text : palette.textSecondary }]}>
          {start && end
            ? prettyRange(start, end)
            : start
              ? 'Now pick the last day'
              : 'Pick your first available day'}
        </Text>
      </View>
      <Button label="＋ Add this window" variant="secondary" onPress={confirm} disabled={!start || !end} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  nav: { paddingHorizontal: Spacing.two },
  navText: { fontSize: 28, fontWeight: '700', lineHeight: 30 },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
  },
  cellText: { fontSize: 15 },
  footer: { alignItems: 'center', paddingVertical: Spacing.two },
  footerText: { fontSize: 14, fontWeight: '600' },
});
