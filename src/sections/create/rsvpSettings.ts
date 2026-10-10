export interface RSVPSettings {
  enabled: boolean;
  responseOptions: { yes: boolean; no: boolean; maybe: boolean };
  collectGuestCount: boolean;
  collectKidsCount: boolean;
  collectFoodPreference: boolean;
  foodOptions: string[];
  collectAdditionalInfo: boolean;
  childAgeCutoff: number;
}

export const ALL_FOOD_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Kids Meal'];

export const DEFAULT_RSVP_SETTINGS: RSVPSettings = {
  enabled: true,
  responseOptions: { yes: true, no: true, maybe: false },
  collectGuestCount: true,
  collectKidsCount: true,
  collectFoodPreference: true,
  foodOptions: [...ALL_FOOD_OPTIONS],
  collectAdditionalInfo: true,
  childAgeCutoff: 12,
};
