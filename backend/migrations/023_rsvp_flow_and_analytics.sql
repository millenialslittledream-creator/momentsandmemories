-- Migration 023: Configurable RSVP flow + quantity-based meal analytics.
--
-- Existing events keep food collection disabled until the host explicitly
-- saves RSVP settings. This preserves compatibility with older invitations
-- that only collected one optional food preference.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "responseOptions": {"yes": true, "no": true, "maybe": true},
    "collectGuestCount": true,
    "collectKidsCount": true,
    "collectFoodPreference": false,
    "foodOptions": ["Vegetarian", "Non-Vegetarian", "Vegan", "Kids Meal"],
    "collectAdditionalInfo": true,
    "childAgeCutoff": 12
  }'::jsonb;

ALTER TABLE public.event_invitees
  ADD COLUMN IF NOT EXISTS meal_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.events.rsvp_config IS
  'Host-controlled guest RSVP fields, response options, meal choices, and child age cutoff.';

COMMENT ON COLUMN public.event_invitees.meal_preferences IS
  'Meal option to quantity map, e.g. {"Vegetarian": 2, "Kids Meal": 1}.';

