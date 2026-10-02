// The seven top-level steps of the create flow. `current` is 1-based:
//   1 Choose Event · 2 Choose Design · 3 Event Details · 4 Share
//   5 Guests · 6 Preview & Send · 7 Payment
const STEPS = ['Choose Event', 'Choose Design', 'Event Details', 'Share', 'Guests', 'Preview & Send', 'Payment'];

// Warm beige/gold used for the progress line + completed steps, so the stepper
// picks up the beige accent the brand wants without changing the overall theme.
const BEIGE = '#c4a882';

interface FlowStepperProps {
  current: number;
  /** Light is used on the homepage bokeh background; dark is for editor modals. */
  tone?: 'dark' | 'light';
  /** Optional cap on width so it stays centered in wide modals. */
  className?: string;
}

export default function FlowStepper({ current, tone = 'dark', className = '' }: FlowStepperProps) {
  const isLight = tone === 'light';
  const accent = isLight ? '#5f7256' : BEIGE;
  return (
    <div className={`flex items-start justify-center w-full ${className}`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={label} className={`flex items-start ${isLast ? 'flex-shrink-0' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-[44px] md:w-[74px]">
              <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Pulsing ring — draws the eye to the step you're on. */}
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: accent, opacity: 0.35 }}
                  />
                )}
                <div
                  className="relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors duration-500"
                  style={
                    done
                      ? { backgroundColor: accent, borderColor: accent, color: isLight ? '#f7f2e8' : '#111914' }
                      : active
                      ? {
                          borderColor: accent,
                          color: accent,
                          backgroundColor: isLight ? 'rgba(95,114,86,0.12)' : 'rgba(196,168,130,0.15)',
                        }
                      : isLight
                      ? { borderColor: 'rgba(42,51,40,0.25)', color: 'rgba(42,51,40,0.48)' }
                      : { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(178,195,177,0.45)' }
                  }
                >
                  {done ? <span className="material-icons text-[12px]">check</span> : n}
                </div>
              </div>
              <span
                className="font-display text-[7px] md:text-[8px] leading-tight text-center tracking-[0.08em] uppercase transition-colors duration-500"
                style={{
                  color: active
                    ? accent
                    : done
                    ? isLight ? 'rgba(42,51,40,0.72)' : 'rgba(178,195,177,0.7)'
                    : isLight ? 'rgba(42,51,40,0.48)' : 'rgba(178,195,177,0.4)',
                }}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className="h-px flex-1 min-w-[2px] md:min-w-[8px] mt-[9px] overflow-hidden"
                style={{ backgroundColor: isLight ? 'rgba(42,51,40,0.18)' : 'rgba(255,255,255,0.15)' }}
              >
                {/* Filled portion animates its width as steps complete. */}
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{ width: done ? '100%' : '0%', backgroundColor: accent }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
