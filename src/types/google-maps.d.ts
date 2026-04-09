declare namespace google.maps.places {
  class Autocomplete {
    constructor(
      input: HTMLInputElement,
      opts?: { types?: string[]; componentRestrictions?: { country: string } }
    );
    addListener(event: string, handler: () => void): void;
    getPlace(): {
      formatted_address?: string;
      name?: string;
      geometry?: { location: { lat(): number; lng(): number } };
    };
  }
}

interface Window {
  google?: {
    maps?: {
      places?: typeof google.maps.places;
    };
  };
}
