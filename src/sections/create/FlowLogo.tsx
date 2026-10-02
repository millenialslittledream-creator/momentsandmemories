import { useNavigate } from 'react-router-dom';

/**
 * Brand logo pinned to the top-left corner of every create-flow screen and
 * modal. The global Navigation bar is hidden during most of the flow, so this
 * keeps the logo visible everywhere. Clicking it returns home.
 */
export default function FlowLogo({
  onClick,
  size = 'md',
  tone = 'dark',
}: {
  onClick?: () => void;
  /** 'lg' — the roomy full-screen entry stages (picker / choose-design /
   *  gallery), where the logo can match the landing header. 'md' — the
   *  compact step modals, where a huge logo would collide with the title. */
  size?: 'md' | 'lg';
  /** Use the dark-green landing logo on the light homepage background. */
  tone?: 'dark' | 'light';
}) {
  const navigate = useNavigate();
  const height = size === 'lg' ? 'h-16 md:h-20' : 'h-11 md:h-12';
  return (
    <button
      onClick={onClick ?? (() => navigate('/'))}
      aria-label="Moments & Memories — home"
      className="absolute top-1.5 left-4 z-40 select-none transition-opacity duration-200 hover:opacity-80"
    >
      <img
        src={tone === 'light' ? '/logo-landing.png' : '/logo-pages.png'}
        alt="Moments & Memories"
        className={`${height} w-auto object-contain drop-shadow-lg`}
      />
    </button>
  );
}
