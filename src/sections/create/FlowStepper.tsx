// The six top-level steps of the create flow. `current` is 1-based:
//   1 Choose Event · 2 Choose Design · 3 Event Details · 4 Guests
//   5 Preview & Send · 6 Payment
const STEPS = ['Choose Event', 'Choose Design', 'Event Details', 'Guests', 'Preview & Send', 'Payment'];

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
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors ${
                  done
                    ? 'bg-[#9cb092] border-[#9cb092] text-[#111914]'
                    : active
                    ? 'border-[#9cb092] text-[#9cb092] bg-[#9cb092]/10'
                    : 'border-white/20 text-[#b2c3b1]/45'
                }`}
              >
                {done ? <span className="material-icons text-[12px]">check</span> : n}
              </div>
              <span
                className={`font-display text-[7px] md:text-[8px] leading-tight text-center tracking-[0.08em] uppercase ${
                  active ? 'text-[#9cb092]' : done ? 'text-[#b2c3b1]/70' : 'text-[#b2c3b1]/40'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-px flex-1 min-w-[8px] mt-[9px] transition-colors ${
                  done ? 'bg-[#9cb092]/50' : 'bg-white/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
