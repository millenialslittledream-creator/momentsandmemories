import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { eventTypes, type EventType } from '@/data/eventFields';

interface EventTypeSelectorProps {
  selected: EventType | null;
  onSelect: (type: EventType) => void;
}

export default function EventTypeSelector({ selected, onSelect }: EventTypeSelectorProps) {
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
      <div ref={headingRef} className="flex flex-col items-center mb-16 mt-8">
        <h1 className="text-4xl md:text-6xl font-serif-exp italic text-center mb-6 relative z-10">
          What are we <br />
          <span className="text-[#9cb092] not-italic font-agatho">Celebrating?</span>
        </h1>
        <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
          Choose your occasion
        </p>
        <div className="w-[1px] h-12 bg-[#9cb092]/40 mt-8" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {eventTypes.map((event) => {
          const isSelected = selected === event.id;
          return (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className={`event-type-card group relative overflow-hidden text-left transition-all duration-500 border ${
                isSelected
                  ? 'border-[#9cb092] shadow-2xl shadow-[#9cb092]/10 scale-[1.02]'
                  : 'border-white/10 hover:border-white/25 hover:shadow-lg'
              }`}
            >
              {/* Card background */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                isSelected ? 'bg-[#9cb092]/15' : 'bg-white/[0.03]'
              }`} />
              <div className="absolute inset-0 backdrop-blur-sm" />

              <div className="relative p-8">
                {/* Icon */}
                <span
                  className={`material-icons text-4xl mb-6 block transition-all duration-500 ${
                    isSelected ? 'text-[#9cb092]' : 'text-[#b2c3b1]/50 group-hover:text-[#b2c3b1]'
                  }`}
                >
                  {event.icon}
                </span>

                {/* Label */}
                <h3 className="font-serif-exp text-xl text-[#e4eee1] mb-2 italic">{event.label}</h3>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase leading-relaxed text-[#b2c3b1]/60">
                  {event.description}
                </p>

                {/* Corner brackets on hover/select */}
                <div className={`absolute top-3 left-3 w-4 h-4 border-t border-l transition-opacity duration-500 ${
                  isSelected ? 'border-[#9cb092] opacity-100' : 'border-white/30 opacity-0 group-hover:opacity-100'
                }`} />
                <div className={`absolute top-3 right-3 w-4 h-4 border-t border-r transition-opacity duration-500 ${
                  isSelected ? 'border-[#9cb092] opacity-100' : 'border-white/30 opacity-0 group-hover:opacity-100'
                }`} />
                <div className={`absolute bottom-3 left-3 w-4 h-4 border-b border-l transition-opacity duration-500 ${
                  isSelected ? 'border-[#9cb092] opacity-100' : 'border-white/30 opacity-0 group-hover:opacity-100'
                }`} />
                <div className={`absolute bottom-3 right-3 w-4 h-4 border-b border-r transition-opacity duration-500 ${
                  isSelected ? 'border-[#9cb092] opacity-100' : 'border-white/30 opacity-0 group-hover:opacity-100'
                }`} />

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
