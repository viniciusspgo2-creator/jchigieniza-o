'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error ?? 'Não foi possível entrar.');
        return;
      }
      router.push('/admin/painel');
      router.refresh();
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <Image src="/img/brand/logo-jc-escuro.png" alt="JC Lavagem a Seco" width={220} height={85} className="h-16 w-auto" priority />
      </div>
      <div className="rounded-3xl bg-white p-7 shadow-deep sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-50 text-brand">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-deep">Painel administrativo</h1>
            <p className="text-sm text-ink-soft">Acesso restrito à equipe</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="min-h-11 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="min-h-11 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Entrar
          </button>
        </form>

        <Link href="/admin/recuperar" className="mt-4 block text-center text-sm font-medium text-brand hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <p className="mt-5 text-center text-xs text-blue-100/60">
        Área protegida. Tentativas de acesso são registradas em auditoria.
      </p>
    </div>
  );
}
