'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, LifeBuoy } from 'lucide-react';

export default function RecuperarPage() {
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setMessage(d.message ?? d.error);
      if (d.ok) setStep('confirm');
    } catch {
      setError('Falha de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/auth/recuperar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error ?? 'Token inválido.');
        return;
      }
      setMessage(d.message);
      setStep('done');
    } catch {
      setError('Falha de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white p-7 shadow-deep sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-50 text-brand">
            <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-deep">Recuperar acesso</h1>
            <p className="text-sm text-ink-soft">Solicite um token e defina nova senha</p>
          </div>
        </div>

        {step === 'request' && (
          <form onSubmit={request} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-deep">E-mail cadastrado</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </label>
            {message && <p className="rounded-xl border border-aqua-200 bg-aqua-50 px-4 py-3 text-sm text-brand-700">{message}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">{error}</p>}
            <button disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Solicitar token
            </button>
            <p className="text-xs leading-relaxed text-ink-soft">
              Sem serviço de e-mail configurado, o token é entregue a um administrador do painel, que repassa por canal
              seguro (WhatsApp/telefone). Isso evita o uso indevido da recuperação.
            </p>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={confirm} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-deep">Token recebido</span>
              <input value={token} onChange={(e) => setToken(e.target.value)} required className="w-full rounded-xl border border-border px-4 py-2.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-deep">Nova senha (mín. 10 caracteres)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">{error}</p>}
            <button disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Redefinir senha
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <p className="rounded-xl border border-aqua-200 bg-aqua-50 px-4 py-3 text-sm text-brand-700">{message}</p>
            <Link href="/admin/login" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-700">
              Ir para o login
            </Link>
          </div>
        )}

        <Link href="/admin/login" className="mt-4 block text-center text-sm font-medium text-brand hover:underline">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
