'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Supplier = {
  id: string; name: string; contactName: string | null; phone: string | null; email: string | null;
  products: string | null; notes: string | null; archived: boolean;
};

const emptyForm = { name: '', contactName: '', phone: '', email: '', products: '', notes: '' };

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Supplier } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/suppliers')
      .then((r) => r.json())
      .then((d) => setSuppliers(d.ok ? d.suppliers : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const visible = suppliers.filter((s) => (showArchived ? true : !s.archived));

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setDialog({ open: true });
  };
  const openEdit = (s: Supplier) => {
    setForm({
      name: s.name, contactName: s.contactName ?? '', phone: s.phone ?? '', email: s.email ?? '',
      products: s.products ?? '', notes: s.notes ?? '',
    });
    setError(null);
    setDialog({ open: true, edit: s });
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const url = dialog?.edit ? `/api/admin/suppliers/${dialog.edit.id}` : '/api/admin/suppliers';
    const r = await fetch(url, {
      method: dialog?.edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) {
      setError(d.error ?? 'Não foi possível salvar.');
      return;
    }
    setDialog(null);
    load();
    toast.success(dialog?.edit ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.');
  };

  const toggleArchive = async (s: Supplier) => {
    const r = await fetch(`/api/admin/suppliers/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !s.archived }),
    });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success(s.archived ? 'Fornecedor reativado.' : 'Fornecedor arquivado.');
    } else {
      toast.error(d.error ?? 'Ação falhou.');
    }
  };

  return (
    <div>
      <PageTitle
        title="Fornecedores"
        subtitle="Contatos de onde vêm os insumos e equipamentos. Arquivar não apaga o histórico de compras."
        actions={
          <button
            onClick={openNew}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo fornecedor
          </button>
        }
      />

      <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-soft">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 accent-[#1668b0]" />
        Mostrar arquivados
      </label>

      {loading ? (
        <Loading />
      ) : visible.length === 0 ? (
        <Empty title="Nenhum fornecedor cadastrado" hint="Cadastre fornecedores para vincular às despesas e aos itens de estoque." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <article key={s.id} className={`rounded-3xl border bg-white p-5 shadow-soft ${s.archived ? 'border-border opacity-70' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-bold text-deep">{s.name}</p>
                  {s.contactName && <p className="text-xs font-semibold text-ink-soft">{s.contactName}</p>}
                </div>
                {s.archived && (
                  <span className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">Arquivado</span>
                )}
              </div>
              <dl className="mt-3 space-y-1 text-sm text-ink-soft">
                {s.phone && (
                  <div>
                    <dt className="sr-only">Telefone</dt>
                    <dd>📞 {s.phone}</dd>
                  </div>
                )}
                {s.email && (
                  <div>
                    <dt className="sr-only">E-mail</dt>
                    <dd className="break-all">✉ {s.email}</dd>
                  </div>
                )}
                {s.products && (
                  <div>
                    <dt className="sr-only">Produtos</dt>
                    <dd className="line-clamp-2">{s.products}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-deep transition-colors hover:border-brand hover:text-brand"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                </button>
                <button
                  onClick={() => toggleArchive(s)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-action hover:text-action"
                >
                  {s.archived ? <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" /> : <Archive className="h-3.5 w-3.5" aria-hidden="true" />}
                  {s.archived ? 'Reativar' : 'Arquivar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog?.open && (
        <Dialog open onClose={() => setDialog(null)} title={dialog.edit ? 'Editar fornecedor' : 'Novo fornecedor'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nome">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Pessoa de contato">
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(62) 9…" className={inputCls} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Produtos">
              <input value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} placeholder="Ex.: shampoos, impermeabilizante" className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações">
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} />
              </Field>
            </div>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
            <button onClick={submit} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
