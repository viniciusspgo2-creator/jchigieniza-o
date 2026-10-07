'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Save, Trash2 } from 'lucide-react';
import { Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type SiteData = {
  brand: { name: string; responsible: string; tagline: string; logoLight: string; logoDark: string };
  contact: Record<string, string>;
  flags: { freePickupVisible: boolean; resultsVisible: boolean };
  hero: { badge: string; title1: string; title2: string; subtitle: string; image: string; imageAlt: string; ctaPrimary: string; ctaSecondary: string };
  problem: { title: string; text: string };
  servicesIntro: { title: string; text: string };
  resultsIntro: { title: string; text: string; note: string };
  howItWorks: { title: string; text: string };
  differentials: { title: string; text: string };
  bookingIntro: { title: string; text: string };
  faqIntro: { title: string; text: string };
  blogIntro: { title: string; text: string };
  contactIntro: { title: string; text: string };
  ctaBar: { text: string; button: string };
  sectionsOrder: { id: string; visible: boolean }[];
};

const SECTION_LABELS: Record<string, string> = {
  servicos: 'Serviços', resultados: 'Resultados', 'como-funciona': 'Como funciona',
  diferenciais: 'Diferenciais', agendamento: 'Agendamento', duvidas: 'Dúvidas',
  blog: 'Blog', contato: 'Contato',
};

type BlockKey = keyof SiteData;

export default function ConteudoPage() {
  const [published, setPublished] = useState<SiteData | null>(null);
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<BlockKey>('hero');
  const [edit, setEdit] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPublished(d.published);
          setDrafts(d.drafts ?? {});
          setEdit((d.drafts?.[tab] as Record<string, unknown>) ?? structuredClone(d.published[tab] as Record<string, unknown>));
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const switchTab = (key: BlockKey) => {
    setTab(key);
    if (!published) return;
    setEdit((drafts[key] as Record<string, unknown>) ?? structuredClone(published[key] as Record<string, unknown>));
  };

  const setField = (k: string, v: unknown) => setEdit((e) => ({ ...e, [k]: v }));

  const save = async (publish: boolean) => {
    setSaving(true);
    const r = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: tab, value: edit, publish }),
    });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) {
      toast.error(d.error ?? 'Falha ao salvar.');
      return;
    }
    load();
    toast.success(publish ? 'Bloco publicado no site.' : 'Rascunho salvo. O site segue mostrando a versão publicada.');
  };

  const discard = async () => {
    const r = await fetch(`/api/admin/content?key=${tab}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success('Rascunho descartado.');
    }
  };

  if (loading || !published) return <Loading />;

  const hasDraft = Boolean(drafts[tab]);
  const tabs: { key: BlockKey; label: string }[] = [
    { key: 'brand', label: 'Marca' },
    { key: 'contact', label: 'Contato' },
    { key: 'flags', label: 'Exibições' },
    { key: 'hero', label: 'Hero' },
    { key: 'problem', label: 'Problema' },
    { key: 'servicesIntro', label: 'Serviços (intro)' },
    { key: 'resultsIntro', label: 'Resultados (intro)' },
    { key: 'howItWorks', label: 'Como funciona' },
    { key: 'differentials', label: 'Diferenciais' },
    { key: 'bookingIntro', label: 'Agendamento (intro)' },
    { key: 'faqIntro', label: 'Dúvidas (intro)' },
    { key: 'blogIntro', label: 'Blog (intro)' },
    { key: 'contactIntro', label: 'Contato (intro)' },
    { key: 'ctaBar', label: 'Barra CTA' },
    { key: 'sectionsOrder', label: 'Ordem das seções' },
  ];

  return (
    <div>
      <PageTitle
        title="Conteúdo do site"
        subtitle="Edite textos e configurações por bloco. Publicar aplica a versão no site imediatamente; rascunhos ficam só no painel."
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Blocos de conteúdo">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => switchTab(t.key)}
            className={`relative min-h-9 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
              tab === t.key ? 'border-brand bg-brand text-white' : 'border-border bg-white text-ink-soft hover:border-brand hover:text-brand'
            }`}
          >
            {t.label}
            {Boolean(drafts[t.key]) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" aria-label="Rascunho pendente" />
            )}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
        {tab === 'brand' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><input className={inputCls} value={String(edit.name ?? '')} onChange={(e) => setField('name', e.target.value)} /></Field>
            <Field label="Responsável"><input className={inputCls} value={String(edit.responsible ?? '')} onChange={(e) => setField('responsible', e.target.value)} /></Field>
            <Field label="Assinatura"><input className={inputCls} value={String(edit.tagline ?? '')} onChange={(e) => setField('tagline', e.target.value)} /></Field>
            <Field label="Logo claro (fundo escuro)" hint="Envie em /admin/galeria e cole a URL aqui, ou use /img/brand/…"><input className={inputCls} value={String(edit.logoLight ?? '')} onChange={(e) => setField('logoLight', e.target.value)} /></Field>
            <Field label="Logo escuro (fundo claro)"><input className={inputCls} value={String(edit.logoDark ?? '')} onChange={(e) => setField('logoDark', e.target.value)} /></Field>
          </div>
        )}

        {tab === 'contact' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone exibido"><input className={inputCls} value={String(edit.phoneDisplay ?? '')} onChange={(e) => setField('phoneDisplay', e.target.value)} /></Field>
            <Field label="WhatsApp internacional" hint="Somente números, com 55 + DDD."><input className={inputCls} value={String(edit.whatsappIntl ?? '')} onChange={(e) => setField('whatsappIntl', e.target.value)} /></Field>
            <Field label="Instagram (usuário)"><input className={inputCls} value={String(edit.instagram ?? '')} onChange={(e) => setField('instagram', e.target.value)} /></Field>
            <Field label="Instagram (URL)"><input className={inputCls} value={String(edit.instagramUrl ?? '')} onChange={(e) => setField('instagramUrl', e.target.value)} /></Field>
            <Field label="Endereço (rua)"><input className={inputCls} value={String(edit.addressStreet ?? '')} onChange={(e) => setField('addressStreet', e.target.value)} /></Field>
            <Field label="Bairro"><input className={inputCls} value={String(edit.addressDistrict ?? '')} onChange={(e) => setField('addressDistrict', e.target.value)} /></Field>
            <Field label="Cidade"><input className={inputCls} value={String(edit.addressCity ?? '')} onChange={(e) => setField('addressCity', e.target.value)} /></Field>
            <Field label="UF"><input className={inputCls} value={String(edit.addressState ?? '')} onChange={(e) => setField('addressState', e.target.value)} /></Field>
            <Field label="CEP"><input className={inputCls} value={String(edit.addressZip ?? '')} onChange={(e) => setField('addressZip', e.target.value)} /></Field>
            <Field label="Horário de atendimento"><input className={inputCls} value={String(edit.hoursText ?? '')} onChange={(e) => setField('hoursText', e.target.value)} /></Field>
            <div className="sm:col-span-2">
              <Field label="Área de atendimento"><input className={inputCls} value={String(edit.areaText ?? '')} onChange={(e) => setField('areaText', e.target.value)} /></Field>
            </div>
          </div>
        )}

        {tab === 'flags' && (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1668b0]" checked={Boolean(edit.freePickupVisible)} onChange={(e) => setField('freePickupVisible', e.target.checked)} />
              <span>
                <span className="block font-semibold text-deep">Exibir “sem taxa de deslocamento”</span>
                <span className="mt-1 block text-sm text-ink-soft">
                  Mantido DESLIGADO por padrão. Só ative após confirmar que o atendimento sem taxa cobre a sua área de serviço.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1668b0]" checked={Boolean(edit.resultsVisible)} onChange={(e) => setField('resultsVisible', e.target.checked)} />
              <span>
                <span className="block font-semibold text-deep">Exibir seção “Resultados”</span>
                <span className="mt-1 block text-sm text-ink-soft">Desligue caso prefira não mostrar fotos de atendimentos por enquanto.</span>
              </span>
            </label>
          </div>
        )}

        {tab === 'sectionsOrder' ? (
          <ul className="space-y-2">
            {((edit.sectionsOrder as { id: string; visible: boolean }[]) ?? []).map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
                <span className="font-semibold text-deep">{SECTION_LABELS[s.id] ?? s.id}</span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      const arr = [...((edit.sectionsOrder as { id: string; visible: boolean }[]) ?? [])];
                      if (i === 0) return;
                      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                      setField('sectionsOrder', arr);
                    }}
                    className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                    aria-label={`Mover ${SECTION_LABELS[s.id] ?? s.id} para cima`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      const arr = [...((edit.sectionsOrder as { id: string; visible: boolean }[]) ?? [])];
                      if (i === arr.length - 1) return;
                      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                      setField('sectionsOrder', arr);
                    }}
                    className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                    aria-label={`Mover ${SECTION_LABELS[s.id] ?? s.id} para baixo`}
                  >
                    ↓
                  </button>
                  <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <input
                      type="checkbox"
                      checked={s.visible}
                      onChange={(e) => {
                        const arr = [...((edit.sectionsOrder as { id: string; visible: boolean }[]) ?? [])];
                        arr[i] = { ...arr[i], visible: e.target.checked };
                        setField('sectionsOrder', arr);
                      }}
                      className="h-4 w-4 accent-[#1668b0]"
                    />
                    Visível
                  </label>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {'badge' in edit && (
              <div className="mb-4">
                <Field label="Selo do hero"><input className={inputCls} value={String(edit.badge ?? '')} onChange={(e) => setField('badge', e.target.value)} /></Field>
              </div>
            )}
            {'title1' in edit && (
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <Field label="Título (linha 1)"><input className={inputCls} value={String(edit.title1 ?? '')} onChange={(e) => setField('title1', e.target.value)} /></Field>
                <Field label="Título (linha 2, destaque)"><input className={inputCls} value={String(edit.title2 ?? '')} onChange={(e) => setField('title2', e.target.value)} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Subtítulo"><textarea rows={3} className={inputCls} value={String(edit.subtitle ?? '')} onChange={(e) => setField('subtitle', e.target.value)} /></Field>
                </div>
                <Field label="Imagem (URL)"><input className={inputCls} value={String(edit.image ?? '')} onChange={(e) => setField('image', e.target.value)} /></Field>
                <Field label="Alt da imagem"><input className={inputCls} value={String(edit.imageAlt ?? '')} onChange={(e) => setField('imageAlt', e.target.value)} /></Field>
                <Field label="CTA principal"><input className={inputCls} value={String(edit.ctaPrimary ?? '')} onChange={(e) => setField('ctaPrimary', e.target.value)} /></Field>
                <Field label="CTA secundário"><input className={inputCls} value={String(edit.ctaSecondary ?? '')} onChange={(e) => setField('ctaSecondary', e.target.value)} /></Field>
              </div>
            )}
            {'title' in edit && (
              <div className="grid gap-4">
                <Field label="Título do bloco"><input className={inputCls} value={String(edit.title ?? '')} onChange={(e) => setField('title', e.target.value)} /></Field>
                {'text' in edit && <Field label="Texto"><textarea rows={3} className={inputCls} value={String(edit.text ?? '')} onChange={(e) => setField('text', e.target.value)} /></Field>}
                {'note' in edit && <Field label="Nota de rodapé (limites honestos)"><textarea rows={2} className={inputCls} value={String(edit.note ?? '')} onChange={(e) => setField('note', e.target.value)} /></Field>}
                {'button' in edit && <Field label="Botão"><input className={inputCls} value={String(edit.button ?? '')} onChange={(e) => setField('button', e.target.value)} /></Field>}
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> Publicar no site
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand px-4 text-sm font-semibold text-brand hover:bg-aqua-50 disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" /> Salvar rascunho
          </button>
          {hasDraft && (
            <button
              onClick={discard}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-ink-soft hover:border-action hover:text-action"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Descartar rascunho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
