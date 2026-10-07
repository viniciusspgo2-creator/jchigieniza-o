'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, Money, PageTitle } from '@/components/admin/ui-bits';
import { formatBRL } from '@/lib/money';

type Customer = {
  id: string; name: string; phone: string; email: string | null;
  addressStreet: string | null; addressDistrict: string | null; addressCity: string | null;
  addressState: string | null; addressZip: string | null; addressRef: string | null;
  notes: string | null; archived: boolean;
  _count?: { bookings: number; transactions: number };
};
type Detail = Customer & {
  bookings: { id: string; protocol: string; status: string; preferredDate: string; service: { name: string } }[];
  transactions: { id: string; description: string; type: string; status: string; amountCents: number; payments: { amountCents: number }[] }[];
};

const empty = { name: '', phone: '', email: '', addressStreet: '', addressDistrict: '', addressCity: 'Goiânia', addressState: 'GO', addressZip: '', addressRef: '', notes: '', archived: false };

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Customer }>({ open: false });
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (showArchived) p.set('archived', '1');
    fetch(`/api/admin/customers?${p}`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.ok ? d.customers : []))
      .finally(() => setLoading(false));
  }, [q, showArchived]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const openNew = () => { setForm(empty); setError(null); setDialog({ open: true }); };
  const openEdit = (c: Customer) => {
    setForm({
      name: c.name, phone: c.phone, email: c.email ?? '', addressStreet: c.addressStreet ?? '',
      addressDistrict: c.addressDistrict ?? '', addressCity: c.addressCity ?? '', addressState: c.addressState ?? '',
      addressZip: c.addressZip ?? '', addressRef: c.addressRef ?? '', notes: c.notes ?? '', archived: c.archived,
    });
    setError(null);
    setDialog({ open: true, edit: c });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const url = dialog.edit ? `/api/admin/customers/${dialog.edit.id}` : '/api/admin/customers';
    const r = await fetch(url, {
      method: dialog.edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!d.ok) { setError(d.error ?? 'Erro ao salvar.'); return; }
    setDialog({ open: false });
    load();
  };

  const openDetail = async (c: Customer) => {
    const r = await fetch(`/api/admin/customers/${c.id}`);
    const d = await r.json();
    if (d.ok) setDetail(d.customer);
  };

  const paid = (d: Detail) =>
    d.transactions.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.payments.reduce((x, p) => x + p.amountCents, 0), 0);
  const openTotal = (d: Detail) =>
    d.transactions.filter((t) => t.type === 'INCOME' && t.status === 'PENDENTE')
      .reduce((a, t) => a + (t.amountCents - t.payments.reduce((x, p) => x + p.amountCents, 0)), 0);

  return (
    <div>
      <PageTitle
        title="Clientes"
        subtitle="Cadastro com prevenção de duplicidade por telefone."
        actions={
          <button onClick={openNew} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo cliente
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail…" className={`${inputCls} pl-10`} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 accent-[#0E63C4]" />
          Mostrar arquivados
        </label>
      </div>

      {loading ? <Loading /> : customers.length === 0 ? (
        <Empty title="Nenhum cliente cadastrado" hint="Clientes são criados automaticamente quando enviam uma solicitação pelo site, ou cadastre manualmente." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-ice text-left text-xs font-bold uppercase tracking-wider text-ink-soft">
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Bairro</th>
                  <th className="px-5 py-3.5">Atendimentos</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-ice/60">
                    <td className="px-5 py-3.5 font-semibold text-deep">
                      {c.name}
                      {c.archived && <span className="ml-2 rounded-full bg-ice px-2 py-0.5 text-[10px] font-bold text-ink-soft">ARQUIVADO</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.phone}{c.email && <span className="block text-xs">{c.email}</span>}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.addressDistrict ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c._count?.bookings ?? 0}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openDetail(c)} className="mr-2 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-deep hover:border-brand hover:text-brand">Ficha</button>
                      <button onClick={() => openEdit(c)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-deep hover:border-brand hover:text-brand">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog cadastro/edição */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} title={dialog.edit ? 'Editar cliente' : 'Novo cliente'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="WhatsApp/telefone" hint="Usado para detectar duplicidades">
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(62) 99999-9999" className={inputCls} />
          </Field>
          <Field label="E-mail (opcional)"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Endereço"><input value={form.addressStreet} onChange={(e) => setForm({ ...form, addressStreet: e.target.value })} className={inputCls} /></Field>
            <Field label="Bairro"><input value={form.addressDistrict} onChange={(e) => setForm({ ...form, addressDistrict: e.target.value })} className={inputCls} /></Field>
            <Field label="Cidade"><input value={form.addressCity} onChange={(e) => setForm({ ...form, addressCity: e.target.value })} className={inputCls} /></Field>
            <Field label="UF"><input value={form.addressState} onChange={(e) => setForm({ ...form, addressState: e.target.value })} maxLength={2} className={inputCls} /></Field>
          </div>
          <Field label="Observações"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} resize-none`} /></Field>
          {dialog.edit && (
            <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
              <input type="checkbox" checked={form.archived} onChange={(e) => setForm({ ...form, archived: e.target.checked })} className="h-4 w-4 accent-[#0E63C4]" />
              Arquivar cliente (some da lista padrão, sem apagar histórico)
            </label>
          )}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">{error}</p>}
          <button className="min-h-11 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-700">Salvar</button>
        </form>
      </Dialog>

      {/* Ficha do cliente */}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? ''} wide>
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-ice p-4">
                <p className="text-xs font-bold uppercase text-ink-soft">Total pago</p>
                <p className="font-display mt-1 text-xl font-extrabold text-emerald-600">{formatBRL(paid(detail))}</p>
              </div>
              <div className="rounded-2xl bg-ice p-4">
                <p className="text-xs font-bold uppercase text-ink-soft">Saldo em aberto</p>
                <p className="font-display mt-1 text-xl font-extrabold text-action">{formatBRL(openTotal(detail))}</p>
              </div>
              <div className="rounded-2xl bg-ice p-4">
                <p className="text-xs font-bold uppercase text-ink-soft">Contato</p>
                <p className="mt-1 text-sm font-semibold text-deep">{detail.phone}</p>
                <p className="text-xs text-ink-soft">{detail.addressStreet ?? ''} {detail.addressDistrict ?? ''}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-deep">Histórico de atendimentos</p>
              {detail.bookings.length === 0 ? (
                <p className="text-sm text-ink-soft">Nenhum atendimento registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.bookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
                      <span className="font-medium text-deep">{b.service.name} <span className="font-mono text-xs text-ink-soft">{b.protocol}</span></span>
                      <span className="text-ink-soft">{b.preferredDate.split('-').reverse().join('/')} · {b.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detail.transactions.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold text-deep">Movimentos financeiros</p>
                <ul className="space-y-2">
                  {detail.transactions.map((t) => {
                    const paidT = t.payments.reduce((x, p) => x + p.amountCents, 0);
                    return (
                      <li key={t.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
                        <span className="text-deep">{t.description}</span>
                        <span className="text-ink-soft">
                          <Money cents={t.amountCents} /> · {t.status}
                          {t.type === 'INCOME' && paidT > 0 && paidT < t.amountCents && ` (pago ${formatBRL(paidT)})`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
