'use client';

/**
 * Assistente virtual da JC: interface própria, sugestões clicáveis,
 * reconhecimento de linguagem natural via base de FAQ no servidor
 * (POST /api/chat). Quando não sabe, diz isso e oferece o WhatsApp.
 * Fallback garantido: o FAQ funciona mesmo sem integração de LLM.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { sessionId, trackEvent } from './analytics';

type Msg = { role: 'user' | 'assistant'; content: string };

const WELCOME: Msg = {
  role: 'assistant',
  content: 'Olá! Sou o assistente virtual da JC Lavagem a Seco. Posso ajudar com serviços, orçamento, agendamento e dúvidas rápidas. O que você precisa?',
};

const DEFAULT_SUGGESTIONS = [
  'Quais serviços vocês oferecem?',
  'O atendimento é a domicílio?',
  'Quanto custa? Como pedir orçamento?',
  'Como funciona o agendamento?',
];

export function Chatbot({ whatsappIntl }: { whatsappIntl: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      trackEvent('CHAT_OPEN');
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  const ask = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId(), message }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: d.answer }]);
        if (d.suggestions?.length) setSuggestions(d.suggestions);
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: 'Tive um problema técnico agora. 😔 Você pode chamar direto no WhatsApp — o time responde rápido!' },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Não consegui me conectar. Chame no WhatsApp que lá tem gente de verdade respondendo!' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Fechar assistente virtual' : 'Abrir assistente virtual'}
        whileTap={{ scale: 0.92 }}
        className={`float-action fixed bottom-[10.5rem] right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lift transition-all duration-200 hover:scale-105 sm:bottom-[6.25rem] sm:h-[52px] sm:w-[52px] ${
          open ? 'bg-deep text-white' : 'bg-deep-600 text-aqua-200'
        }`}
        style={{ marginBottom: 0 }}
      >
        {open ? <X className="h-5.5 w-5.5" aria-hidden="true" /> : <Sparkles className="h-5.5 w-5.5" aria-hidden="true" />}
        {!open && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-action" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Assistente virtual da JC Lavagem a Seco"
            className="fixed bottom-[13.5rem] right-4 z-50 flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-lift sm:bottom-[9.5rem]"
          >
            <div className="relative overflow-hidden bg-hero-navy px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-aqua-200">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold">Assistente JC</p>
                  <p className="text-xs text-blue-100/80">Respondemos na hora — ou envie pro WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-ice px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md border border-border bg-white text-ink'
                    }`}
                  >
                    {m.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <p className="rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3" aria-label="Digitando">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:240ms]" />
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Sugestões */}
            <div className="flex gap-2 overflow-x-auto border-t border-border bg-white px-3 py-2.5 thin-scroll" aria-label="Perguntas sugeridas">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-aqua-200 bg-aqua-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-aqua-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 border-t border-border bg-white px-3 py-3"
            >
              <label className="sr-only" htmlFor="chat-input">Sua mensagem</label>
              <input
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva sua pergunta…"
                maxLength={300}
                autoComplete="off"
                className="min-h-11 flex-1 rounded-full border border-border bg-ice px-4 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Enviar mensagem"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action text-white transition-colors hover:bg-action-600 disabled:opacity-40"
              >
                <Send className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </form>

            <a
              href={`https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Queria falar com alguém do time da JC.')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('CHAT_WHATSAPP')}
              className="border-t border-border bg-ice py-2 text-center text-xs font-semibold text-brand hover:underline"
            >
              Prefiro falar com uma pessoa no WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
