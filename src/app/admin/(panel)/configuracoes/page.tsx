'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Empty, Field, inputCls, Loading, PageTitle } from '@/components/admin/ui-bits';

type Rule = {
  weekday: number; active: boolean; openTime: string | null; closeTime: string | null;
  slotMinutes: number; capacityPerSlot: number; breakStart: string | null; breakEnd: string | null;
};
type Block = { id: string; date: string; timeSlot: string | null; reason: string | null };
type Method = { id: string; name: string; active: boolean; sortOrder: number };
type UserRow = { id: string; name: string; email: string; role: string; active: boolean };

const WD = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function ConfiguracoesPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: '', timeSlot: '', reason: '' });
  const [newMethod, setNewMethod] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'OPERADOR', password: '' });
  const [tab, setTab] = useState<'horarios' | 'pagamentos' | 'equipe'>('horarios');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/hours').then((r) => r.json()),
      fetch('/api/admin/payment-methods').then((r) => r.json()),
      fetch('/api/admin/auth/me').then((r) => r.json()),
      fetch('/api/admin/users')
        .then((r) => r.json())
        .catch(() => ({ ok: false })),
    ])
      .then(([h, pm, me, u]) => {
        if (h.ok) {
          setRules(h.rules);
          setBlocks(h.blocks);
        }
        if (pm.ok) setMethods(pm.methods);
        if (me.ok) setIsAdmin(me.user?.role === 'ADMIN');
        if (u.ok) setUsers(u.users ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const saveHours = async () => {
    if (!rules) return;
    setSavingHours(true);
    const r = await fetch('/api/admin/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    const d = await r.json();
    setSavingHours(false);
    if (d.ok) toast.success('Horários salvos. A agenda pública já considera as novas regras.');
    else toast.error(d.error ?? 'Falha ao salvar.');
  };

  const addBlock = async () => {
    if (!newBlock.date) return;
    const r = await fetch('/api/admin/hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newBlock.date, timeSlot: newBlock.timeSlot || null, reason: newBlock.reason || null }),
    });
    const d = await r.json();
    if (d.ok) {
      setNewBlock({ date: '', timeSlot: '', reason: '' });
      load();
      toast.success('Folga/bloqueio criado.');
    } else {
      toast.error(d.error ?? 'Falha ao criar.');
    }
  };

  const removeBlock = async (b: Block) => {
    const r = await fetch(`/api/admin/hours/blocks/${b.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success('Bloqueio removido.');
    }
  };

  const addMethod = async () => {
    if (!newMethod.trim()) return;
    const r = await fetch('/api/admin/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newMethod }),
    });
    const d = await r.json();
    if (d.ok) {
      setNewMethod('');
      load();
      toast.success('Forma de pagamento adicionada.');
    } else {
      toast.error(d.error ?? 'Falha.');
    }
  };

  const toggleMethod = async (m: Method) => {
    const r = await fetch('/api/admin/payment-methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, active: !m.active }),
    });
    const d = await r.json();
    if (d.ok) load();
    else toast.error(d.error ?? 'Falha.');
  };

  const createUser = async () => {
    const r = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const d = await r.json();
    if (d.ok) {
      setNewUser({ name: '', email: '', role: 'OPERADOR', password: '' });
      load();
      toast.success('Usuário criado. Peça para trocar a senha no primeiro acesso.');
    } else {
      toast.error(d.error ?? 'Falha ao criar usuário.');
    }
  };

  const toggleUser = async (u: UserRow) => {
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    });
    const d = await r.json();
    if (d.ok) {
      load();
      toast.success(u.active ? 'Usuário desativado.' : 'Usuário reativado.');
    } else {
      toast.error(d.error ?? 'Falha.');
    }
  };

  const resetPassword = async (u: UserRow) => {
    if (!confirm(`Gerar link de redefinição para ${u.email}?`)) return;
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetPassword: true }),
    });
    const d = await r.json();
    if (d.ok) {
      toast.success('Link gerado (válido por 24h).');
      if (d.resetUrl) {
        await navigator.clipboard?.writeText(d.resetUrl).catch(() => {});
        toast.info('Link copiado para a área de transferência.');
      }
    } else {
      toast.error(d.error ?? 'Falha.');
    }
  };

  if (loading || !rules) return <Loading />;

  const setRule = (i: number, patch: Partial<Rule>) => {
    const arr = [...rules];
    arr[i] = { ...arr[i], ...patch };
    setRules(arr);
  };

  return (
    <div>
      <PageTitle title="Configurações" subtitle="Agenda, formas de pagamento e equipe. Toda alteração relevante fica registrada no histórico de auditoria." />

      <div className="mb-5 flex flex-wrap gap-2">
        {([['horarios', 'Horários e agenda'], ['pagamentos', 'Formas de pagamento'], ['equipe', 'Equipe']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={`min-h-9 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
              tab === k ? 'border-brand bg-brand text-white' : 'border-border bg-white text-ink-soft hover:border-brand hover:text-brand'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'horarios' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-3" aria-label="Horários semanais">
            <p className="font-display text-base font-bold text-deep">Horários da semana</p>
            <p className="mt-1 text-xs text-ink-soft">As janelas de agendamento do site são geradas a partir destas regras (fuso America/Sao_Paulo).</p>
            <ul className="mt-4 space-y-3">
              {rules.map((r, i) => (
                <li key={r.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
                  <label className="inline-flex w-28 cursor-pointer items-center gap-2 text-sm font-semibold text-deep">
                    <input type="checkbox" checked={r.active} onChange={(e) => setRule(i, { active: e.target.checked })} className="h-4 w-4 accent-[#1668b0]" />
                    {WD[r.weekday]}
                  </label>
                  {r.active && (
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                        <input type="time" value={r.openTime ?? '08:00'} onChange={(e) => setRule(i, { openTime: e.target.value })} className="rounded-lg border border-border px-2 py-1.5" aria-label="Abre" />
                        às
                        <input type="time" value={r.closeTime ?? '18:00'} onChange={(e) => setRule(i, { closeTime: e.target.value })} className="rounded-lg border border-border px-2 py-1.5" aria-label="Fecha" />
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                        Janela
                        <select value={r.slotMinutes} onChange={(e) => setRule(i, { slotMinutes: Number(e.target.value) })} className="rounded-lg border border-border px-2 py-1.5" aria-label="Tamanho da janela">
                          {[60, 90, 120, 180, 240].map((m) => (
                            <option key={m} value={m}>{m} min</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                        Vagas/janela
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={r.capacityPerSlot}
                          onChange={(e) => setRule(i, { capacityPerSlot: Math.max(1, Number(e.target.value)) })}
                          className="w-16 rounded-lg border border-border px-2 py-1.5"
                          aria-label="Vagas por janela"
                        />
                      </label>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={saveHours}
              disabled={savingHours}
              className="mt-5 min-h-10 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {savingHours ? 'Salvando…' : 'Salvar horários'}
            </button>
          </section>

          <section className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-2" aria-label="Folgas e bloqueios">
            <p className="font-display text-base font-bold text-deep">Folgas e bloqueios</p>
            <div className="mt-3 grid gap-3">
              <Field label="Data">
                <input type="date" value={newBlock.date} onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Horário (opcional)" hint="Vazio bloqueia o dia inteiro.">
                <input type="time" value={newBlock.timeSlot} onChange={(e) => setNewBlock({ ...newBlock, timeSlot: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Motivo">
                <input value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} placeholder="Ex.: compromisso particular" className={inputCls} />
              </Field>
              <button onClick={addBlock} disabled={!newBlock.date} className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                Bloquear
              </button>
            </div>
            {blocks.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">Nenhum bloqueio futuro.</p>
            ) : (
              <ul className="thin-scroll mt-4 max-h-64 space-y-2 overflow-y-auto">
                {blocks.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm">
                    <span className="font-semibold text-deep">{b.date}{b.timeSlot ? ` · ${b.timeSlot}` : ' · dia inteiro'}</span>
                    <span className="ml-auto truncate text-xs text-ink-soft">{b.reason}</span>
                    <button onClick={() => removeBlock(b)} aria-label="Remover bloqueio" className="text-ink-soft hover:text-action">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'pagamentos' && (
        <section className="max-w-xl rounded-3xl border border-border bg-white p-6 shadow-soft" aria-label="Formas de pagamento">
          <p className="font-display text-base font-bold text-deep">Formas de pagamento</p>
          <p className="mt-1 text-xs text-ink-soft">Usadas no financeiro e nas respostas do chatbot sobre pagamento.</p>
          <ul className="mt-4 space-y-2">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5">
                <span className={`text-sm font-semibold ${m.active ? 'text-deep' : 'text-ink-soft/60'}`}>{m.name}</span>
                <button
                  onClick={() => toggleMethod(m)}
                  className="ml-auto min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                >
                  {m.active ? 'Desativar' : 'Ativar'}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="Nova forma (ex.: Vale-refeição)" className={inputCls} />
            <button onClick={addMethod} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-700">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add
            </button>
          </div>
        </section>
      )}

      {tab === 'equipe' && (
        <div className="grid gap-6 lg:grid-cols-5">
          {!isAdmin ? (
            <Empty title="Acesso restrito" hint="Somente administradores gerenciam usuários." />
          ) : (
            <>
              <section className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-3" aria-label="Usuários">
                <p className="font-display text-base font-bold text-deep">Usuários do painel</p>
                <ul className="mt-4 space-y-2">
                  {users.map((u) => (
                    <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-deep">{u.name}</p>
                        <p className="text-xs text-ink-soft">{u.email}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-deep text-white' : 'bg-aqua-50 text-brand-700'}`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Operação'}
                      </span>
                      {!u.active && <span className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold uppercase text-ink-soft">Inativo</span>}
                      <span className="ml-auto flex gap-2">
                        <button onClick={() => resetPassword(u)} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand">
                          Redefinir senha
                        </button>
                        <button onClick={() => toggleUser(u)} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-ink-soft hover:border-action hover:text-action">
                          {u.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-border bg-white p-6 shadow-soft lg:col-span-2" aria-label="Novo usuário">
                <p className="font-display text-base font-bold text-deep">Novo usuário</p>
                <div className="mt-4 grid gap-3">
                  <Field label="Nome"><input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className={inputCls} /></Field>
                  <Field label="E-mail"><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={inputCls} /></Field>
                  <Field label="Perfil" hint="Operação não acessa o financeiro.">
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={inputCls}>
                      <option value="OPERADOR">Operação</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </Field>
                  <Field label="Senha inicial" hint="Mínimo 10 caracteres, com letras e números.">
                    <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={inputCls} />
                  </Field>
                  <button onClick={createUser} className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-700">
                    Criar usuário
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
