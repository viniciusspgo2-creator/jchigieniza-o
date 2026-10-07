'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Save } from 'lucide-react';
import { Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type SeoBlock = { metaTitle: string; metaDescription: string; keywords: string[] };

export default function SeoPage() {
  const [seo, setSeo] = useState<SeoBlock | null>(null);
  const [keywordsText, setKeywordsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.settings?.seo) {
          setSeo(d.settings.seo);
          setKeywordsText((d.settings.seo.keywords ?? []).join(', '));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!seo) return;
    setSaving(true);
    const value: SeoBlock = {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: keywordsText.split(',').map((k) => k.trim()).filter(Boolean),
    };
    const r = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'seo', value }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.ok) toast.success('Configurações de SEO salvas.');
    else toast.error(d.error ?? 'Falha ao salvar.');
  };

  if (loading || !seo) return <Loading />;

  return (
    <div>
      <PageTitle
        title="SEO"
        subtitle="Título e descrição usados na home e como padrão de todo o site. Artigos têm metas próprias na tela do Blog."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-2">
          <div className="grid gap-4">
            <Field label="Meta título" hint={`${seo.metaTitle.length}/60 caracteres recomendados`}>
              <input className={inputCls} value={seo.metaTitle} maxLength={70} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} />
            </Field>
            <Field label="Meta descrição" hint={`${seo.metaDescription.length}/160 caracteres recomendados`}>
              <textarea className={inputCls} rows={3} value={seo.metaDescription} maxLength={180} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} />
            </Field>
            <Field label="Palavras-chave locais" hint="Separadas por vírgula. Use termos que clientes reais pesquisam, como serviços + cidade/bairro.">
              <textarea className={inputCls} rows={3} value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} />
            </Field>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" /> Salvar
          </button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
            <p className="font-display text-sm font-bold text-deep">Infraestrutura ativa</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              <li>✓ Sitemap dinâmico com artigos publicados</li>
              <li>✓ Robots.txt bloqueando /admin</li>
              <li>✓ Canonical por página</li>
              <li>✓ Open Graph com imagem da marca</li>
              <li>✓ LocalBusiness (dados reais da empresa)</li>
              <li>✓ BlogPosting nos artigos</li>
              <li>✓ Painel não indexável</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
            <p className="font-display text-sm font-bold text-deep">Verificar</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> /sitemap.xml
              </a>
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> /robots.txt
              </a>
            </div>
          </div>
          <div className="rounded-2xl bg-aqua-50 p-4 text-xs leading-relaxed text-brand-700">
            Prévia do resultado de busca (Google pode reescrever):
            <p className="mt-2 truncate text-sm font-semibold text-deep">{seo.metaTitle}</p>
            <p className="text-[13px] text-ink-soft">{seo.metaDescription}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
