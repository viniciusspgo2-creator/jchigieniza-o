'use client';

import { useState } from 'react';
import { Reveal } from './reveal';
import { Lightbox, type LightboxItem } from './lightbox';
import { ZoomIn } from 'lucide-react';

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image: string;
  imageAlt: string;
};

const CAT_LABEL: Record<string, string> = {
  casa: 'Casa',
  infantil: 'Infantil',
  veicular: 'Veicular',
  protecao: 'Proteção',
};

/**
 * Grade de fotos em masonry com lightbox — usada na página /galeria.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxItems: LightboxItem[] = items.map((g) => ({
    src: g.image,
    alt: g.imageAlt,
    title: g.title,
    description: g.description,
  }));

  if (items.length === 0) return null;

  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((g, i) => (
          <li key={g.id} className="mb-5 break-inside-avoid">
            <Reveal delay={0.04 * (i % 3)}>
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Ampliar foto: ${g.title}`}
                className="group relative block w-full overflow-hidden rounded-[24px] bg-white text-left shadow-soft ring-1 ring-deep/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <img
                  src={g.image}
                  alt={g.imageAlt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
                />
                {g.category && (
                  <span className="absolute left-4 top-4 rounded-full glass-dark px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                    {CAT_LABEL[g.category] ?? 'Trabalho'}
                  </span>
                )}
                {/* overlay com zoom + legenda */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-end justify-between gap-3 bg-gradient-to-t from-deep-800/80 via-deep-800/10 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="text-sm font-bold text-white">
                    {g.title}
                    {g.description && <span className="mt-0.5 block text-[12.5px] font-medium leading-snug text-white/75">{g.description}</span>}
                  </span>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                    <ZoomIn className="h-4.5 w-4.5" />
                  </span>
                </span>
              </button>
            </Reveal>
          </li>
        ))}
      </ul>

      <Lightbox items={lightboxItems} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </>
  );
}
