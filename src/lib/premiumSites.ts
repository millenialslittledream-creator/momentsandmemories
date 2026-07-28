import type { ComponentType } from 'react';
import { designById as weddingDesignById } from '@/components/WebsiteTemplates/designs';
import { themeById as weddingThemeById } from '@/components/WebsiteTemplates/themes';
import { birthdayDesignById, type BirthdayDesignId } from '@/components/BirthdayTemplates/designs';
import { birthdayThemeById } from '@/components/BirthdayTemplates/birthdayThemes';
import { eventTemplate, type EventKey } from '@/components/EventTemplates/registry';

export interface ResolvedPremiumSite {
  // The three families have different content prop types (InviteContent /
  // BirthdayContent); the caller feeds the stored content JSON, so the design
  // component is intentionally loosely typed here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
}

/**
 * Resolve a stored premium site (event family + design + theme) back into the
 * React design component and theme object needed to render it. Used by the
 * public /site/:slug page. `event_key` is 'marriage', 'birthday', or an
 * EventKey (babyshower / bridetobe / genderreveal / housewarming / custom).
 * Throws if the family/ids can't be resolved.
 */
export function resolvePremiumSite(eventKey: string, designId: string, themeId: string): ResolvedPremiumSite {
  if (eventKey === 'marriage') {
    return { Component: weddingDesignById(designId).Component, theme: weddingThemeById(themeId) };
  }
  if (eventKey === 'birthday') {
    return {
      Component: birthdayDesignById(designId as BirthdayDesignId).Component,
      theme: birthdayThemeById(themeId),
    };
  }
  const def = eventTemplate(eventKey as EventKey);
  if (!def) throw new Error(`Unknown premium event key: ${eventKey}`);
  const design = def.designs.find((d) => d.id === designId) ?? def.designs[0];
  const theme = def.themes.find((t) => t.id === themeId) ?? def.themes[0];
  return { Component: design.Component, theme };
}
