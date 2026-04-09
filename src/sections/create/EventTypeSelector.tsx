import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { eventTypes, type EventType } from '@/data/eventFields';

interface EventTypeSelectorProps {
  selected: EventType | null;
  onSelect: (type: EventType) => void;
  onAutoAdvance?: () => void;
}

export default function EventTypeSelector({ selected, onSelect, onAutoAdvance }: EventTypeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.event-type-card',
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.3,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-8 mt-4">
        <h1 className="text-3xl md:text-5xl font-serif-exp italic text-center mb-4 relative z-10">
          What special moment are we <br />
          <span className="text-[#9cb092] not-italic font-agatho">bringing to life today?</span>
        </h1>
        <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
          Choose your occasion
        </p>
        <div className="w-[1px] h-8 bg-[#9cb092]/40 mt-4" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
        {eventTypes.map((event) => {
          const isSelected = selected === event.id;
          return (
            <button
              key={event.id}
              onClick={() => {
                onSelect(event.id);
                if (onAutoAdvance) {
                  setTimeout(() => onAutoAdvance(), 400);
                }
              }}
              className={`event-type-card group relative overflow-hidden text-left transition-all duration-500 border ${
                isSelected
                  ? 'border-[#9cb092] shadow-2xl shadow-[#9cb092]/20 scale-[1.02]'
                  : 'border-[#d5cbc3] hover:border-[#9cb092]/40 hover:shadow-lg'
              }`}
            >
              {/* Card background — light cream like the page bg */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                isSelected ? 'bg-[#EADDD7]' : 'bg-[#EADDD7]'
              }`} />

              <div className="relative p-5">
                {/* Icon */}
                <span
                  className={`material-icons text-3xl mb-3 block transition-all duration-500 ${
                    isSelected ? 'text-[#9cb092]' : 'text-[#7a8a72] group-hover:text-[#9cb092]'
                  }`}
                >
                  {event.icon}
                </span>

                {/* Label */}
                <h3 className="font-serif-exp text-base text-[#2a3328] mb-1 italic">{event.label}</h3>
                <p className="font-display text-[9px] tracking-[0.12em] uppercase leading-relaxed text-[#5a6358] line-clamp-2">
                  {event.description}
                </p>

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <span className="material-icons text-[#9cb092] text-lg">check_circle</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
