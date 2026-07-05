export type User = {
  id: string;
  name: string;
};

/** Inclusive date range, both ends formatted YYYY-MM-DD. */
export type DateRange = {
  start: string;
  end: string;
};

export type MemberPreferences = {
  /** Total budget for the whole trip, per person, in USD. */
  budget: number;
  /** Destination ids the member voted for. */
  destinationIds: string[];
  /** Windows when the member is free to travel. */
  dateRanges: DateRange[];
};

export type Member = {
  userId: string;
  name: string;
  prefs?: MemberPreferences;
};

export type ActivitySlot = 'morning' | 'afternoon' | 'evening';

export type Activity = {
  title: string;
  description: string;
  slot: ActivitySlot | 'any';
  /** Approximate cost per person in USD. */
  cost: number;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  emoji: string;
  tags: string[];
  /** Lodging + food + local transport per person per day, USD. */
  costPerDay: number;
  /** Rough round-trip flight estimate per person, USD. */
  flightEstimate: number;
  /** Months (1-12) when the destination is at its best. */
  bestMonths: number[];
  activities: Activity[];
};

export type ItineraryItem = {
  slot: ActivitySlot;
  title: string;
  description: string;
  cost: number;
};

export type ItineraryDay = {
  date: string;
  label: string;
  items: ItineraryItem[];
};

export type DestinationCandidate = {
  destinationId: string;
  name: string;
  emoji: string;
  votes: number;
  estCostPerPerson: number;
  fitsBudget: boolean;
  inSeason: boolean;
  score: number;
};

export type Itinerary = {
  destinationId: string;
  destinationName: string;
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
  estCostPerPerson: number;
  groupBudgetPerPerson: number;
  notes: string[];
  candidates: DestinationCandidate[];
  generatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  /** Short invite code other travellers use to join. */
  code: string;
  createdBy: string;
  createdAt: string;
  members: Member[];
  itinerary?: Itinerary;
};
