// The six top-level steps of the create flow. `current` is 1-based:
//   1 Choose Event · 2 Choose Design · 3 Event Details · 4 Guests
//   5 Preview & Send · 6 Payment
const STEPS = ['Choose Event', 'Choose Design', 'Event Details', 'Guests', 'Preview & Send', 'Payment'];

// Warm beige/gold used for the progress line + completed steps, so the stepper
// picks up the beige accent the brand wants without changing the overall theme.
const BEIGE = '#c4a882';

interface FlowStepperProps {
  current: number;
  /** Optional cap on width so it stays centered in wide modals. */
  className?: string;
}

export default function FlowStepper({ current, className = '' }: FlowStepperProps) {
  return (
    <div className={`flex items-start justify-center w-full ${className}`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={label} className={`flex items-start ${isLast ? 'flex-shrink-0' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-[52px] md:w-[74px]">
              <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Pulsing ring — draws the eye to the step you're on. */}
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: BEIGE, opacity: 0.35 }}
                  />
                )}
                <div
                  className="relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors duration-500"
                  style={
                    done
                      ? { backgroundColor: BEIGE, borderColor: BEIGE, color: '#111914' }
                      : active
                      ? { borderColor: BEIGE, color: BEIGE, backgroundColor: 'rgba(196,168,130,0.15)' }
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
                    ? BEIGE
                    : done
                    ? 'rgba(178,195,177,0.7)'
                    : 'rgba(178,195,177,0.4)',
                }}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div className="h-px flex-1 min-w-[8px] mt-[9px] bg-white/15 overflow-hidden">
                {/* Filled portion animates its width as steps complete. */}
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{ width: done ? '100%' : '0%', backgroundColor: BEIGE }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
