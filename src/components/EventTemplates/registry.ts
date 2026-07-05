import type { ComponentType } from 'react';
import type { DesignProps } from './eventParts';
import type { InviteTheme } from '../WebsiteTemplates/themes';
import type { InviteContent } from '../WebsiteTemplates/inviteContent';
import { EVENT_THEMES, type EventKey } from './eventThemes';
import { EVENT_CONTENT } from './eventContent';

import BabyCloudNine from './designs/BabyCloudNine';
import BabyLittleWonder from './designs/BabyLittleWonder';
import BabySweetPea from './designs/BabySweetPea';
import PartyLastFling from './designs/PartyLastFling';
import PartyBrideTribe from './designs/PartyBrideTribe';
import PartyChampagne from './designs/PartyChampagne';
import RevealBigReveal from './designs/RevealBigReveal';
import RevealTwinkle from './designs/RevealTwinkle';
import RevealBowOrBowtie from './designs/RevealBowOrBowtie';
import HouseNewNest from './designs/HouseNewNest';
import HouseOpenHouse from './designs/HouseOpenHouse';
import HouseHearth from './designs/HouseHearth';
import CustomCelebration from './designs/CustomCelebration';
import CustomMarquee from './designs/CustomMarquee';
import CustomSoiree from './designs/CustomSoiree';

export type { EventKey };

export interface EventDesignDef {
  id: string;
  name: string;
  blurb: string;
  ornament: string;             // glyph shown on the hub preview card
  preview: React.CSSProperties; // hub card background
  Component: ComponentType<DesignProps>;
}

export interface EventFieldLabels {
  primaryName: string;
  secondaryName?: string; // shown only if the event uses a second name
  monogram: string;
}

export interface EventTemplateDef {
  key: EventKey;
  label: string;
  icon: string;      // material-icons name
  accentColor: string;
  themes: InviteTheme[];
  defaultContent: InviteContent;
  fieldLabels: EventFieldLabels;
  designs: EventDesignDef[];
}

const g = (colorA: string, colorB: string): React.CSSProperties => ({ background: `linear-gradient(160deg, ${colorA} 0%, ${colorB} 100%)` });

export const EVENT_TEMPLATES: Record<EventKey, EventTemplateDef> = {
  babyshower: {
    key: 'babyshower', label: 'Baby Shower', icon: 'child_care', accentColor: '#9fc0dd',
    themes: EVENT_THEMES.babyshower, defaultContent: EVENT_CONTENT.babyshower,
    fieldLabels: { primaryName: 'Baby / Mama name', monogram: 'Seal emoji or initials' },
    designs: [
      { id: 'cloudnine', name: 'Cloud Nine', blurb: 'Dreamy drifting sky', ornament: '☁️', preview: g('#5b86b0', '#cfe3f4'), Component: BabyCloudNine },
      { id: 'littlewonder', name: 'Little Wonder', blurb: 'Storybook arch', ornament: '🧸', preview: g('#c9748c', '#f6d5dd'), Component: BabyLittleWonder },
      { id: 'sweetpea', name: 'Sweet Pea', blurb: 'Modern editorial', ornament: '🌸', preview: g('#2c2a1c', '#b79a4e'), Component: BabySweetPea },
    ],
  },
  bridetobe: {
    key: 'bridetobe', label: 'Pre-Wedding Party', icon: 'spa', accentColor: '#c25a74',
    themes: EVENT_THEMES.bridetobe, defaultContent: EVENT_CONTENT.bridetobe,
    fieldLabels: { primaryName: 'Bride-to-be name', monogram: 'Seal emoji or initials' },
    designs: [
      { id: 'lastfling', name: 'Last Fling', blurb: 'High-energy party', ornament: '🥂', preview: g('#7c3a4d', '#c25a74'), Component: PartyLastFling },
      { id: 'bridetribe', name: 'Bride Tribe', blurb: 'Chic & blush', ornament: '💐', preview: g('#c25a74', '#f4cdd5'), Component: PartyBrideTribe },
      { id: 'champagne', name: 'Champagne', blurb: 'Noir glam', ornament: '🍾', preview: g('#0c0c0f', '#caa24a'), Component: PartyChampagne },
    ],
  },
  genderreveal: {
    key: 'genderreveal', label: 'Gender Reveal', icon: 'auto_awesome', accentColor: '#6d6fb0',
    themes: EVENT_THEMES.genderreveal, defaultContent: EVENT_CONTENT.genderreveal,
    fieldLabels: { primaryName: 'Baby name / headline', monogram: 'Seal emoji or initials' },
    designs: [
      { id: 'bigreveal', name: 'The Big Reveal', blurb: 'Blue vs pink · vote', ornament: '🎈', preview: g('#3d7bd0', '#e06b9c'), Component: RevealBigReveal },
      { id: 'twinkle', name: 'Twinkle', blurb: 'Starry night', ornament: '⭐', preview: g('#181b2e', '#6d6fb0'), Component: RevealTwinkle },
      { id: 'bowbowtie', name: 'Bows or Bowties', blurb: 'Playful versus', ornament: '🎀', preview: g('#37162a', '#d15c8b'), Component: RevealBowOrBowtie },
    ],
  },
  housewarming: {
    key: 'housewarming', label: 'Housewarming', icon: 'home', accentColor: '#bf6a43',
    themes: EVENT_THEMES.housewarming, defaultContent: EVENT_CONTENT.housewarming,
    fieldLabels: { primaryName: 'Family / host name', monogram: 'Seal emoji or initials' },
    designs: [
      { id: 'newnest', name: 'New Nest', blurb: 'Warm & cozy', ornament: '🏡', preview: g('#743f2a', '#bf6a43'), Component: HouseNewNest },
      { id: 'openhouse', name: 'Open House', blurb: 'Modern architectural', ornament: '🔑', preview: g('#18241b', '#5c7148'), Component: HouseOpenHouse },
      { id: 'hearth', name: 'Hearth', blurb: 'Rustic & handcrafted', ornament: '🔥', preview: g('#111418', '#c2a25a'), Component: HouseHearth },
    ],
  },
  custom: {
    key: 'custom', label: 'Others', icon: 'stars', accentColor: '#b6863b',
    themes: EVENT_THEMES.custom, defaultContent: EVENT_CONTENT.custom,
    fieldLabels: { primaryName: 'Event / host name', monogram: 'Seal emoji or initials' },
    designs: [
      { id: 'celebration', name: 'Celebration', blurb: 'Timeless & universal', ornament: '✦', preview: g('#5e441f', '#d0a852'), Component: CustomCelebration },
      { id: 'marquee', name: 'Marquee', blurb: 'Bold editorial', ornament: '—', preview: g('#101216', '#9aa0a6'), Component: CustomMarquee },
      { id: 'soiree', name: 'Soirée', blurb: 'Refined botanical', ornament: '❦', preview: g('#243a2b', '#3f6b4c'), Component: CustomSoiree },
    ],
  },
};

export function eventTemplate(key: EventKey): EventTemplateDef {
  return EVENT_TEMPLATES[key];
}
