'use client';

/**
 * Lightbox acessível para a galeria: dialog em tela cheia, navegação por
 * setas/teclado, fechamento por Esc e clique no fundo. Sem dependências.
 */
import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export type LightboxItem = {
  src: string;
  alt: string;
  title: string;
  description?: string | null;
};

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null && items.length > 0;

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, prev, next]);

  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada: ${item.title}`}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-deep-800/[0.97] backdrop-blur-md"
          onClick={onClose}
        >
          {/* topo */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <p className="text-sm font-bold text-white/90">
              {item.title}
              <span className="ml-2 font-medium text-white/40">
                {(index ?? 0) + 1} / {items.length}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* imagem */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-2 sm:px-16" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode="wait">
              <motion.img
                key={item.src}
                src={item.src}
                alt={item.alt}
                initial={reduced ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.22 }}
                className="max-h-[74vh] max-w-full rounded-2xl object-contain shadow-deep"
              />
            </AnimatePresence>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Próxima foto"
                  className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* legenda */}
          {item.description && (
            <p className="mx-auto max-w-2xl px-6 pb-6 pt-2 text-center text-sm leading-relaxed text-white/70" onClick={(e) => e.stopPropagation()}>
              {item.description}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
