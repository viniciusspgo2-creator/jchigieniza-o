'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle, STATUS_LABELS, StatusBadge } from '@/components/admin/ui-bits';
import { formatBRL } from '@/lib/money';

type Booking = {
  id: string; protocol: string; name: string; phone: string; status: string;
  itemCount: number; district: string; streetAddress: string; addressRef: string | null;
  preferredDate: string; timeSlot: string; period: string | null; notes: string | null;
  internalNotes: string | null; photos: string | null; createdAt: string;
  service: { name: string };
  transaction?: { id: string } | null;
};

export default function AgendamentosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [note, setNote] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.ok ? d.bookings : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [status]);
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [q]);

  const act = async (body: Record<string, unknown>) => {
    if (!selected) return;
    setActionError(null);
    const r = await fetch(`/api/admin/bookings/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.ok) {
      setActionError(d.error ?? 'Ação falhou.');
      return null;
    }
    load();
    setSelected(null);
    return d;
  };

  const openDetail = (b: Booking) => {
    setSelected(b);
    setActionError(null);
    setAmount('');
    setNote(b.internalNotes ?? '');
    setNewDate(b.preferredDate);
    setNewSlot(b.timeSlot);
  };

  return (
    <div>
      <PageTitle
        title="Agendamentos"
        subtitle="Solicitações recebidas pelo site. Confirmar exige janela livre na agenda (validação transacional)."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, telefone ou protocolo…"
            className={`${inputCls} pl-10`}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <Empty
          title="Nenhuma solicitação encontrada"
          hint="Assim que clientes enviarem o formulário do site, as solicitações aparecem aqui — mesmo que o navegador do cliente feche em seguida."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-ice text-left text-xs font-bold uppercase tracking-wider text-ink-soft">
                  <th className="px-5 py-3.5">Protocolo</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Serviço</th>
                  <th className="px-5 py-3.5">Preferência</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {bookings.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-ice/60">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-deep">{b.protocol}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-deep">{b.name}</p>
                      <p className="text-xs text-ink-soft">{b.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {b.service.name}
                      <span className="ml-1.5 rounded-full bg-ice px-2 py-0.5 text-[11px] font-semibold text-ink-soft">×{b.itemCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {b.preferredDate.split('-').reverse().join('/')} · {b.timeSlot.startsWith('PERIODO') ? STATUS_SLOT[b.timeSlot] ?? b.timeSlot : b.timeSlot}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openDetail(b)} className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-deep transition-colors hover:border-brand hover:text-brand">
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Solicitação ${selected.protocol}` : ''} wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-ice p-4 text-sm">
                <p className="font-semibold text-deep">{selected.name}</p>
                <p className="mt-0.5 text-ink-soft">{selected.phone}</p>
                <p className="mt-2 text-ink-soft">
                  {selected.streetAddress}, {selected.district}
                  {selected.addressRef && <span className="block text-xs">Ref.: {selected.addressRef}</span>}
                </p>
              </div>
              <div className="rounded-2xl bg-ice p-4 text-sm">
                <p className="font-semibold text-deep">{selected.service.name} × {selected.itemCount}</p>
                <p className="mt-0.5 text-ink-soft">
                  Preferência: {selected.preferredDate.split('-').reverse().join('/')} às{' '}
                  {selected.timeSlot.startsWith('PERIODO') ? STATUS_SLOT[selected.timeSlot] ?? selected.timeSlot : selected.timeSlot}
                </p>
                {selected.notes && <p className="mt-2 text-xs leading-relaxed text-ink-soft">Obs. do cliente: “{selected.notes}”</p>}
              </div>
            </div>

            {selected.photos && JSON.parse(selected.photos).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-deep">Fotos enviadas pelo cliente</p>
                <div className="flex flex-wrap gap-2">
                  {(JSON.parse(selected.photos) as string[]).map((p) => (
                     
                    <img key={p} src={p} alt="Foto do item enviada pelo cliente" className="h-20 w-20 rounded-xl border border-border object-cover" />
                  ))}
                </div>
              </div>
            )}

            {actionError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">{actionError}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'EM_ATENDIMENTO'].includes(selected.status) && (
                <button
                  onClick={() => act({ action: 'confirmar', date: newDate, slot: newSlot })}
                  disabled={selected.status === 'CONFIRMADO'}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {selected.status === 'CONFIRMADO' ? 'Já confirmado' : 'Confirmar nesta janela'}
                </button>
              )}
              {['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO'].includes(selected.status) && (
                <>
                  <button
                    onClick={() => act({ action: 'status', status: 'EM_ANALISE' })}
                    className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-deep hover:border-brand hover:text-brand"
                  >
                    Marcar em análise
                  </button>
                  <button
                    onClick={() => act({ action: 'cancelar', reason: '' })}
                    className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-action hover:bg-red-50"
                  >
                    Cancelar solicitação
                  </button>
                </>
              )}
              {['CONFIRMADO', 'EM_ATENDIMENTO'].includes(selected.status) && (
                <button
                  onClick={() => act({ action: 'status', status: 'EM_ATENDIMENTO' })}
                  className="min-h-11 rounded-xl bg-deep px-4 text-sm font-bold text-white hover:bg-deep-600"
                >
                  Iniciar atendimento
                </button>
              )}
            </div>

            {selected.status === 'EM_ATENDIMENTO' && (
              <div className="rounded-2xl border border-border bg-ice p-4">
                <p className="mb-3 text-sm font-bold text-deep">Concluir atendimento</p>
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Valor cobrado (R$)">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                      className={`${inputCls} w-36`}
                    />
                  </Field>
                  <button
                    onClick={async () => {
                      const cents = parseMoney(amount);
                      if (!cents) { setActionError('Informe um valor válido.'); return; }
                      await act({ action: 'concluir', amountCents: cents, createReceivable: cents > 0 });
                    }}
                    className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Concluir e gerar conta a receber
                  </button>
                </div>
                {selected.transaction && (
                  <p className="mt-2 text-xs text-ink-soft">Este atendimento já possui conta a receber vinculada (evita duplicação).</p>
                )}
              </div>
            )}

            {/* Reagendar */}
            {!['CANCELADO', 'CONCLUIDO'].includes(selected.status) && (
              <div className="rounded-2xl border border-border p-4">
                <p className="mb-3 text-sm font-bold text-deep">Reagendar</p>
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Data">
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={`${inputCls} w-44`} />
                  </Field>
                  <Field label="Janela (HH:MM)">
                    <input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className={`${inputCls} w-36`} step={3600} />
                  </Field>
                  <button
                    onClick={() => act({ action: 'reagendar', date: newDate, slot: newSlot })}
                    className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold text-deep hover:border-brand hover:text-brand"
                  >
                    Reagendar
                  </button>
                </div>
              </div>
            )}

            {/* Nota interna */}
            <Field label="Nota interna (não aparece para o cliente)">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
              <button
                onClick={() => act({ action: 'nota', internalNotes: note })}
                className="mt-2 min-h-10 rounded-xl border border-border px-4 text-xs font-bold text-ink-soft hover:border-brand hover:text-brand"
              >
                Salvar nota
              </button>
            </Field>
          </div>
        )}
      </Dialog>
    </div>
  );
}

const STATUS_SLOT: Record<string, string> = {
  PERIODO_MANHA: 'manhã',
  PERIODO_TARDE: 'tarde',
  PERIODO_NOITE: 'noite',
};

function parseMoney(input: string): number | null {
  const s = input.replace(/[R$\s.]/g, '').replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}
