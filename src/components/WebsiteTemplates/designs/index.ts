import type { ComponentType } from 'react';
import type { DesignProps } from '../inviteParts';
import TimelessDesign from './TimelessDesign';
import GrandDesign from './GrandDesign';
import EditorialDesign from './EditorialDesign';

export interface DesignDef {
  id: string;
  name: string;
  blurb: string;
  Component: ComponentType<DesignProps>;
}

export const DESIGNS: DesignDef[] = [
  { id: 'timeless', name: 'Timeless', blurb: 'Framed envelope invite', Component: TimelessDesign },
  { id: 'grand', name: 'Grand Royal', blurb: 'Full-bleed, door reveal', Component: GrandDesign },
  { id: 'editorial', name: 'Editorial', blurb: 'Modern & minimal', Component: EditorialDesign },
];

export function designById(id: string): DesignDef {
  return DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];
}
