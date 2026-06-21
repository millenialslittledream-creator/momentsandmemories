export interface FramePreset {
  id: string;
  label: string;
}

export const FRAME_PRESETS: FramePreset[] = [
  { id: 'sage-hairline', label: 'Sage Hairline' },
  { id: 'ivory-double', label: 'Ivory Double Border' },
  { id: 'botanical-corner', label: 'Botanical Corner' },
];

const FRAME_PRESET_IDS = new Set(FRAME_PRESETS.map((preset) => preset.id));

export function isValidFrameId(frameId: string | undefined): frameId is string {
  return !!frameId && FRAME_PRESET_IDS.has(frameId);
}
