'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Eye, MousePointerClick, Wallet, AlertTriangle, PackageCheck, RefreshCw } from 'lucide-react';
import { Empty, Loading, Money, PageTitle, StatCard, STATUS_LABELS, StatusBadge } from '@/components/admin/ui-bits';
import { formatBRL } from '@/lib/money';

type Dash = {
  visits: { d1: number; d7: number; d30: number; sessions30: number };
  conversions: { whatsappClicks30: number; bookingSubmits30: number };
  bookings: {
    byStatus: Record<string, number>;
    total: number;
    today: number;
    upcoming: { id: string; protocol: string; name: string; preferredDate: string; timeSlot: string; status: string; service: { name: string } }[];
  };
  finance: {
    received30Cents: number;
    pendingReceivableCents: number;
    overdueReceivables: { id: string; description: string; dueDate: string; remainingCents: number; customer: string | null }[];
    overduePayables: { id: string; description: string; dueDate: string; remainingCents: number; supplier: string | null }[];
  };
  lowStock: { id: string; name: string; quantity: number; minQuantity: number; unit: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d.ok ? d : null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  if (loading && !data) return <Loading />;
  if (!data) return <Empty title="Não foi possível carregar o painel" hint="Tente recarregar a página." />;

  const hasVisits = data.visits.d30 > 0;
  const hasBookings = data.bookings.total > 0;
  const activeStatuses = ['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'EM_ATENDIMENTO'];

  return (
    <div>
      <PageTitle
        title="Visão geral"
        subtitle="Métricas reais do sistema — atualizadas agora."
        actions={
          <button onClick={load} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-ink-soft hover:border-brand hover:text-brand">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Atualizar
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Visitas (30 dias)"
          value={hasVisits ? data.visits.d30 : 0}
          hint={hasVisits ? `${data.visits.sessions30} sessões aproximadas` : 'Sem dados ainda — o contador começa com o site no ar'}
        />
        <StatCard
          label="Cliques no WhatsApp (30d)"
          value={data.conversions.whatsappClicks30}
          hint="Evento registrado nos botões do site"
        />
        <StatCard
          label="Solicitações (30d)"
          value={data.conversions.bookingSubmits30}
          hint="Envios do formulário de agendamento"
        />
        <StatCard
          label="Recebido (30 dias)"
          value={formatBRL(data.finance.received30Cents)}
          hint="Somente pagamentos/recebimentos efetivados"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Agendamentos por status */}
        <section className="rounded-3xl border border-border bg-white p-6 shadow-soft" aria-labelledby="dash-status">
          <div className="flex items-center justify-between">
            <h2 id="dash-status" className="font-display text-base font-bold text-deep">Agendamentos por status</h2>
            <Link href="/admin/agendamentos" className="text-sm font-semibold text-brand hover:underline">Ver todos</Link>
          </div>
          {hasBookings ? (
            <>
              <ul className="mt-5 space-y-3">
                {Object.entries(data.bookings.byStatus)
                  .sort((a, b) => (activeStatuses.includes(b[0]) ? 1 : 0) - (activeStatuses.includes(a[0]) ? 1 : 0))
                  .map(([status, count]) => {
                    const max = Math.max(...Object.values(data.bookings.byStatus), 1);
                    return (
                      <li key={status}>
                        <div className="flex items-center justify-between text-sm">
                          <StatusBadge status={status} />
                          <span className="font-bold text-deep">{count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ice">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
              <p className="mt-4 text-xs text-ink-soft">
                {data.bookings.today} atendimento(s) confirmado(s) para hoje.
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">
              Nenhum agendamento registrado ainda. Quando as primeiras solicitações chegarem, os números aparecem aqui.
            </p>
          )}
        </section>

        {/* Próximos atendimentos */}
        <section className="rounded-3xl border border-border bg-white p-6 shadow-soft" aria-labelledby="dash-upcoming">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4.5 w-4.5 text-brand" aria-hidden="true" />
            <h2 id="dash-upcoming" className="font-display text-base font-bold text-deep">Próximos atendimentos</h2>
          </div>
          {data.bookings.upcoming.length > 0 ? (
            <ul className="mt-4 divide-y divide-border/60">
              {data.bookings.upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-deep">{b.name}</p>
                    <p className="text-xs text-ink-soft">
                      {b.service.name} · {b.preferredDate.split('-').reverse().join('/')} às {b.timeSlot}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">Nenhum atendimento confirmado para os próximos dias.</p>
          )}
        </section>

        {/* Financeiro */}
        <section className="rounded-3xl border border-border bg-white p-6 shadow-soft" aria-labelledby="dash-finance">
          <div className="flex items-center gap-2">
            <Wallet className="h-4.5 w-4.5 text-brand" aria-hidden="true" />
            <h2 id="dash-finance" className="font-display text-base font-bold text-deep">Contas com atraso</h2>
          </div>
          {data.finance.overdueReceivables.length === 0 && data.finance.overduePayables.length === 0 ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
              <PackageCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Nenhuma conta vencida — tudo em dia.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {data.finance.overdueReceivables.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-deep">{t.description}</p>
                    <p className="text-xs text-ink-soft">A receber · venceu em {t.dueDate.split('-').reverse().join('/')}</p>
                  </div>
                  <Money cents={t.remainingCents} />
                </li>
              ))}
              {data.finance.overduePayables.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-deep">{t.description}</p>
                    <p className="text-xs text-ink-soft">A pagar · venceu em {t.dueDate.split('-').reverse().join('/')}</p>
                  </div>
                  <Money cents={t.remainingCents} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-ink-soft">
            A receber (previsto, em aberto): <strong className="text-deep">{formatBRL(data.finance.pendingReceivableCents)}</strong>
          </p>
        </section>

        {/* Estoque mínimo */}
        <section className="rounded-3xl border border-border bg-white p-6 shadow-soft" aria-labelledby="dash-stock">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" aria-hidden="true" />
            <h2 id="dash-stock" className="font-display text-base font-bold text-deep">Insumos abaixo do mínimo</h2>
          </div>
          {data.lowStock.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {data.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <p className="text-sm font-semibold text-deep">{i.name}</p>
                  <p className="text-sm font-bold text-amber-700">
                    {i.quantity} / mín. {i.minQuantity} {i.unit}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">Todo o estoque está acima do mínimo cadastrado.</p>
          )}
        </section>
      </div>
    </div>
  );
}
