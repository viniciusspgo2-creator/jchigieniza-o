'use client';

/** Blocos de UI reutilizados nas páginas do painel. */
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { formatBRL } from '@/lib/money';

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-deep">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center">
      <p className="font-display text-base font-bold text-deep">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Carregando">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: string | number; hint?: string; tone?: 'default' | 'action' | 'brand' | 'warn' }) {
  const tones = {
    default: 'bg-white border-border text-deep',
    brand: 'bg-deep border-deep text-white',
    action: 'bg-white border-red-100 text-action',
    warn: 'bg-white border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${tones[tone]}`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${tone === 'brand' ? 'text-blue-100/80' : 'text-ink-soft'}`}>{label}</p>
      <p className="font-display mt-1.5 text-2xl font-extrabold">{value}</p>
      {hint && <p className={`mt-1 text-xs ${tone === 'brand' ? 'text-blue-100/70' : 'text-ink-soft'}`}>{hint}</p>}
    </div>
  );
}

export function Money({ cents }: { cents: number }) {
  return <span>{formatBRL(cents)}</span>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-deep">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-deep outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-ice disabled:text-ink-soft';

export const STATUS_LABELS: Record<string, string> = {
  SOLICITADO: 'Solicitado',
  EM_ANALISE: 'Em análise',
  CONFIRMADO: 'Confirmado',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SOLICITADO: 'bg-aqua-50 text-brand-700 border-aqua-200',
    EM_ANALISE: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMADO: 'bg-brand/10 text-brand-700 border-brand/25',
    EM_ATENDIMENTO: 'bg-deep text-white border-deep',
    CONCLUIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELADO: 'bg-red-50 text-action border-red-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[status] ?? 'bg-ice text-ink-soft border-border'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-deep/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-deep sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-deep">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ice">
            ✕
          </button>
        </div>
        <div className="thin-scroll overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
