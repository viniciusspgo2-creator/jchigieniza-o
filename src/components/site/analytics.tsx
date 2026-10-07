'use client';

/**
 * Analytics first-party: envia pageview em cada navegação (App Router)
 * e eventos de conversão. Ignora rotas /admin (o servidor também ignora).
 * Sem dados pessoais: apenas cookie anônimo gerido pelo servidor.
 */
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

function sessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('jc_chat_session');
    if (!id) {
      id = `s-${crypto.randomUUID()}`;
      localStorage.setItem('jc_chat_session', id);
    }
    return id;
  } catch {
    return 's-anonimo';
  }
}

export async function trackPageview(path: string) {
  if (path.startsWith('/admin')) return;
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, referrer: document.referrer || undefined }),
    keepalive: true,
  }).catch(() => {});
}

export async function trackEvent(type: 'WHATSAPP_CLICK' | 'BOOKING_SUBMIT' | 'PHONE_CLICK' | 'INSTAGRAM_CLICK' | 'CHAT_OPEN' | 'CHAT_WHATSAPP', meta?: string) {
  fetch('/api/analytics?kind=event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, path: window.location.pathname, meta }),
    keepalive: true,
  }).catch(() => {});
}

export { sessionId };

export function PageTracker() {
  const pathname = usePathname();
  const last = useRef<string>('');
  useEffect(() => {
    if (last.current !== pathname) {
      last.current = pathname;
      trackPageview(pathname);
    }
  }, [pathname]);
  return null;
}
