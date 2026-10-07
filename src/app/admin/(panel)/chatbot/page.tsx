'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bot, Plus, Send, Trash2 } from 'lucide-react';
import { Dialog, Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Faq = {
  id: string; question: string; answer: string; keywords: string;
  active: boolean; showOnSite: boolean; sortOrder: number;
};

const emptyForm = { question: '', answer: '', keywords: '', showOnSite: true, active: true, sortOrder: 50 };

export default function ChatbotPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Faq } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/chat-faq')
      .then((r) => r.json())
      .then((d) => setFaqs(d.ok ? d.faqs : []))
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
  const openEdit = (f: Faq) => {
    setForm({ question: f.question, answer: f.answer, keywords: f.keywords, showOnSite: f.showOnSite, active: f.active, sortOrder: f.sortOrder });
    setError(null);
    setDialog({ open: true, edit: f });
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const url = dialog?.edit ? `/api/admin/chat-faq/${dialog.edit.id}` : '/api/admin/chat-faq';
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
    toast.success(dialog?.edit ? 'FAQ atualizada.' : 'FAQ adicionada.');
  };

  const toggle = async (f: Faq, field: 'active' | 'showOnSite') => {
    const r = await fetch(`/api/admin/chat-faq/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !f[field] }),
    });
    const d = await r.json();
    if (d.ok) load();
    else toast.error(d.error ?? 'Ação falhou.');
  };

  const remove = async (f: Faq) => {
    if (!confirm(`Excluir a FAQ "${f.question}"?`)) return;
    const r = await fetch(`/api/admin/chat-faq/${f.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success('FAQ excluída.');
    } else {
      toast.error(d.error ?? 'Ação falhou.');
    }
  };

  return (
    <div>
      <PageTitle
        title="Chatbot"
        subtitle="Perguntas e respostas usadas pelo assistente do site. O reconhecimento usa palavras-chave; sem resposta, ele admite não saber e oferece o WhatsApp."
        actions={
          <button
            onClick={openNew}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Nova FAQ
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-label="Lista de FAQs">
          {loading ? (
            <Loading />
          ) : faqs.length === 0 ? (
            <Empty title="Nenhuma FAQ" hint="Cadastre perguntas frequentes para o chatbot responder automaticamente." />
          ) : (
            <ul className="space-y-3">
              {faqs.map((f) => (
                <li key={f.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-deep">{f.question}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{f.answer}</p>
                      <p className="mt-1.5 truncate text-[11px] text-ink-soft/75">Palavras-chave: {f.keywords}</p>
                    </div>
                    <Bot className={`h-5 w-5 shrink-0 ${f.active ? 'text-brand' : 'text-ink-soft/40'}`} aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => openEdit(f)} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-deep hover:border-brand hover:text-brand">
                      Editar
                    </button>
                    <button onClick={() => toggle(f, 'active')} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand">
                      {f.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => toggle(f, 'showOnSite')} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand">
                      {f.showOnSite ? 'Ocultar do site' : 'Mostrar no site'}
                    </button>
                    <button
                      onClick={() => remove(f)}
                      aria-label={`Excluir ${f.question}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-action hover:text-action"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2" aria-label="Testar o chatbot">
          <ChatTester />
        </section>
      </div>

      {dialog?.open && (
        <Dialog open onClose={() => setDialog(null)} title={dialog.edit ? 'Editar FAQ' : 'Nova FAQ'}>
          <div className="grid gap-4">
            <Field label="Pergunta">
              <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Resposta" hint="Sem prometer preços, prazos ou garantias que não sejam reais.">
              <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className={inputCls} />
            </Field>
            <Field label="Palavras-chave" hint="Separadas por vírgula. Pense em como o cliente escreve, incluindo sem acento.">
              <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-deep">
                <input type="checkbox" checked={form.showOnSite} onChange={(e) => setForm({ ...form, showOnSite: e.target.checked })} className="h-4 w-4 accent-[#1668b0]" />
                Exibir na seção de dúvidas do site
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-deep">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-[#1668b0]" />
                Ativa no chatbot
              </label>
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

function ChatTester() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'admin-test-panel', message: text }),
      });
      const d = await r.json();
      setMessages((m) => [...m, { role: 'assistant', content: d.ok ? d.reply : 'Erro ao testar. Verifique o servidor.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Erro de conexão.' }]);
    }
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-base font-bold text-deep">Testar respostas</p>
      <p className="mt-1 text-xs text-ink-soft">
        Simule perguntas de clientes. O teste não grava conversa de cliente — apenas valida o reconhecimento.
      </p>

      <div className="thin-scroll mt-4 max-h-96 min-h-48 flex-1 space-y-2.5 overflow-y-auto rounded-2xl bg-ice p-3.5">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">Ex.: “Quanto custa limpar um sofá de 3 lugares?”</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'ml-auto bg-brand text-white' : 'bg-white text-deep shadow-soft'}`}>
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-ink-soft">Digitando…</p>}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite a pergunta…"
          aria-label="Mensagem de teste"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Enviar"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
