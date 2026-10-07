'use client';

/**
 * Player de mensagem de voz: card em vidro navy com botão de play,
 * barras de onda decorativas (animadas apenas quando tocando) e barra
 * de progresso navegável por teclado. Respeita prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

const BARS = [0.45, 0.75, 0.55, 0.9, 0.65, 1, 0.7, 0.95, 0.5, 0.8, 0.6, 0.85, 0.4, 0.7, 0.55, 0.9, 0.45, 0.75, 0.6, 0.5];

function fmt(s: number) {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function VoicePlayer({ src, label = 'Ouça nossa mensagem' }: { src: string; label?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onEnd = () => {
      setPlaying(false);
      setCur(0);
      a.currentTime = 0;
    };
    a.addEventListener('ended', onEnd);
    return () => a.removeEventListener('ended', onEnd);
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (Number.isFinite(a.duration) && a.duration > 0) setDur((d) => (d > 0 ? d : a.duration));
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const seek = (v: number) => {
    const a = ref.current;
    if (!a || !dur) return;
    a.currentTime = v;
    setCur(v);
  };

  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  return (
    <div className="inline-flex max-w-full items-center gap-3.5 rounded-full glass-dark py-2.5 pl-2.5 pr-5 ring-1 ring-white/15">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onDurationChange={(e) => setDur(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onLoadedMetadata={(e) => setDur(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        className="hidden"
      />

      {/* botão play/pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar mensagem de voz' : 'Ouvir mensagem de voz'}
        aria-pressed={playing}
        className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-deep shadow-lift transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-300"
      >
        {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />}
      </button>

      {/* ondas + progresso */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-aqua-300" aria-hidden="true" />
          <p className="truncate text-[12.5px] font-bold tracking-wide text-blue-100">{label}</p>
          <p className="ml-auto shrink-0 text-[11.5px] font-semibold tabular-nums text-blue-100/60">
            {fmt(cur)} <span aria-hidden="true">/</span> {fmt(dur)}
          </p>
        </div>

        {/* ondas decorativas (clicáveis + acessíveis via barra abaixo) */}
        <div className="relative mt-1.5 flex h-5 items-center gap-[3px]" aria-hidden="true">
          {BARS.map((h, i) => {
            const active = (i / BARS.length) * 100 <= pct;
            return (
              <span
                key={i}
                className={`w-[3px] flex-1 rounded-full transition-colors duration-200 ${active ? 'bg-aqua-300' : 'bg-white/25'} ${
                  playing && !reduced ? 'animate-[wave_1.1s_ease-in-out_infinite]' : ''
                }`}
                style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${(i % 6) * 0.12}s` }}
              />
            );
          })}
        </div>

        <label className="sr-only" htmlFor="voz-progresso">
          Progresso da mensagem de voz
        </label>
        <input
          id="voz-progresso"
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={cur}
          onChange={(e) => seek(Number(e.target.value))}
          aria-valuetext={`${fmt(cur)} de ${fmt(dur)}`}
          className="mt-1 block h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-aqua-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-300"
          style={{
            background: `linear-gradient(to right, rgb(111 210 246) ${pct}%, rgba(255,255,255,0.2) ${pct}%)`,
          }}
        />
      </div>
    </div>
  );
}
