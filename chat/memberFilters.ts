import { Channel } from './interfaces';
import { CharacterAnalysis, Matcher } from '../learn/matcher';
import { Gender, Scoring } from '../learn/matcher-types';

export const genderOptions: string[] = [
  'Female',
  'Male',
  'Herm',
  'Shemale',
  'Cunt-Boy',
  'Transgender',
  'Male-Herm',
  'None'
];

export const statusSort: { [key: string]: number } = {
  crown: 0,
  looking: 1,
  online: 2,
  idle: 3,
  away: 4,
  busy: 5,
  dnd: 6,
  offline: 7
};

export const genderSort: { [key: string]: number } = {
  Female: 0,
  Male: 1,
  Herm: 2,
  Shemale: 3,
  'Cunt-Boy': 4,
  Transgender: 5,
  'Male-Herm': 6,
  None: 7
};

function normalizeLabel(s: string | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const canonicalGenderByNormalized: { [key: string]: string } = {};
Object.keys(genderSort).forEach(k => {
  canonicalGenderByNormalized[normalizeLabel(k)] = k;
});

function displayNameForGender(genderValue: number): string {
  const name = Gender[genderValue as any] as string;
  if (!name) return 'None';
  switch (name) {
    case 'MaleHerm':
      return 'Male-Herm';
    case 'Cuntboy':
      return 'Cunt-Boy';
    default:
      return name;
  }
}

export function computeGenderPreferenceBuckets(profile: CharacterAnalysis): {
  match: string[];
  weakMatch: string[];
  neutral: string[];
  weakMismatch: string[];
  mismatch: string[];
} {
  const matches: string[] = [];
  const weakMatches: string[] = [];
  const weakMismatches: string[] = [];
  const mismatches: string[] = [];
  const neutral: string[] = [];

  const c = profile.character as any;

  Object.values(Gender)
    .filter(v => typeof v === 'number')
    .forEach(gv => {
      let score: Scoring = Scoring.NEUTRAL;
      const kinkPref = Matcher.getKinkGenderPreference(c, gv as Gender);
      if (kinkPref === null) {
        score = Matcher.scoreOrientationByGender(
          profile.gender,
          profile.orientation,
          gv as Gender
        ).score;
      } else {
        score = Matcher.formatKinkScore(kinkPref, gv.toString()).score;
      }

      const display = displayNameForGender(gv as number);
      switch (score) {
        case Scoring.MATCH:
          matches.push(display);
          break;
        case Scoring.WEAK_MATCH:
          weakMatches.push(display);
          break;
        case Scoring.NEUTRAL:
          neutral.push(display);
          break;
        case Scoring.WEAK_MISMATCH:
          weakMismatches.push(display);
          break;
        case Scoring.MISMATCH:
          mismatches.push(display);
          break;
      }
    });

  return {
    match: matches,
    weakMatch: weakMatches,
    neutral,
    weakMismatch: weakMismatches,
    mismatch: mismatches
  };
}

export type AvailableSort = 'normal' | 'status' | 'gender';

export function filterByName(
  members: ReadonlyArray<Channel.Member>,
  filterText: string
): ReadonlyArray<Channel.Member> {
  if (!filterText || filterText.length === 0) return members;
  const filter = new RegExp(filterText.replace(/[^\w]/gi, '\\$&'), 'i');
  return members.filter(member => filter.test(member.character.name));
}

export function filterByGender(
  members: ReadonlyArray<Channel.Member>,
  genderFilters: string[] | undefined
): ReadonlyArray<Channel.Member> {
  if (!genderFilters) return members;
  const effective = genderFilters
    .map(g => (typeof g === 'string' ? g.trim() : ''))
    .filter(g => g.length > 0);

  if (effective.length === 0) return members;

  const normalizedSet = new Set(effective.map(g => normalizeLabel(g)));

  return members.filter(m => {
    const raw = m.character.gender || 'None';
    const cand = canonicalGenderByNormalized[normalizeLabel(raw)] || raw;
    return normalizedSet.has(normalizeLabel(cand));
  });
}

export function filterByStatus(
  members: ReadonlyArray<Channel.Member>,
  selectedStatuses: string[] | undefined
): ReadonlyArray<Channel.Member> {
  if (!selectedStatuses || selectedStatuses.length === 0) return members;
  return members.filter(
    m => selectedStatuses.indexOf(m.character.status) !== -1
  );
}

export function sortMembers(
  members: ReadonlyArray<Channel.Member>,
  sortType: AvailableSort
): ReadonlyArray<Channel.Member> {
  if (sortType === 'normal') return members;

  const sorted = [...members];
  switch (sortType) {
    case 'status':
      sorted.sort((a, b) => {
        const aVal = statusSort[a.character.status];
        const bVal = statusSort[b.character.status];
        if (aVal - bVal === 0) {
          return a.character.name.localeCompare(b.character.name);
        }
        return aVal - bVal;
      });
      break;

    case 'gender':
      sorted.sort((a, b) => {
        const aKey =
          canonicalGenderByNormalized[
            normalizeLabel(a.character.gender || 'None')
          ] ||
          a.character.gender ||
          'None';
        const bKey =
          canonicalGenderByNormalized[
            normalizeLabel(b.character.gender || 'None')
          ] ||
          b.character.gender ||
          'None';
        const aVal = genderSort[aKey];
        const bVal = genderSort[bKey];
        if (aVal - bVal === 0) {
          return a.character.name.localeCompare(b.character.name);
        }
        return aVal - bVal;
      });
      break;
  }

  return sorted;
}
