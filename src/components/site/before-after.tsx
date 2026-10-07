'use client';

/**
 * Comparador antes/depois acessível: arraste por pointer events + input range
 * invisível para teclado. Alça grande e visível, rótulos "Antes" e "Depois".
 */
import { useCallback, useRef, useState } from 'react';

export function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  label,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  label: string;
}) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <figure className="group">
      <div
        className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-[26px] bg-ice shadow-lift ring-1 ring-deep/[0.06] sm:aspect-[16/11]"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX, e.currentTarget);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromClientX(e.clientX, e.currentTarget);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {/* Depois (base) */}
        { }
        <img src={afterSrc} alt={afterAlt} draggable={false} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        {/* Antes (revelado por clip-path) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          { }
          <img
            src={beforeSrc}
            alt={beforeAlt}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Rótulos Antes / Depois */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-4 z-10 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-opacity duration-200"
          style={{ opacity: pos > 14 ? 1 : 0.35, background: 'rgba(6,21,48,0.55)', backdropFilter: 'blur(8px)' }}
        >
          Antes
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-aqua-300/90 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-deep-800 transition-opacity duration-200"
          style={{ opacity: pos < 86 ? 1 : 0.35, backdropFilter: 'blur(8px)' }}
        >
          Depois
        </span>

        {/* Divisor + alça */}
        <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${pos}%` }} aria-hidden="true">
          <div className="absolute inset-y-0 -left-px w-1 bg-white shadow-[0_0_16px_rgba(0,0,0,0.45)]" />
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lift ring-1 ring-deep/10 transition-transform duration-200 group-active:scale-95">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-deep">
                <path d="M9 6L4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Etiqueta do trabalho */}
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-deep-800/75 via-deep-800/25 to-transparent p-4 pt-10 text-white">
          <span className="text-[13px] font-bold">{label}</span>
        </figcaption>

        {/* Controle acessível (teclado) */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Posição do comparador de ${label}`}
          className="absolute inset-x-4 bottom-1.5 z-20 mx-auto block w-[calc(100%-2rem)] cursor-ew-resize opacity-0 focus-visible:opacity-100"
        />
      </div>
    </figure>
  );
}
