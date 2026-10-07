'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';

/**
 * Criação do PRIMEIRO administrador.
 * Só funciona quando não há usuários no banco + token de configuração válido.
 * A senha escolhida aqui é a única credencial criada — não existe senha padrão.
 */
export default function SetupPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [form, setForm] = useState({ setupToken: '', name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/setup')
      .then((r) => r.json())
      .then((d) => {
        setAvailable(Boolean(d.available));
        setTokenConfigured(Boolean(d.tokenConfigured));
      })
      .catch(() => setAvailable(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error ?? 'Não foi possível concluir a configuração.');
        return;
      }
      router.push('/admin/painel');
      router.refresh();
    } catch {
      setError('Falha de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (available === false) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-deep">
        <ShieldCheck className="mx-auto h-10 w-10 text-brand" aria-hidden="true" />
        <h1 className="font-display mt-4 text-xl font-bold text-deep">Configuração indisponível</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Este painel já possui administradores cadastrados. Se você perdeu o acesso, use a
          página de recuperação ou solicite a outro administrador.
        </p>
        <a href="/admin/login" className="mt-5 inline-block text-sm font-bold text-brand hover:underline">
          Ir para o login
        </a>
      </div>
    );
  }

  if (available === null) return null;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white p-7 shadow-deep sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-50 text-brand">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-deep">Primeiro administrador</h1>
            <p className="text-sm text-ink-soft">Configuração única do painel</p>
          </div>
        </div>

        {!tokenConfigured && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O token de configuração ainda não foi definido no servidor (variável <code className="font-mono">ADMIN_SETUP_TOKEN</code> do arquivo <code className="font-mono">.env</code>).
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">Token de configuração</span>
            <input
              value={form.setupToken}
              onChange={(e) => setForm({ ...form, setupToken: e.target.value })}
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <span className="mt-1 block text-xs text-ink-soft">Definido na variável ADMIN_SETUP_TOKEN do .env do servidor.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">Seu nome</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">E-mail</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-deep">Senha (mín. 10 caracteres, com letras e números)</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={10} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-action">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Criar administrador e entrar
          </button>
        </form>
      </div>
    </div>
  );
}
