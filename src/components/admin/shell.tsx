'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Users, Wallet, Truck, Boxes, FileText, Images,
  Newspaper, Search, Bot, Settings, Bell, LogOut, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '/admin/painel', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet, adminOnly: true },
  { href: '/admin/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { href: '/admin/conteudo', label: 'Conteúdo do site', icon: FileText },
  { href: '/admin/galeria', label: 'Galeria', icon: Images },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/seo', label: 'SEO', icon: Search },
  { href: '/admin/chatbot', label: 'Chatbot', icon: Bot },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

type Notification = { id: string; title: string; message: string; link: string | null; read: boolean; createdAt: string };

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: 'ADMIN' | 'OPERADOR' };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setMenuOpen(false);
      setNotifOpen(false);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const load = () =>
      fetch('/api/admin/notifications?unread=1')
        .then((r) => r.json())
        .then((d) => setNotifications(d.notifications ?? []))
        .catch(() => {});
    const t = setTimeout(load, 0);
    const i = setInterval(load, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    });
    setNotifications([]);
  };

  const nav = NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN');

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Image src="/img/brand/logo-jc-claro.png" alt="JC Lavagem a Seco" width={150} height={57} className="h-8 w-auto" />
        <span className="ml-auto rounded-full bg-aqua-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
          {user.role === 'ADMIN' ? 'Admin' : 'Operação'}
        </span>
      </div>
      <nav aria-label="Menu do painel" className="thin-scroll flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-brand text-white shadow-soft' : 'text-ink-soft hover:bg-aqua-50 hover:text-deep'
              }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-semibold text-deep">{user.name}</p>
        <p className="truncate text-xs text-ink-soft">{user.email}</p>
        <button
          onClick={logout}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-action hover:text-action"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ice">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-white lg:block">{sidebar}</aside>

      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-deep/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-deep">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ice"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-ice lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-display text-sm font-bold text-deep">
            {NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Painel'}
          </p>

          <div className="relative ml-auto">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              aria-expanded={notifOpen}
              aria-label={`Notificações (${notifications.length} não lidas)`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-ice"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-bold text-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-lift sm:w-96">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-bold text-deep">Notificações</p>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-xs font-semibold text-brand hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="thin-scroll max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-ink-soft">Nenhuma notificação não lida.</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link ?? '#'}
                        className="block border-b border-border/60 px-4 py-3 transition-colors last:border-0 hover:bg-ice"
                      >
                        <p className="text-sm font-semibold text-deep">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{n.message}</p>
                        <p className="mt-1 text-[11px] text-ink-soft/70">
                          {new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/"
            target="_blank"
            className="hidden min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-deep transition-colors hover:border-brand hover:text-brand sm:inline-flex"
          >
            Ver site
          </Link>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
