import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const TIMEZONE_OPTIONS = ['PT', 'MT', 'CT', 'ET', 'AKT', 'HAT', 'AST', 'SST', 'ChST', 'IST'];

interface DateTimePickerProps {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM" (24h)
  timezone: string;
  onChange: (next: { date?: string; time?: string; timezone?: string }) => void;
  required?: boolean;
  compact?: boolean;
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
 * One unified picker for date + time + timezone. Pops a calendar (left)
 * and a scrollable time list (right), with a timezone selector pinned
 * at the bottom — matching the requested design.
 */
export default function DateTimePicker({
  date,
  time,
  timezone,
  onChange,
  required,
  compact,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="w-full h-9 px-2.5 bg-white/[0.06] border border-white/15 hover:border-[#9cb092]/60 transition-colors text-left rounded-sm flex items-center gap-1.5"
          >
            <span className="material-icons text-[#9cb092] flex-shrink-0" style={{ fontSize: '13px' }}>
              calendar_today
            </span>
            <span className={`font-display text-[11px] truncate flex-1 ${date ? 'text-[#e4eee1]' : 'text-[#b2c3b1]/40'}`}>
              {compactSummary}
            </span>
          </button>
        ) : (
          <button type="button" className="w-full px-3 py-3 bg-white/[0.06] border border-white/15 hover:border-[#9cb092]/60 transition-colors text-left rounded-sm">
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
        )}
      </PopoverTrigger>

      <PopoverContent
        align="center"
        className="w-auto p-0 bg-[#1a2418] border-white/15 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex">
          {/* Calendar */}
          <div className="p-1">
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
          <div className="border-l border-white/10 w-[120px] flex flex-col">
            <p className="px-3 py-2 font-display text-[10px] tracking-[0.18em] uppercase text-[#9cb092]/70 border-b border-white/10 flex-shrink-0">
              Start Time
            </p>
            <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-subtle max-h-[260px]">
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

        {/* Timezone footer */}
        <div className="border-t border-white/10 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-icons text-[#9cb092] text-base">public</span>
            <p className="font-display text-[11px] text-[#e4eee1] truncate">
              Timezone:
              <span className="text-[#9cb092] font-semibold ml-1">
                {timezone || 'not set'}
              </span>
            </p>
          </div>
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className="bg-white/[0.06] border border-white/15 text-[#e4eee1] font-display text-xs h-7 rounded-sm pl-2 pr-6 appearance-none cursor-pointer outline-none hover:border-[#9cb092]/60 transition-colors"
            >
              <option value="" className="bg-[#1a2418]">
                Change
              </option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz} className="bg-[#1a2418]">
                  {tz}
                </option>
              ))}
            </select>
            <span
              className="material-icons absolute right-1 top-1/2 -translate-y-1/2 text-[#9cb092] pointer-events-none"
              style={{ fontSize: '14px' }}
            >
              expand_more
            </span>
          </div>
        </div>

        <div className="px-3 pb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-display text-[10px] tracking-[0.2em] uppercase px-4 py-1.5 bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] transition-colors font-bold"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
