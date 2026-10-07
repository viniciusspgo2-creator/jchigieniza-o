'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImage } from '@/lib/client-image';
import Image from 'next/image';
import { toast } from 'sonner';
import { Images, Plus, Trash2 } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Item = {
  id: string; title: string; description: string | null; category: string | null;
  image: string; imageAlt: string; beforeImage: string | null; afterImage: string | null;
  isComparator: boolean; active: boolean; sortOrder: number;
};

const CATS = [
  { value: 'casa', label: 'Casa e conforto' },
  { value: 'infantil', label: 'Itens infantis' },
  { value: 'veicular', label: 'Interior veicular' },
  { value: 'protecao', label: 'Proteção' },
];

const emptyForm = {
  title: '', description: '', category: 'casa', image: '', imageAlt: '',
  beforeImage: '', afterImage: '', isComparator: false, active: true,
};

export default function GaleriaPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Item } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/gallery')
      .then((r) => r.json())
      .then((d) => setItems(d.ok ? d.items : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setDialog({ open: true });
  };
  const openEdit = (it: Item) => {
    setForm({
      title: it.title, description: it.description ?? '', category: it.category ?? 'casa',
      image: it.image, imageAlt: it.imageAlt, beforeImage: it.beforeImage ?? '', afterImage: it.afterImage ?? '',
      isComparator: it.isComparator, active: it.active,
    });
    setError(null);
    setDialog({ open: true, edit: it });
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const url = dialog?.edit ? `/api/admin/gallery/${dialog.edit.id}` : '/api/admin/gallery';
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
    toast.success(dialog?.edit ? 'Item atualizado.' : 'Item adicionado à galeria.');
  };

  const remove = async (it: Item) => {
    if (!confirm(`Remover "${it.title}" da galeria? A foto original não é apagada do servidor.`)) return;
    const r = await fetch(`/api/admin/gallery/${it.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success('Item removido.');
    } else {
      toast.error(d.error ?? 'Ação falhou.');
    }
  };

  return (
    <div>
      <PageTitle
        title="Galeria"
        subtitle="Somente fotos reais de atendimentos executados. O comparador mostra antes/depois quando você cadastrar as duas imagens."
        actions={
          <button
            onClick={openNew}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar item
          </button>
        }
      />

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty title="Galeria vazia" hint="Adicione fotos reais com autorização de uso. Ilustrações não devem ser apresentadas como trabalho executado." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <article key={it.id} className={`overflow-hidden rounded-3xl border border-border bg-white shadow-soft ${it.active ? '' : 'opacity-60'}`}>
              <div className="relative aspect-4/3 bg-ice">
                <Image src={it.image} alt={it.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-deep/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {it.isComparator ? 'Comparador' : (CATS.find((c) => c.value === it.category)?.label ?? 'Resultado')}
                </span>
                {!it.active && (
                  <span className="absolute right-3 top-3 rounded-full bg-action px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Oculta</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-display text-sm font-bold text-deep">{it.title}</p>
                {it.description && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{it.description}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEdit(it)}
                    className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-deep transition-colors hover:border-brand hover:text-brand"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(it)}
                    aria-label={`Remover ${it.title}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-action hover:text-action"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog?.open && (
        <GalleryDialog
          form={form}
          setForm={setForm}
          isEdit={Boolean(dialog.edit)}
          saving={saving}
          error={error}
          onClose={() => setDialog(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function UploadField({
  label, value, onChange, hint,
}: {
  label: string; value: string; onChange: (url: string) => void; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', await compressImage(file, 1800, 0.85));
      const r = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (r.status === 413) {
        toast.error('Imagem muito grande (limite ~4MB). Reduza o tamanho e tente de novo.');
        return;
      }
      const d = await r.json();
      if (d.ok) onChange(d.url);
      else toast.error(d.error ?? 'Falha no upload.');
    } catch {
      toast.error('Falha no upload. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/api/uploads/admin/img-… ou URL" className={inputCls} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-deep transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          <Images className="h-4 w-4" aria-hidden="true" /> {busy ? 'Enviando…' : 'Enviar'}
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>
    </Field>
  );
}

function GalleryDialog({
  form, setForm, isEdit, saving, error, onClose, onSubmit,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  isEdit: boolean; saving: boolean; error: string | null;
  onClose: () => void; onSubmit: () => void;
}) {
  const set = (k: keyof typeof emptyForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open wide onClose={onClose} title={isEdit ? 'Editar item da galeria' : 'Adicionar à galeria'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Título">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Descrição" hint="Explique o serviço realizado sem prometer resultados garantidos.">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inputCls} />
          </Field>
        </div>
        <Field label="Categoria">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Texto alternativo (acessibilidade)">
          <input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <UploadField label="Imagem principal" value={form.image} onChange={(url) => set('image', url)} hint="JPG, PNG ou WebP até 4MB. Convertida para WebP automaticamente." />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-deep">
            <input type="checkbox" checked={form.isComparator} onChange={(e) => set('isComparator', e.target.checked)} className="h-4 w-4 accent-[#1668b0]" />
            Exibir como comparador antes/depois (acessível por teclado)
          </label>
        </div>
        {form.isComparator && (
          <>
            <UploadField label="Imagem ANTES" value={form.beforeImage} onChange={(url) => set('beforeImage', url)} />
            <UploadField label="Imagem DEPOIS" value={form.afterImage} onChange={(url) => set('afterImage', url)} />
          </>
        )}
        <div className="sm:col-span-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-deep">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-[#1668b0]" />
            Visível no site
          </label>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
        <button onClick={onSubmit} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Dialog>
  );
}
