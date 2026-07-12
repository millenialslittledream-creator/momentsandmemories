import { useNavigate } from 'react-router-dom';

/**
 * Brand logo pinned to the top-left corner of every create-flow screen and
 * modal. The global Navigation bar is hidden during most of the flow, so this
 * keeps the logo visible everywhere. Clicking it returns home.
 */
export default function FlowLogo({ onClick }: { onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick ?? (() => navigate('/'))}
      aria-label="Moments & Memories — home"
      className="absolute top-2.5 left-4 z-40 select-none transition-opacity duration-200 hover:opacity-80"
    >
      <img
        src="/logo-pages.png"
        alt="Moments & Memories"
        className="h-9 md:h-11 w-auto object-contain drop-shadow-lg"
      />
    </button>
  );
}
