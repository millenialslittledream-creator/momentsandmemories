import { lazy } from 'react';

export const BIRTHDAY_DESIGNS = [
  {
    id:          'bash',
    name:        'The Bash',
    description: 'High-energy party card — polaroid gallery, giant age watermark, bright accents',
    Component:   lazy(() => import('./BashDesign')),
  },
  {
    id:          'soiree',
    name:        'The Soirée',
    description: 'Elegant full-bleed photo hero — doors reveal, bento gallery, muted luxury',
    Component:   lazy(() => import('./SoireeDesign')),
  },
  {
    id:          'milestone',
    name:        'The Milestone',
    description: 'Bold editorial — iris reveal, enormous age watermark, ruled event table',
    Component:   lazy(() => import('./MilestoneDesign')),
  },
] as const;

export type BirthdayDesignId = (typeof BIRTHDAY_DESIGNS)[number]['id'];

export function birthdayDesignById(id: BirthdayDesignId) {
  return BIRTHDAY_DESIGNS.find((d) => d.id === id) ?? BIRTHDAY_DESIGNS[0];
}
