// DEV-ONLY tuning preview for the baby-shower + birthday concept cards.
//   /__baby-preview                        → all baby-shower concepts stacked
//   /__baby-preview?set=bday               → all birthday concepts stacked
//   /__baby-preview?id=baby-c1             → one, large (id implies the set)
//   /__baby-preview?id=bday-c1&w=1600      → one, at an explicit pixel width
//   /__baby-preview?id=bday-c1&ruler=1     → one, with a coordinate ruler
//   /__baby-preview?id=bday-c1&bare=1      → JUST the card (#card), no chrome —
//                                            screenshot this at w=1600 to diff
//                                            it against the -blank.jpg pixel
//                                            for pixel.
import { eviteTemplates } from '@/data/eviteTemplates';
import TemplateRenderer from '@/components/TemplateRenderer';

// Base sample for the baby-shower concept cards — the data the designer
// printed on the filled `-preview.jpg` samples, so a screenshot of a concept
// can be diffed against its own preview one-to-one.
const SAMPLE: Record<string, string> = {
  eventDate: '2025-05-25',
  eventTime: '11:00',
  timezone: 'IST',
  venue: 'The Green Acres Farmhouse, 123 Green Lane, Gurugram, Haryana 122001',
  customMessage:
    'Tiny hands, tiny feet, A brand new miracle is on the way! Let’s shower love and blessings on the little one and the parents-to-be.',
};

// The concepts whose printed sample differs from the base.
const OVERRIDES: Record<string, Record<string, string>> = {
  'baby-c1': { venue: '5100 N Highland Ave, Los Angeles, CA' },
  'baby-c2': { venue: '5100 N Highland Ave, Los Angeles, CA' },
  'baby-c4': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001' },
  'baby-c7': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001' },
  'baby-c8': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001' },
  'baby-c10': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001' },
  'baby-c11': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001', eventDate: '2025-06-15', eventTime: '17:00' },
  'baby-c12': { venue: 'The Oak Clubhouse, 25, Green Meadows, Gurgaon, 122001', eventDate: '2026-02-15', eventTime: '17:00' },
  'baby-c13': {
    venue: 'The Oak Clubhouse 25, Green Meadows, Gurgaon, 122001',
    eventDate: '2025-06-15',
    eventTime: '17:00',
    customMessage: 'We can’t wait to celebrate this special moment with you!',
  },
};

// Birthday concepts (bday-c1 … bday-c12) — matches the "Saturday, 25 May
// 2024 · 6:00 PM Onwards / The Loft House…" sample printed on their own
// `-preview.jpg` cards, so a screenshot can be diffed against the target.
const BDAY_SAMPLE: Record<string, string> = {
  celebrantName: 'Arjun Mehta',
  eventDate: '2024-05-25',
  eventTime: '18:00',
  timezone: 'IST',
  venue: 'The Loft House, 27, 5th Floor, Oakwood Complex, Banjara Hills, Hyderabad – 500034',
  guestCount: '35',
  hostName: 'Priya & Rohan',
  customMessage: 'Come dance, eat cake, and celebrate another trip around the sun with us!',
};

// Pre-wedding concepts (pw-c1 … pw-c12) — a real Saturday so the baked
// "SATURDAY" label lines up with the dynamic weekday/day-number pieces.
const PW_SAMPLE: Record<string, string> = {
  brideName: 'Aishwarya Rao',
  groomName: 'Nikhil Verma',
  eventDate: '2026-03-21',
  eventTime: '18:00',
  timezone: 'IST',
  venue: 'The Willow House, 123 Oak Lane, London, SW1A 1AA',
  dressCode: 'Resort Chic',
  rsvpName: 'Arjun, +91 98765 43210',
};

// Wedding concepts (wed-c1 … wed-c12) — deliberately LONGER names than the
// concepts' own "Ananya Sharma & Arjun Mehta" sample, so any collision with
// baked connectors/dividers shows up immediately instead of only at render
// time with real (possibly longer) guest names.
const WED_SAMPLE: Record<string, string> = {
  brideName: 'Ishaani Bannerjee',
  groomName: 'Rudraksh Chattopadhyay',
  eventDate: '2027-02-14',
  eventTime: '18:30',
  timezone: 'IST',
  venue: 'The Grand Palace, Jaipur, Rajasthan',
  guestCount: '150',
  customMessage: 'We invite you to witness the beginning of our new chapter as we exchange promises and embark on a lifetime of togetherness.',
};

// Housewarming concepts (hw-c1 … hw-c10).
const HW_SAMPLE: Record<string, string> = {
  homeownerName: 'The Venkataraman Family',
  hostName: 'Priya & Anjali Venkataraman',
  eventDate: '2026-06-21',
  eventTime: '10:30',
  timezone: 'IST',
  venue: '18, Lotus Lane, Greenfields, Hyderabad - 500081',
  guestCount: '50',
  customMessage: 'Your presence will make our new home even more special.',
};

// Gender reveal concepts (gr-c1 ... gr-c10).
const GR_SAMPLE: Record<string, string> = {
  fatherName: 'Rudraksh',
  motherName: 'Aishwarya',
  eventDate: '2026-06-21',
  eventTime: '17:00',
  timezone: 'IST',
  venue: 'The Blossom Place, Banjara Hills, Hyderabad - 500034',
  customMessage: 'Join us for games, laughter and a big reveal!',
};

// `?long=1` swaps in a deliberately long venue + note, so a card that can't
// take a real-world address without colliding with the baked artwork shows it.
const LONG: Record<string, string> = {
  venue: 'The Rosewood Banquet Hall & Convention Centre, Plot 47, Sector 22B, Jubilee Enclave, Hyderabad, Telangana 500081',
  customMessage:
    'A tiny pair of hands, a brand new heartbeat, and a whole lot of love on the way. Come shower the parents-to-be with blessings, laughter and all the good wishes you can carry.',
};
const useLong = new URLSearchParams(window.location.search).get('long') === '1';

const baseSampleFor = (id: string) =>
  id.startsWith('bday-c')
    ? BDAY_SAMPLE
    : id.startsWith('pw-c')
      ? PW_SAMPLE
      : id.startsWith('wed-c')
        ? WED_SAMPLE
        : id.startsWith('hw-c')
          ? HW_SAMPLE
          : id.startsWith('gr-c')
            ? GR_SAMPLE
            : { ...SAMPLE, ...(OVERRIDES[id] || {}) };

const sampleFor = (id: string) => ({
  ...baseSampleFor(id),
  ...(useLong ? LONG : {}),
  ...(MONTH && MONTH_DATE[MONTH] ? { eventDate: MONTH_DATE[MONTH] } : {}),
});

// `?probe=1` re-colours every field with a unique flat colour, so a screenshot
// tells us exactly which pixels belong to which field. That lets the colour
// audit sample the designer's own ink colour per field instead of guessing
// from a whole band of text.
const PROBE = [
  '#FF0000', '#00C000', '#0000FF', '#FF00FF', '#00CFCF', '#FF8000',
  '#8000FF', '#008040', '#804000', '#FF0080', '#0080FF', '#80FF00',
  '#C00060', '#006080', '#600080', '#808000', '#FF4040', '#40FF40',
];
// `?month=sep` / `?month=jun` swap the date for the longest and shortest
// month names, so a card that only lines up for one of them shows it.
const MONTH = new URLSearchParams(window.location.search).get('month');
const MONTH_DATE: Record<string, string> = { sep: '2026-09-27', jun: '2026-06-07' };

const useProbe = new URLSearchParams(window.location.search).get('probe') === '1';

const probed = (t: (typeof eviteTemplates)[number]) =>
  !useProbe || !t.layout
    ? t
    : {
        ...t,
        layout: {
          ...t.layout,
          fields: t.layout.fields.map((f, i) => ({ ...f, color: PROBE[i % PROBE.length] })),
        },
      };

function Ruler() {
  const H = 3508, W = 2480;
  const el: React.ReactNode[] = [];
  for (let y = 0; y <= H; y += 100)
    el.push(<div key={'h' + y} style={{ position: 'absolute', left: 0, right: 0, top: `${(y / H) * 100}%`, borderTop: y % 500 === 0 ? '1px solid rgba(220,0,0,.55)' : '1px solid rgba(220,0,0,.16)' }}>{y % 500 === 0 && <span style={{ position: 'absolute', left: 2, top: -12, fontSize: 10, color: '#c00', fontFamily: 'monospace' }}>{y}</span>}</div>);
  for (let x = 0; x <= W; x += 250)
    el.push(<div key={'v' + x} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(x / W) * 100}%`, borderLeft: x % 500 === 0 ? '1px solid rgba(0,0,220,.4)' : '1px solid rgba(0,0,220,.14)' }}>{x % 500 === 0 && <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 10, color: '#00c', fontFamily: 'monospace' }}>{x}</span>}</div>);
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{el}</div>;
}

export default function BabyPreview() {
  const p = new URLSearchParams(window.location.search);
  const only = p.get('id');
  const prefix = only
    ? only.startsWith('bday-c')
      ? 'bday-c'
      : only.startsWith('pw-c')
        ? 'pw-c'
        : only.startsWith('wed-c')
          ? 'wed-c'
          : only.startsWith('hw-c')
            ? 'hw-c'
            : only.startsWith('gr-c')
              ? 'gr-c'
              : 'baby-c'
    : p.get('set') === 'bday'
      ? 'bday-c'
      : p.get('set') === 'pw'
        ? 'pw-c'
        : p.get('set') === 'wed'
          ? 'wed-c'
          : p.get('set') === 'hw'
            ? 'hw-c'
            : p.get('set') === 'gr'
              ? 'gr-c'
              : 'baby-c';
  const all = eviteTemplates.filter((t) => t.id.startsWith(prefix));
  const ruler = p.get('ruler') === '1';
  const bare = p.get('bare') === '1';
  const cardWidth = Number(p.get('w') || 640) || 640;
  const concepts = only ? all.filter((t) => t.id === only) : all;

  if (bare && concepts.length === 1) {
    const t = concepts[0];
    return (
      <div id="card" style={{ width: cardWidth, position: 'relative' }}>
        <TemplateRenderer template={probed(t)} formData={sampleFor(t.id)} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: '#efeae3', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'monospace', fontSize: 14 }}>
        Baby tuning ({concepts.length}) — ?id=baby-c1 · &amp;w=1600 · &amp;ruler=1 · &amp;bare=1
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        {concepts.map((t) => (
          <div key={t.id} style={{ background: '#fff', padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, padding: '2px 4px' }}>{t.id} — {t.name}</div>
            <div style={{ width: cardWidth, maxWidth: '100%', position: 'relative' }}>
              <TemplateRenderer template={probed(t)} formData={sampleFor(t.id)} />
              {ruler && <Ruler />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
