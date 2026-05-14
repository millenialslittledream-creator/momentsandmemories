/**
 * Studio settings — stored in localStorage on the admin's browser only.
 * Never sent to the server.
 */

export type LLMProvider = 'none' | 'paste' | 'anthropic' | 'ollama';

export interface StudioSettings {
  llm_provider: LLMProvider;
  anthropic_api_key: string;
  ollama_url: string;
}

const KEY = '_studio_settings';

const DEFAULTS: StudioSettings = {
  llm_provider: 'none',
  anthropic_api_key: '',
  ollama_url: 'http://localhost:11434',
};

export function loadSettings(): StudioSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: StudioSettings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export const LLM_PROVIDER_INFO: Record<
  LLMProvider,
  { label: string; status: 'ready' | 'planned'; tagline: string }
> = {
  none: { label: 'Off', status: 'ready', tagline: 'No AI suggestions. Author manually.' },
  paste: {
    label: 'Paste workflow',
    status: 'ready',
    tagline: 'Opens claude.ai with a prompt; you paste the response back. Uses your subscription. Free.',
  },
  anthropic: {
    label: 'Anthropic API key',
    status: 'planned',
    tagline: 'Bring-your-own key, direct API call. ~$0.005 per template. Coming next turn.',
  },
  ollama: {
    label: 'Local Ollama',
    status: 'planned',
    tagline: 'Local vision model. Free, private, lower quality. Coming next turn.',
  },
};
