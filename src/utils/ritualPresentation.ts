import {
  Accessibility,
  Droplets,
  Flame,
  HeartPulse,
  Leaf,
  MoonStar,
  Sparkles,
  SunMedium,
  Wind,
} from 'lucide-react';

export type RitualCardVariant = 'water' | 'breath' | 'stretch' | 'focus';
export type RitualIconPreset =
  | 'water'
  | 'breath'
  | 'stretch'
  | 'spark'
  | 'moon'
  | 'leaf'
  | 'sun'
  | 'heart'
  | 'flame';

export const ritualIconMap = {
  water: Droplets,
  breath: Wind,
  stretch: Accessibility,
  spark: Sparkles,
  moon: MoonStar,
  leaf: Leaf,
  sun: SunMedium,
  heart: HeartPulse,
  flame: Flame,
} as const;

const CARD_VARIANTS: RitualCardVariant[] = ['breath', 'stretch', 'focus', 'water'];

const KEYWORD_ICON_RULES: Array<{ match: RegExp; icon: RitualIconPreset }> = [
  { match: /water|drink|hydrate|tea|juice/i, icon: 'water' },
  { match: /breath|breathe|meditat|calm|mind/i, icon: 'breath' },
  { match: /stretch|yoga|move|mobility|walk/i, icon: 'stretch' },
  { match: /sleep|rest|night|evening/i, icon: 'moon' },
  { match: /sun|morning|wake|light/i, icon: 'sun' },
  { match: /heart|pulse|cardio|health/i, icon: 'heart' },
  { match: /garden|nature|plant|green/i, icon: 'leaf' },
  { match: /focus|work|study|read|deep/i, icon: 'spark' },
  { match: /heat|run|energy|fire/i, icon: 'flame' },
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickDeterministic<T>(items: T[], seed: string) {
  return items[hashString(seed) % items.length];
}

export function getMeaningfulIconPreset(title: string) {
  const matchingRule = KEYWORD_ICON_RULES.find((rule) => rule.match.test(title));

  if (matchingRule) {
    return matchingRule.icon;
  }

  return pickDeterministic(
    ['spark', 'leaf', 'sun', 'heart', 'moon', 'flame'] satisfies RitualIconPreset[],
    title || 'ritual',
  );
}

export function getRandomCardVariant(seed: string) {
  return pickDeterministic(CARD_VARIANTS, seed);
}
