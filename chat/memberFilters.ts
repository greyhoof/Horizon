import { Character, Channel } from './interfaces';
import { CharacterAnalysis } from '../learn/matcher';
import { Orientation } from '../learn/matcher-types';

export const genderOptions: string[] = [
  'Female',
  'Male',
  'Herm',
  'Shemale',
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
  'Cunt-boy': 4,
  Transgender: 5,
  'Male-Herm': 6,
  None: 7
};

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
  if (!genderFilters || genderFilters.length === 0) return members;
  return members.filter(m => {
    const g = m.character.gender || 'None';
    return genderFilters.indexOf(g) !== -1;
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
        const aVal = genderSort[a.character.gender || 'None'];
        const bVal = genderSort[b.character.gender || 'None'];
        if (aVal - bVal === 0) {
          return a.character.name.localeCompare(b.character.name);
        }
        return aVal - bVal;
      });
      break;
  }

  return sorted;
}

export function orientationToGenders(
  orientation: Orientation | null,
  ownGender: Character['gender'] | undefined,
  allowedGenders: string[] = genderOptions
): string[] {
  if (!orientation) return [];

  switch (orientation) {
    case Orientation.Straight:
      if (!ownGender || ownGender === 'None') return ['Male', 'Female'];
      if (ownGender === 'Male') return ['Female'];
      if (ownGender === 'Female') return ['Male'];
      return ['Male', 'Female'];

    case Orientation.Gay:
      if (!ownGender || ownGender === 'None') return ['Male', 'Female'];
      if (ownGender === 'Male') return ['Male'];
      if (ownGender === 'Female') return ['Female'];
      return ['Male', 'Female', 'Transgender', 'Herm', 'Shemale', 'Male-Herm'];

    case Orientation.Bisexual:
    case Orientation.Pansexual:
      return allowedGenders.slice();

    case Orientation.BiMalePreference:
      return ['Male', 'Male-Herm'];
    case Orientation.BiFemalePreference:
      return ['Female', 'Herm', 'Shemale'];
    case Orientation.Asexual:
    case Orientation.Unsure:
    case Orientation.BiCurious:
      return [];
    default:
      return [];
  }
}

export function computeAutoGenders(
  profileCharacter: Character | undefined,
  ownCharacter: Character | undefined,
  allowedGenders: string[] = genderOptions
): string[] {
  if (!profileCharacter) return [];
  try {
    const analysis = new CharacterAnalysis(profileCharacter as any);
    const orientationVal: Orientation | null =
      analysis.orientation as Orientation | null;
    const genders = orientationToGenders(
      orientationVal,
      ownCharacter ? ownCharacter.gender : undefined,
      allowedGenders
    ).filter(g => allowedGenders.indexOf(g) !== -1);
    return genders && genders.length > 0 ? genders.slice() : [];
  } catch (e) {
    return [];
  }
}
