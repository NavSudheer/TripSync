import { DESTINATIONS, getDestination } from '@/data/destinations';
import { addDays, formatDate, parseDate } from '@/lib/dates';
import type {
  Activity,
  DateRange,
  Destination,
  DestinationCandidate,
  Group,
  Itinerary,
  ItineraryDay,
  ItineraryItem,
  Member,
  MemberPreferences,
} from '@/types';

export const MIN_TRIP_DAYS = 2;
export const MAX_TRIP_DAYS = 7;

export type GenerationResult =
  | { ok: true; itinerary: Itinerary }
  | { ok: false; error: string };

type Window = { start: Date; days: number };

/**
 * Finds the longest stretch of consecutive days on which every member is
 * available, scanning day by day across the union of all submitted ranges.
 */
export function findCommonWindow(members: MemberPreferences[]): Window | null {
  if (members.length === 0) return null;

  const memberRanges: { start: Date; end: Date }[][] = [];
  let horizonStart: Date | null = null;
  let horizonEnd: Date | null = null;

  for (const prefs of members) {
    const parsed: { start: Date; end: Date }[] = [];
    for (const r of prefs.dateRanges) {
      const s = parseDate(r.start);
      const e = parseDate(r.end);
      if (!s || !e || s.getTime() > e.getTime()) continue;
      parsed.push({ start: s, end: e });
      if (!horizonStart || s < horizonStart) horizonStart = s;
      if (!horizonEnd || e > horizonEnd) horizonEnd = e;
    }
    if (parsed.length === 0) return null; // a member with no valid ranges blocks everything
    memberRanges.push(parsed);
  }
  if (!horizonStart || !horizonEnd) return null;

  let best: Window | null = null;
  let runStart: Date | null = null;
  let runLength = 0;

  for (let d = horizonStart; d.getTime() <= horizonEnd.getTime(); d = addDays(d, 1)) {
    const everyoneFree = memberRanges.every((ranges) =>
      ranges.some((r) => d.getTime() >= r.start.getTime() && d.getTime() <= r.end.getTime())
    );
    if (everyoneFree) {
      if (!runStart) {
        runStart = d;
        runLength = 1;
      } else {
        runLength += 1;
      }
      if (!best || runLength > best.days) {
        best = { start: runStart, days: runLength };
      }
    } else {
      runStart = null;
      runLength = 0;
    }
  }
  return best;
}

function estimateCost(dest: Destination, days: number): number {
  return dest.flightEstimate + dest.costPerDay * days;
}

/**
 * Picks the trip length for a destination: start from the full overlap
 * (capped at MAX_TRIP_DAYS) and shorten until the trip fits the budget,
 * never dropping below MIN_TRIP_DAYS.
 */
function feasibleDays(dest: Destination, windowDays: number, budget: number): number {
  let days = Math.min(windowDays, MAX_TRIP_DAYS);
  while (days > MIN_TRIP_DAYS && estimateCost(dest, days) > budget) {
    days -= 1;
  }
  return days;
}

function scoreDestinations(
  prefsList: MemberPreferences[],
  window: Window,
  budget: number
): DestinationCandidate[] {
  const tripMonth = window.start.getUTCMonth() + 1;

  const candidates = DESTINATIONS.map((dest) => {
    const votes = prefsList.filter((p) => p.destinationIds.includes(dest.id)).length;
    const days = feasibleDays(dest, window.days, budget);
    const estCostPerPerson = estimateCost(dest, days);
    const fitsBudget = estCostPerPerson <= budget;
    const inSeason = dest.bestMonths.includes(tripMonth);

    let score = votes * 10;
    if (fitsBudget) score += 6;
    if (inSeason) score += 3;
    // Cheaper trips edge out ties so the group keeps headroom.
    score += Math.max(0, 2 - estCostPerPerson / Math.max(budget, 1));

    return {
      destinationId: dest.id,
      name: dest.name,
      emoji: dest.emoji,
      votes,
      estCostPerPerson,
      fitsBudget,
      inSeason,
      score: Math.round(score * 100) / 100,
    };
  });

  return candidates.sort(
    (a, b) => b.score - a.score || a.estCostPerPerson - b.estCostPerPerson
  );
}

function pickActivity(pool: Activity[], slot: ItineraryItem['slot'], used: Set<Activity>): Activity | null {
  const bySlot = pool.filter((a) => !used.has(a) && a.slot === slot);
  const fallback = pool.filter((a) => !used.has(a) && a.slot === 'any');
  const pick = bySlot[0] ?? fallback[0] ?? null;
  if (pick) used.add(pick);
  return pick;
}

function buildDays(dest: Destination, start: Date, days: number): ItineraryDay[] {
  const used = new Set<Activity>();
  const result: ItineraryDay[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = formatDate(addDays(start, i));
    const items: ItineraryItem[] = [];
    const isFirst = i === 0;
    const isLast = i === days - 1;

    if (isFirst) {
      items.push({
        slot: 'morning',
        title: 'Arrival & check-in',
        description: `Land in ${dest.name}, settle into your stay, and get your bearings.`,
        cost: 0,
      });
    } else {
      const morning = pickActivity(dest.activities, 'morning', used);
      if (morning) items.push({ slot: 'morning', title: morning.title, description: morning.description, cost: morning.cost });
    }

    if (isLast && days > 1) {
      const brunch = pickActivity(dest.activities, 'afternoon', used);
      if (brunch) items.push({ slot: 'afternoon', title: brunch.title, description: brunch.description, cost: brunch.cost });
      items.push({
        slot: 'evening',
        title: 'Pack up & departure',
        description: 'Last souvenirs, then head to the airport together.',
        cost: 0,
      });
    } else {
      const afternoon = pickActivity(dest.activities, 'afternoon', used);
      if (afternoon) items.push({ slot: 'afternoon', title: afternoon.title, description: afternoon.description, cost: afternoon.cost });
      const evening = pickActivity(dest.activities, 'evening', used);
      if (evening) items.push({ slot: 'evening', title: evening.title, description: evening.description, cost: evening.cost });
    }

    result.push({
      date,
      label: isFirst ? 'Day 1 · Arrival' : isLast ? `Day ${i + 1} · Departure` : `Day ${i + 1}`,
      items,
    });
  }
  return result;
}

/** Members who have filled in prefs; the itinerary is built from these. */
export function membersWithPrefs(group: Group): Member[] {
  return group.members.filter(
    (m): m is Member & { prefs: MemberPreferences } =>
      !!m.prefs && m.prefs.dateRanges.length > 0 && m.prefs.budget > 0
  );
}

export function generateItinerary(group: Group, forceDestinationId?: string): GenerationResult {
  const ready = membersWithPrefs(group);
  if (ready.length === 0) {
    return { ok: false, error: 'No one has submitted preferences yet.' };
  }
  const prefsList = ready.map((m) => m.prefs!);

  const window = findCommonWindow(prefsList);
  if (!window) {
    return {
      ok: false,
      error: 'No dates work for everyone. Ask members to widen their available dates.',
    };
  }
  if (window.days < MIN_TRIP_DAYS) {
    return {
      ok: false,
      error: `Everyone is only free together for ${window.days} day. At least ${MIN_TRIP_DAYS} overlapping days are needed.`,
    };
  }

  const budget = Math.min(...prefsList.map((p) => p.budget));
  const candidates = scoreDestinations(prefsList, window, budget);

  const chosen = forceDestinationId
    ? candidates.find((c) => c.destinationId === forceDestinationId)
    : candidates[0];
  if (!chosen) return { ok: false, error: 'Destination not found.' };

  const dest = getDestination(chosen.destinationId)!;
  const days = feasibleDays(dest, window.days, budget);
  const startDate = formatDate(window.start);
  const endDate = formatDate(addDays(window.start, days - 1));

  const notes: string[] = [
    `Trip budget is $${budget.toLocaleString()} per person — set by the lowest member budget so nobody is priced out.`,
    `Dates come from the longest stretch when all ${ready.length} member${ready.length === 1 ? '' : 's'} are free (${window.days} day${window.days === 1 ? '' : 's'} of overlap).`,
  ];
  if (chosen.votes > 0) {
    notes.push(`${dest.name} got ${chosen.votes} vote${chosen.votes === 1 ? '' : 's'} from the group.`);
  }
  if (!chosen.fitsBudget) {
    notes.push(
      `Heads up: even the shortest trip to ${dest.name} runs about $${chosen.estCostPerPerson.toLocaleString()} per person, over the group budget.`
    );
  }
  if (days < Math.min(window.days, MAX_TRIP_DAYS)) {
    notes.push(`Trimmed to ${days} days so the trip stays within budget.`);
  }
  if (ready.length < group.members.length) {
    notes.push(
      `${group.members.length - ready.length} member(s) haven’t submitted preferences and aren’t factored in yet.`
    );
  }

  return {
    ok: true,
    itinerary: {
      destinationId: dest.id,
      destinationName: dest.name,
      country: dest.country,
      emoji: dest.emoji,
      startDate,
      endDate,
      days: buildDays(dest, window.start, days),
      estCostPerPerson: estimateCost(dest, days),
      groupBudgetPerPerson: budget,
      notes,
      candidates: candidates.slice(0, 5),
      generatedAt: new Date().toISOString(),
    },
  };
}
