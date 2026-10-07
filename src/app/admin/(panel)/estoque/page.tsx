'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, Package, Plus, SlidersHorizontal } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Item = {
  id: string; name: string; category: string; unit: string; displayUnit: string | null;
  quantity: number; minQuantity: number; costCents: number; purchaseUnitAmount: number | null;
  expiryDate: string | null; archived: boolean;
  supplier?: { id: string; name: string } | null;
  _count?: { movements: number };
};
type Movement = {
  id: string; type: string; quantity: number; delta: number; balanceAfter: number;
  reason: string | null; createdAt: string; bookingId: string | null;
};
type Supplier = { id: string; name: string };

const CATEGORIES = ['LIMPEZA', 'IMPERMEABILIZANTE', 'EPI', 'FERRAMENTA', 'OUTRO'] as const;
const CAT_LABELS: Record<string, string> = {
  LIMPEZA: 'Limpeza', IMPERMEABILIZANTE: 'Impermeabilizante', EPI: 'EPI', FERRAMENTA: 'Ferramenta', OUTRO: 'Outro',
};
const TYPE_LABELS: Record<string, string> = { ENTRADA: 'Entrada', SAIDA: 'Saída', CONSUMO: 'Consumo em serviço', AJUSTE: 'Ajuste de inventário' };

function fmtQty(q: number, unit: string) {
  if (unit === 'ml' && q >= 1000) return `${(q / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`;
  if (unit === 'g' && q >= 1000) return `${(q / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
  return `${q.toLocaleString('pt-BR')} ${unit}`;
}

export default function EstoquePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [belowMin, setBelowMin] = useState(false);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [movItem, setMovItem] = useState<Item | null>(null);
  const [movHistory, setMovHistory] = useState<Movement[] | null>(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (belowMin) params.set('belowMin', '1');
    if (q) params.set('q', q);
    fetch(`/api/admin/inventory?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.ok ? d.items : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((r) => r.json())
      .then((d) => d.ok && setSuppliers(d.suppliers ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [category, belowMin, q]);

  const openHistory = async (item: Item) => {
    const r = await fetch(`/api/admin/inventory/${item.id}/movements`);
    const d = await r.json();
    setMovHistory(d.ok ? d.movements : []);
  };

  return (
    <div>
      <PageTitle
        title="Estoque"
        subtitle="Controle de insumos em unidade base (ml, g, un). Saídas por agendamento não são automáticas — registre consumos manualmente."
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo item
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select aria-label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} max-w-52`}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CAT_LABELS[c]}</option>
          ))}
        </select>
        <input aria-label="Buscar" placeholder="Buscar item…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} max-w-64`} />
        <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-sm font-semibold text-deep">
          <input type="checkbox" checked={belowMin} onChange={(e) => setBelowMin(e.target.checked)} className="h-4 w-4 accent-[#1668b0]" />
          Abaixo do mínimo
        </label>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nenhum item no estoque" hint="Cadastre produtos de limpeza, impermeabilizantes, EPIs e ferramentas para acompanhar saldos e mínimos." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => {
            const low = it.quantity < it.minQuantity;
            return (
              <article key={it.id} className={`rounded-3xl border bg-white p-5 shadow-soft ${low ? 'border-amber-300' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold text-deep">{it.name}</p>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      {CAT_LABELS[it.category] ?? it.category}
                      {it.supplier ? ` · ${it.supplier.name}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${low ? 'bg-amber-50 text-amber-700' : 'bg-aqua-50 text-brand'}`}>
                    <Package className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <p className={`font-display mt-3 text-2xl font-extrabold ${low ? 'text-amber-700' : 'text-deep'}`}>{fmtQty(it.quantity, it.unit)}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Mínimo: {fmtQty(it.minQuantity, it.unit)}
                  {it.expiryDate ? ` · Vence: ${new Date(it.expiryDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setMovItem(it)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-deep transition-colors hover:border-brand hover:text-brand"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Movimentar
                  </button>
                  <button
                    onClick={() => openHistory(it)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
                  >
                    Histórico ({it._count?.movements ?? 0})
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showNew && (
        <NewItemDialog
          suppliers={suppliers}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
            toast.success('Item cadastrado.');
          }}
        />
      )}
      {movItem && (
        <MovementDialog
          item={movItem}
          onClose={() => setMovItem(null)}
          onDone={() => {
            setMovItem(null);
            load();
            toast.success('Movimentação registrada.');
          }}
        />
      )}
      {movHistory && <HistoryDialog item={items.find((i) => i.id === movHistory[0]?.id) ?? null} movements={movHistory} onClose={() => setMovHistory(null)} />}
    </div>
  );
}

function NewItemDialog({ suppliers, onClose, onCreated }: { suppliers: Supplier[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', category: 'LIMPEZA', unit: 'ml', displayUnit: '', minQuantity: '0',
    cost: '', purchaseUnitAmount: '', supplierId: '', expiryDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setError(null);
    const r = await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        unit: form.unit,
        displayUnit: form.displayUnit || null,
        minQuantity: Number(form.minQuantity) || 0,
        costCents: form.cost ? Math.round(Number(form.cost.replace(',', '.')) * 100) : 0,
        purchaseUnitAmount: form.purchaseUnitAmount ? Number(form.purchaseUnitAmount) : null,
        supplierId: form.supplierId || null,
        expiryDate: form.expiryDate || null,
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

  return (
    <Dialog open onClose={onClose} title="Novo item de estoque">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nome">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Shampoo neutro para estofados" className={inputCls} />
          </Field>
        </div>
        <Field label="Categoria">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CAT_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Unidade base" hint="Estoque é contado na unidade base.">
          <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls}>
            <option value="ml">ml (líquidos)</option>
            <option value="g">g (pós)</option>
            <option value="un">un (unidades)</option>
          </select>
        </Field>
        <Field label="Saldo mínimo">
          <input value={form.minQuantity} onChange={(e) => set('minQuantity', e.target.value)} inputMode="numeric" className={inputCls} />
        </Field>
        <Field label="Conteúdo por compra" hint="Ex.: frasco de 1 L = 1000 ml.">
          <input value={form.purchaseUnitAmount} onChange={(e) => set('purchaseUnitAmount', e.target.value)} inputMode="numeric" className={inputCls} />
        </Field>
        <Field label="Custo por compra (R$)">
          <input value={form.cost} onChange={(e) => set('cost', e.target.value)} inputMode="decimal" placeholder="39,90" className={inputCls} />
        </Field>
        <Field label="Fornecedor">
          <select value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)} className={inputCls}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Vencimento (opcional)">
            <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
        <button onClick={submit} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Salvando…' : 'Salvar item'}
        </button>
      </div>
    </Dialog>
  );
}

function MovementDialog({ item, onClose, onDone }: { item: Item; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState('ENTRADA');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const r = await fetch(`/api/admin/inventory/${item.id}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, quantity: Number(qty), reason: reason || null }),
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
    <Dialog open onClose={onClose} title={`Movimentar: ${item.name}`}>
      <p className="text-sm text-ink-soft">
        Saldo atual: <strong>{fmtQty(item.quantity, item.unit)}</strong>
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="ENTRADA">Entrada (compra)</option>
            <option value="SAIDA">Saída</option>
            <option value="CONSUMO">Consumo em serviço</option>
            <option value="AJUSTE">Ajuste (inventário)</option>
          </select>
        </Field>
        <Field label="Quantidade" hint="Informe em unidade base (ex.: 500 para 500 ml).">
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Motivo / observação">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: recompra, uso em OS JC-2026-…" className={inputCls} />
          </Field>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-aqua-50 px-3.5 py-2.5 text-xs leading-relaxed text-brand-700">
        Cancelamento de agendamento não devolve automaticamente materiais — se um consumo precisar ser revertido, registre um ajuste explicando o motivo. Todo movimento fica no histórico com saldo resultante.
      </p>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
        <button onClick={submit} disabled={saving || !qty} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </Dialog>
  );
}

function HistoryDialog({ item, movements, onClose }: { item: Item | null; movements: Movement[]; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} title={`Histórico${item ? `: ${item.name}` : ' de movimentações'}`}>
      {movements.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nenhuma movimentação registrada.</p>
      ) : (
        <ul className="thin-scroll max-h-96 space-y-2 overflow-y-auto">
          {movements.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
              {m.delta >= 0 ? (
                <ArrowUpCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <ArrowDownCircle className="h-4.5 w-4.5 shrink-0 text-action" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-deep">
                  {TYPE_LABELS[m.type] ?? m.type} · {Math.abs(m.delta).toLocaleString('pt-BR')} {item?.unit ?? ''}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {m.reason ?? 'Sem motivo'} · saldo após: {m.balanceAfter.toLocaleString('pt-BR')}
                </p>
              </div>
              <time className="shrink-0 text-[11px] text-ink-soft/80">
                {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
