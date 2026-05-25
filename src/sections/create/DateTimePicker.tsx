import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

const TIMEZONE_OPTIONS = ['PT', 'MT', 'CT', 'ET', 'AKT', 'HAT', 'AST', 'SST', 'ChST', 'IST'];

interface DateTimePickerProps {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM" (24h)
  timezone: string;
  onChange: (next: { date?: string; time?: string; timezone?: string }) => void;
  required?: boolean;
  compact?: boolean;
  /** Smaller height for use inside table rows next to h-9 inputs. */
  size?: 'sm' | 'md';
}

const TIME_STEP_MIN = 15;

function format12h(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * One unified picker for date + time + timezone. Renders as a centered
 * modal so it's always fully visible regardless of where the trigger sits
 * on the page — no more bottom/top clipping.
 */
export default function DateTimePicker({
  date,
  time,
  timezone,
  onChange,
  required,
  compact,
  size = 'md',
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const isSm = size === 'sm';

  const selected = date ? new Date(date + 'T00:00:00') : undefined;

  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += TIME_STEP_MIN) {
        opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return opts;
  }, []);

  const summary = useMemo(() => {
    if (!date) return 'Pick a date & time';
    const dStr = format(new Date(date + 'T00:00:00'), 'EEE, MMM d, yyyy');
    const tStr = time ? format12h(time) : '';
    return `${dStr}${tStr ? ' · ' + tStr : ''}`;
  }, [date, time]);

  const compactSummary = useMemo(() => {
    if (!date) return 'Pick date & time';
    const dStr = format(new Date(date + 'T00:00:00'), 'MMM d, yyyy');
    const tStr = time ? format12h(time) : '';
    const tzStr = timezone ? ' ' + timezone : '';
    return `${dStr}${tStr ? ' · ' + tStr : ''}${tzStr}`;
  }, [date, time, timezone]);

  // Esc closes; lock body scroll while open so the modal feels modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const triggerButton = compact ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`w-full ${isSm ? 'h-9 px-2 gap-1.5' : 'h-12 px-4 gap-2'} bg-white/[0.06] border border-white/15 hover:border-[#9cb092]/60 focus:border-[#9cb092] transition-colors text-left rounded-sm flex items-center outline-none`}
    >
      <span className="material-icons text-[#9cb092] flex-shrink-0" style={{ fontSize: isSm ? '14px' : '16px' }}>
        calendar_today
      </span>
      <span className={`font-display ${isSm ? 'text-xs' : 'text-sm'} truncate flex-1 ${date ? 'text-[#e4eee1]' : 'text-[#b2c3b1]/40'}`}>
        {compactSummary}
      </span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full px-3 py-3 bg-white/[0.06] border border-white/15 hover:border-[#9cb092]/60 transition-colors text-left rounded-sm"
    >
      <p className="font-display text-[8px] tracking-[0.22em] uppercase text-[#9cb092] mb-1 flex items-center gap-1">
        <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
          calendar_today
        </span>
        Start
        {required && <span className="text-[#9cb092] ml-0.5">*</span>}
      </p>
      <p className={`font-display text-sm ${date ? 'text-[#e4eee1]' : 'text-[#b2c3b1]/40'}`}>
        {summary}
      </p>
      {timezone && (
        <p className="font-display text-[8px] tracking-[0.22em] uppercase text-[#b2c3b1]/55 mt-1">
          {timezone}
        </p>
      )}
    </button>
  );

  // Modal rendered in a portal so it's always positioned relative to the
  // viewport — never clipped by a parent's overflow or scroll.
  const modal =
    open &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(13, 21, 18, 0.78)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div
          className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#1a2418] border border-white/15 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all hover:border-[#9cb092]/40"
          >
            <span className="material-icons text-[#b2c3b1] text-[16px]">close</span>
          </button>

          <div
            data-lenis-prevent
            className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Calendar */}
              <div className="p-1 flex-shrink-0">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(d) => {
                    if (d) onChange({ date: format(d, 'yyyy-MM-dd') });
                  }}
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  className="bg-transparent text-[#e4eee1]"
                  classNames={{
                    day: 'text-[#e4eee1] hover:bg-[#9cb092]/20 rounded-md h-8 w-8 p-0 font-display text-sm aria-selected:bg-[#9cb092] aria-selected:text-[#111914]',
                    today: 'bg-[#9cb092]/10 text-[#9cb092] font-bold rounded-md',
                    month_caption:
                      'font-display text-[#e4eee1] text-sm flex items-center justify-center h-8',
                    weekday: 'text-[#b2c3b1]/50 font-display text-[10px] uppercase',
                    button_previous:
                      'text-[#b2c3b1] hover:text-[#9cb092] hover:bg-[#9cb092]/10 rounded-md h-8 w-8 p-0',
                    button_next:
                      'text-[#b2c3b1] hover:text-[#9cb092] hover:bg-[#9cb092]/10 rounded-md h-8 w-8 p-0',
                    outside: 'text-[#b2c3b1]/20',
                    disabled: 'text-[#b2c3b1]/15',
                  }}
                />
              </div>

              {/* Time list */}
              <div className="border-t sm:border-t-0 sm:border-l border-white/10 sm:w-[130px] flex flex-col">
                <p className="px-3 py-2 font-display text-[10px] tracking-[0.18em] uppercase text-[#9cb092]/70 border-b border-white/10 flex-shrink-0">
                  Start Time
                </p>
                <div className="flex-1 overflow-y-auto scrollbar-subtle max-h-[240px]">
                  {timeOptions.map((t) => {
                    const active = time === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onChange({ time: t })}
                        className={`block w-full text-center px-3 py-1.5 font-display text-[12px] transition-colors ${
                          active
                            ? 'bg-[#9cb092]/20 text-[#9cb092] font-semibold'
                            : 'text-[#e4eee1]/85 hover:bg-white/[0.04]'
                        }`}
                      >
                        {format12h(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timezone — inline chip strip */}
            <div className="border-t border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="material-icons text-[#9cb092] text-base">public</span>
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#b2c3b1]/70">
                  Timezone
                  {timezone && (
                    <span className="text-[#9cb092] font-semibold ml-1 normal-case tracking-normal">
                      · {timezone}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {TIMEZONE_OPTIONS.map((tz) => {
                  const active = timezone === tz;
                  return (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => onChange({ timezone: tz })}
                      className={`font-display text-[10px] tracking-[0.08em] px-2 py-1 rounded-sm border transition-colors ${
                        active
                          ? 'bg-[#9cb092] text-[#111914] border-[#9cb092] font-semibold'
                          : 'bg-white/[0.04] text-[#e4eee1]/80 border-white/10 hover:border-[#9cb092]/50 hover:text-[#9cb092]'
                      }`}
                    >
                      {tz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer pinned at the bottom of the modal */}
          <div className="flex-shrink-0 border-t border-white/10 px-3 py-2.5 flex justify-end bg-[#0e1712]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-display text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] transition-colors font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {triggerButton}
      {modal}
    </>
  );
}
