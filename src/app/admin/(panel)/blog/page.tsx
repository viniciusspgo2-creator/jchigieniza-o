'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string;
  metaTitle: string | null; metaDescription: string | null; coverImage: string | null;
  coverAlt: string | null; authorName: string; status: string; publishedAt: string | null;
  updatedAt: string;
};

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', metaTitle: '', metaDescription: '',
  coverImage: '', coverAlt: '', authorName: 'Equipe JC Lavagem a Seco',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Post } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/posts')
      .then((r) => r.json())
      .then((d) => setPosts(d.ok ? d.posts : []))
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
  const openEdit = (p: Post) => {
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      metaTitle: p.metaTitle ?? '', metaDescription: p.metaDescription ?? '',
      coverImage: p.coverImage ?? '', coverAlt: p.coverAlt ?? '', authorName: p.authorName,
    });
    setError(null);
    setDialog({ open: true, edit: p });
  };

  const slugify = (v: string) =>
    v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

  const submit = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    const url = dialog?.edit ? `/api/admin/posts/${dialog.edit.id}` : '/api/admin/posts';
    const body: Record<string, unknown> = { ...form, status: publish ? 'PUBLISHED' : 'DRAFT' };
    if (!dialog?.edit) body.title = body.title || 'Rascunho sem título';
    const r = await fetch(url, {
      method: dialog?.edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) {
      setError(d.error ?? 'Não foi possível salvar.');
      return;
    }
    setDialog(null);
    load();
    toast.success(publish ? 'Artigo publicado.' : 'Rascunho salvo.');
  };

  const togglePublish = async (p: Post) => {
    const r = await fetch(`/api/admin/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unpublish: p.status === 'PUBLISHED' }),
    });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success(p.status === 'PUBLISHED' ? 'Artigo despublicado.' : 'Artigo publicado.');
    } else {
      toast.error(d.error ?? 'Ação falhou.');
    }
  };

  const remove = async (p: Post) => {
    if (!confirm(`Excluir "${p.title}"? Essa ação não pode ser desfeita.`)) return;
    const r = await fetch(`/api/admin/posts/${p.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success('Artigo excluído.');
    } else {
      toast.error(d.error ?? 'Ação falhou.');
    }
  };

  const words = form.content.split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <PageTitle
        title="Blog"
        subtitle="Artigos em Markdown. Publicar cria a página /blog/slug com dados estruturados automaticamente."
        actions={
          <button
            onClick={openNew}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo artigo
          </button>
        }
      />

      {loading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <Empty title="Nenhum artigo" hint="Crie artigos com título, resumo e conteúdo em Markdown." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-ice/60 text-left text-xs uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-3 font-bold">Artigo</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Publicação</th>
                  <th className="px-4 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-ice/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-deep">{p.title}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">/blog/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${p.status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {p.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {p.status === 'PUBLISHED' && (
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            aria-label={`Ver ${p.title} no site`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        )}
                        <button onClick={() => openEdit(p)} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-deep hover:border-brand hover:text-brand">
                          Editar
                        </button>
                        <button onClick={() => togglePublish(p)} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-deep hover:border-brand hover:text-brand">
                          {p.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => remove(p)}
                          aria-label={`Excluir ${p.title}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-action hover:text-action"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dialog?.open && (
        <Dialog open wide onClose={() => setDialog(null)} title={dialog.edit ? 'Editar artigo' : 'Novo artigo'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Título">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Slug" hint="Deixe vazio para gerar do título.">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                onBlur={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Autor">
              <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Resumo (excerpt)" hint="Aparece na listagem e na meta description, se não houver uma específica.">
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} maxLength={300} className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Conteúdo (Markdown)"
                hint={`Sem HTML cru — o conteúdo é sanitizado. ${words} palavras.`}
              >
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={14}
                  className={`${inputCls} font-mono text-[13px] leading-relaxed`}
                  placeholder={'## Subtítulo\n\nParágrafo com **negrito** e *itálico*.\n\n- item de lista'}
                />
              </Field>
            </div>
            <Field label="Meta title (SEO)">
              <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={70} className={inputCls} />
            </Field>
            <Field label="Meta description (SEO)">
              <input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={160} className={inputCls} />
            </Field>
            <Field label="Imagem de capa (URL)">
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="/api/uploads/admin/img-…" className={inputCls} />
            </Field>
            <Field label="Alt da capa">
              <input value={form.coverAlt} onChange={(e) => setForm({ ...form, coverAlt: e.target.value })} className={inputCls} />
            </Field>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-action">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className="min-h-10 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:bg-ice">Cancelar</button>
            <button onClick={() => submit(false)} disabled={saving} className="min-h-10 rounded-xl border border-brand px-4 text-sm font-semibold text-brand hover:bg-aqua-50 disabled:opacity-60">
              Salvar rascunho
            </button>
            <button onClick={() => submit(true)} disabled={saving} className="min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Salvando…' : 'Publicar'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
