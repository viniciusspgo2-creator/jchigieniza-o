'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Plus, Wallet } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, Money, PageTitle } from '@/components/admin/ui-bits';
import { formatBRL } from '@/lib/money';

type Tx = {
  id: string; type: string; kind: string; description: string; amountCents: number; status: string;
  dueDate: string | null; paidAt: string | null; installments: number; installmentNo: number; notes: string | null;
  customer?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  account?: { id: string; name: string } | null;
  paymentMethod?: { id: string; name: string } | null;
  booking?: { id: string; protocol: string } | null;
  payments: { id: string; amountCents: number; paidAt: string; note: string | null }[];
};
type Opt = { id: string; name: string };
type PaymentMethodRow = Opt & { active: boolean };

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  PAGO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-ice text-ink-soft border-border',
};

export default function FinanceiroPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [categories, setCategories] = useState<(Opt & { type: string })[]>([]);
  const [accounts, setAccounts] = useState<Opt[]>([]);
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [suppliers, setSuppliers] = useState<Opt[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [paying, setPaying] = useState<Tx | null>(null);
  const [isOperador, setIsOperador] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (q) params.set('q', q);
    fetch(`/api/admin/finance/transactions?${params}`)
      .then((r) => r.json())
      .then((d) => setTxs(d.ok ? d.transactions : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/admin/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setMethods(d.methods ?? []);
          setCategories(d.categories ?? []);
          setAccounts(d.accounts ?? []);
        }
      });
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((d) => d.ok && setCustomers((d.customers ?? []).slice(0, 500)));
    fetch('/api/admin/suppliers')
      .then((r) => r.json())
      .then((d) => d.ok && setSuppliers(d.suppliers ?? []));
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d) => setIsOperador(d.user?.role !== 'ADMIN'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [status, type, q]);

  const totals = useMemo(() => {
    const previstoReceber = txs.filter((t) => t.type === 'INCOME' && t.status === 'PENDENTE').reduce((s, t) => s + t.amountCents, 0);
    const previstoPagar = txs.filter((t) => t.type === 'EXPENSE' && t.status === 'PENDENTE').reduce((s, t) => s + t.amountCents, 0);
    const recebido = txs.reduce((s, t) => s + t.payments.reduce((ps, p) => ps + p.amountCents, 0), 0);
    return { previstoReceber, previstoPagar, recebido };
  }, [txs]);

  return (
    <div>
      <PageTitle
        title="Financeiro"
        subtitle="Lançamentos previstos e liquidados, com pagamentos parciais e histórico preservado."
        actions={
          <>
            <a
              href="/api/admin/finance/export"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-deep transition-colors hover:border-brand hover:text-brand"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> CSV
            </a>
            {!isOperador && (
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Novo lançamento
              </button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">A receber (previsto)</p>
          <p className="font-display mt-1.5 text-2xl font-extrabold text-brand-700">{formatBRL(totals.previstoReceber)}</p>
          <p className="mt-1 text-xs text-ink-soft">Lançamentos pendentes de receita</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">A pagar (previsto)</p>
          <p className="font-display mt-1.5 text-2xl font-extrabold text-action">{formatBRL(totals.previstoPagar)}</p>
          <p className="mt-1 text-xs text-ink-soft">Despesas pendentes</p>
        </div>
        <div className="rounded-2xl border border-deep bg-deep p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-100/80">Liquidado (filtro atual)</p>
          <p className="font-display mt-1.5 text-2xl font-extrabold text-white">{formatBRL(totals.recebido)}</p>
          <p className="mt-1 text-xs text-blue-100/70">Soma dos pagamentos efetivados</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} max-w-44`}>
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} max-w-44`}>
          <option value="">Receitas e despesas</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </select>
        <input aria-label="Buscar" placeholder="Buscar por descrição…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} max-w-64`} />
      </div>

      {loading ? (
        <Loading />
      ) : txs.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nenhum lançamento encontrado" hint="Registre receitas e despesas para acompanhar o previsto e o realizado. Lançamentos gerados por agendamentos concluídos também aparecem aqui." />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-ice/60 text-left text-xs uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-3 font-bold">Descrição</th>
                  <th className="px-4 py-3 font-bold">Vencimento</th>
                  <th className="px-4 py-3 font-bold">Valor</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Liquidado</th>
                  <th className="px-4 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const paidCents = t.payments.reduce((s, p) => s + p.amountCents, 0);
                  return (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-ice/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-deep">{t.description}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {t.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          {t.category ? ` · ${t.category.name}` : ''}
                          {t.customer ? ` · ${t.customer.name}` : ''}
                          {t.supplier ? ` · ${t.supplier.name}` : ''}
                          {t.booking ? ` · ${t.booking.protocol}` : ''}
                          {t.installments > 1 ? ` · parcela ${t.installmentNo}/${t.installments}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{t.dueDate ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-action'}`}>
                          {t.type === 'INCOME' ? '+' : '−'} <Money cents={t.amountCents} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[t.status] ?? ''}`}>
                          {t.status === 'PENDENTE' ? 'Pendente' : t.status === 'PAGO' ? 'Pago' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {paidCents > 0 ? <Money cents={paidCents} /> : '—'}
                        {t.status === 'PENDENTE' && paidCents > 0 && paidCents < t.amountCents && (
                          <span className="block text-[11px] text-amber-700">Parcial ({Math.round((paidCents / t.amountCents) * 100)}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isOperador && t.status === 'PENDENTE' && (
                          <button
                            onClick={() => setPaying(t)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-deep transition-colors hover:border-brand hover:text-brand"
                          >
                            <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Liquidar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && (
        <NewTxDialog
          categories={categories}
          accounts={accounts}
          methods={methods.filter((m) => m.active)}
          customers={customers}
          suppliers={suppliers}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
            toast.success('Lançamento criado.');
          }}
        />
      )}
      {paying && (
        <PayDialog
          tx={paying}
          methods={methods.filter((m) => m.active)}
          accounts={accounts}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            load();
            toast.success('Pagamento registrado.');
          }}
        />
      )}
    </div>
  );
}

function NewTxDialog({
  categories, accounts, methods, customers, suppliers, onClose, onCreated,
}: {
  categories: (Opt & { type: string })[]; accounts: Opt[]; methods: PaymentMethodRow[];
  customers: Opt[]; suppliers: Opt[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    type: 'EXPENSE', description: '', amount: '', dueDate: '', categoryId: '', accountId: '',
    paymentMethodId: '', customerId: '', supplierId: '', installments: '1', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setError(null);
    const amountCents = Math.round(Number(form.amount.replace(/\./g, '').replace(',', '.')) * 100);
    if (!form.description.trim() || !Number.isFinite(amountCents) || amountCents <= 0) {
      setError('Informe descrição e valor válidos.');
      setSaving(false);
      return;
    }
    const r = await fetch('/api/admin/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        description: form.description,
        amountCents,
        dueDate: form.dueDate || null,
        categoryId: form.categoryId || null,
        accountId: form.accountId || null,
        paymentMethodId: form.paymentMethodId || null,
        customerId: form.customerId || null,
        supplierId: form.supplierId || null,
        installments: Number(form.installments) || 1,
        notes: form.notes || null,
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) {
      setError(d.error ?? 'Não foi possível salvar.');
      return;
    }
    onCreated();
  };

  const catList = categories.filter((c) => c.type === form.type);

  return (
    <Dialog open onClose={onClose} title="Novo lançamento">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita avulsa</option>
          </select>
        </Field>
        <Field label="Valor (R$)">
          <input value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="150,00" inputMode="decimal" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descrição">
            <input value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Vencimento">
          <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Parcelas" hint="Divide o valor em lançamentos mensais.">
          <select value={form.installments} onChange={(e) => set('installments', e.target.value)} className={inputCls}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}x</option>
            ))}
          </select>
        </Field>
        <Field label="Categoria">
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
            <option value="">Sem categoria</option>
            {catList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Conta">
          <select value={form.accountId} onChange={(e) => set('accountId', e.target.value)} className={inputCls}>
            <option value="">Sem conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Forma de pagamento">
          <select value={form.paymentMethodId} onChange={(e) => set('paymentMethodId', e.target.value)} className={inputCls}>
            <option value="">Definir depois</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        {form.type === 'INCOME' ? (
          <Field label="Cliente">
            <select value={form.customerId} onChange={(e) => set('customerId', e.target.value)} className={inputCls}>
              <option value="">Sem vínculo</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Fornecedor">
            <select value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)} className={inputCls}>
              <option value="">Sem vínculo</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="sm:col-span-2">
          <Field label="Observações">
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputCls} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">
          Cancelar
        </button>
        <button onClick={submit} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Salvando…' : 'Salvar lançamento'}
        </button>
      </div>
    </Dialog>
  );
}

function PayDialog({
  tx, methods, accounts, onClose, onDone,
}: {
  tx: Tx; methods: PaymentMethodRow[]; accounts: Opt[]; onClose: () => void; onDone: () => void;
}) {
  const paid = tx.payments.reduce((s, p) => s + p.amountCents, 0);
  const remaining = tx.amountCents - paid;
  const [amount, setAmount] = useState((remaining / 100).toFixed(2));
  const [methodId, setMethodId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const cents = Math.round(Number(amount.replace(/\./g, '').replace(',', '.')) * 100);
    const r = await fetch(`/api/admin/finance/transactions/${tx.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: cents, methodId: methodId || null, accountId: accountId || null }),
    });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) {
      setError(d.error ?? 'Não foi possível registrar.');
      return;
    }
    onDone();
  };

  return (
    <Dialog open onClose={onClose} title="Registrar pagamento">
      <p className="text-sm text-ink-soft">
        {tx.description} · total <strong>{formatBRL(tx.amountCents)}</strong>
        {paid > 0 && <> · já liquidado <strong>{formatBRL(paid)}</strong></>} · restante <strong>{formatBRL(remaining)}</strong>
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Valor (R$)" hint="Pode ser parcial; o restante permanece pendente.">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={inputCls} />
        </Field>
        <Field label="Forma de pagamento">
          <select value={methodId} onChange={(e) => setMethodId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Conta">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
        <button onClick={submit} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </Dialog>
  );
}
