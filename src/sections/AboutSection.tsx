import { useNavigate } from 'react-router-dom';

// ── Content data ────────────────────────────────────────────────────────────
const OFFERINGS = [
  { icon: 'draw',                 title: 'Elegant digital invitations', copy: 'Create beautifully designed invitations for any occasion.' },
  { icon: 'palette',              title: 'Personalized for the moment', copy: 'Tailor every detail to weddings, birthdays, showers and more.' },
  { icon: 'send',                 title: 'Send your way',               copy: 'Share via SMS, email, or a simple shareable link.' },
  { icon: 'fact_check',           title: 'Real-time RSVP tracking',     copy: 'Watch responses arrive and update instantly.' },
  { icon: 'notifications_active', title: 'Reminder notifications',      copy: 'Gentle nudges so no guest ever misses the date.' },
  { icon: 'groups',               title: 'Guest list management',       copy: 'Organize, group and communicate with everyone in one place.' },
  { icon: 'insights',             title: 'Event analytics',             copy: 'See who’s coming and how your celebration is shaping up.' },
  { icon: 'card_giftcard',        title: 'Curated return gifts',        copy: 'Explore thoughtful gifts and celebration products.' },
];

const COMMUNICATIONS = [
  'Account verification (OTP)',
  'Invitation notifications',
  'RSVP confirmations',
  'Event reminders',
  'Event-related updates',
  'Customer support messages',
];

const REASONS = [
  'Beautiful invitation templates',
  'Easy RSVP management',
  'Personalized guest experience',
  'Secure and reliable communication',
  'Mobile-friendly platform',
  'Designed for celebrations of every size',
  'Built with privacy and customer trust in mind',
];

// Small ornamental divider used inside the dark vision band.
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-[#9cb092]">
      <span className="h-px w-10 bg-[#9cb092]/40" />
      <span className="material-icons text-[16px]">spa</span>
      <span className="h-px w-10 bg-[#9cb092]/40" />
    </div>
  );
}

// About content for the dedicated /about page (rendered by pages/About.tsx).
// Opens with a dark hero so the transparent nav bar stays legible, then flows
// through light bands with one dark "Our Vision" break.
export default function AboutSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full">
      {/* ── Hero (dark, so the transparent nav bar stays legible) ── */}
      <div className="relative overflow-hidden bg-[#111914] px-6 pb-16 pt-36 md:pb-20 md:pt-44">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(156,176,146,0.22), transparent 70%), radial-gradient(ellipse 40% 50% at 85% 30%, rgba(215,195,150,0.16), transparent 75%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.32em] text-[#9cb092]">
            About Us
          </p>
          <h1 className="mt-5 font-serif-exp text-3xl leading-[1.15] text-[#f2f6ef] md:text-5xl">
            Every Celebration Deserves a<br className="hidden md:block" /> Beautiful Beginning
          </h1>
          <p className="mx-auto mt-7 max-w-2xl font-display text-[15px] leading-relaxed text-[#c9d4c2] md:text-base">
            At Moments &amp; Memories, we believe every celebration starts with a memorable
            invitation. Whether it’s a wedding, birthday, baby shower, housewarming, anniversary,
            graduation, or corporate event, our platform helps you create beautiful digital
            invitations and manage your guests with ease.
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-display text-[15px] leading-relaxed text-[#c9d4c2] md:text-base">
            Moments &amp; Memories is proudly operated by{' '}
            <span className="font-semibold text-[#e4eee1]">MILLENNIALS LITTLE DREAM LLC</span>, a
            U.S.-registered company dedicated to making celebrations simpler, more personal, and more
            memorable. Our goal is to help families, friends, and communities create unforgettable
            experiences through beautifully designed invitations, effortless RSVP management, guest
            communication, and thoughtful event planning tools.
          </p>
        </div>
      </div>

      {/* ── What We Offer ── */}
      <div className="bg-background-light px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[#5a6c50]">
              What We Offer
            </p>
            <h3 className="mt-4 font-serif-exp text-2xl text-[#2a3328] md:text-3xl">
              From invitation to celebration
            </h3>
            <p className="mt-4 font-display text-[15px] leading-relaxed text-[#3d4a35]/80">
              Whether you’re hosting an intimate family gathering or a large wedding, Moments &amp;
              Memories helps you stay organized every step of the way. Our platform lets hosts:
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERINGS.map((o) => (
              <div
                key={o.title}
                className="group rounded-2xl border border-[#3d4a35]/12 bg-white/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#9cb092]/50 hover:bg-white/85"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9cb092]/20 text-[#3d4a35] transition-colors group-hover:bg-[#9cb092]/35">
                  <span className="material-icons text-[22px]">{o.icon}</span>
                </span>
                <h4 className="mt-4 font-serif-exp text-lg text-[#2a3328]">{o.title}</h4>
                <p className="mt-2 font-display text-[13px] leading-relaxed text-[#5a6c50]">
                  {o.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Commitment ── */}
      <div className="hero-bokeh-bg relative px-6 py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[#5a6c50]">
            Our Commitment
          </p>
          <h3 className="mt-4 font-serif-exp text-2xl text-[#2a3328] md:text-3xl">
            Secure, reliable, and made for you
          </h3>
          <p className="mt-5 font-display text-[15px] leading-relaxed text-[#3d4a35]/85">
            We are committed to providing a secure, reliable, and user-friendly experience for every
            customer. We respect your privacy and only send communications that users have explicitly
            agreed to receive.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          <p className="text-center font-display text-[12px] uppercase tracking-[0.24em] text-[#5a6c50]">
            Our communications may include
          </p>
          <ul className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {COMMUNICATIONS.map((c) => (
              <li key={c} className="flex items-center gap-3 font-display text-[14px] text-[#2a3328]">
                <span className="material-icons text-[18px] text-[#9cb092]">check_circle</span>
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-[#3d4a35]/12 bg-white/70 p-6 md:p-8">
            <p className="font-display text-[13px] leading-relaxed text-[#3d4a35]/85">
              Users choose whether to receive SMS communications by providing their consent during
              registration or while using our services. Message frequency varies. Message and data
              rates may apply. Users can reply{' '}
              <span className="font-semibold text-[#2a3328]">STOP</span> at any time to opt out or{' '}
              <span className="font-semibold text-[#2a3328]">HELP</span> for assistance.
            </p>
          </div>
        </div>
      </div>

      {/* ── Why Choose Us ── */}
      <div className="bg-background-light px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[#5a6c50]">
              Why Choose Us
            </p>
            <h3 className="mt-4 font-serif-exp text-2xl text-[#2a3328] md:text-3xl">
              Why families choose Moments &amp; Memories
            </h3>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div
                key={r}
                className="flex items-center gap-3 rounded-xl border border-[#3d4a35]/12 bg-white/65 px-5 py-4"
              >
                <span className="material-icons text-[20px] text-[#3d4a35]">verified</span>
                <span className="font-display text-[14px] text-[#2a3328]">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Vision (dark accent band) ── */}
      <div className="relative overflow-hidden bg-[#1b241b] px-6 py-20 md:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(156,176,146,0.18), transparent 72%)',
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <Ornament />
          <p className="mt-6 font-display text-[11px] uppercase tracking-[0.3em] text-[#9cb092]">
            Our Vision
          </p>
          <p className="mt-6 font-serif-exp text-xl italic leading-relaxed text-[#f2f6ef] md:text-2xl">
            We envision a world where creating memorable celebrations is effortless.
          </p>
          <p className="mx-auto mt-6 max-w-xl font-display text-[15px] leading-relaxed text-[#c9d4c2]">
            By combining thoughtful design with modern technology, we aim to become a trusted
            platform for invitations, event management, and celebration planning across the United
            States and beyond. Whether you’re planning your first birthday party or your dream
            wedding, we’re here to help you create moments that become lifelong memories.
          </p>
        </div>
      </div>

      {/* ── Contact + CTA ── */}
      <div className="hero-bokeh-bg relative px-6 py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[#5a6c50]">
            Contact Us
          </p>
          <h3 className="mt-4 font-serif-exp text-2xl text-[#2a3328] md:text-3xl">
            Let’s begin your celebration
          </h3>

          <div className="mt-8 inline-flex flex-col items-center gap-2 font-display text-[14px] text-[#3d4a35]">
            <p className="font-serif-exp text-lg text-[#2a3328]">Moments &amp; Memories</p>
            <p className="text-[#5a6c50]">Operated by MILLENNIALS LITTLE DREAM LLC</p>
            <a
              href="https://mymomentsnmemories.com"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-[#3d4a35] transition-colors hover:text-[#9cb092]"
            >
              <span className="material-icons text-[18px]">public</span>
              mymomentsnmemories.com
            </a>
            <a
              href="mailto:support@mymomentsnmemories.com"
              className="inline-flex items-center gap-2 text-[#3d4a35] transition-colors hover:text-[#9cb092]"
            >
              <span className="material-icons text-[18px]">mail</span>
              support@mymomentsnmemories.com
            </a>
          </div>

          <div className="mt-10">
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 rounded-full bg-[#3d4a35] px-8 py-3 font-display text-[12px] uppercase tracking-[0.22em] text-[#f2f6ef] transition-all duration-300 hover:bg-[#2a3328]"
            >
              Create an Invitation
              <span className="material-icons text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
