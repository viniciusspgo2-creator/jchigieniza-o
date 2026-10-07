/**
 * Autenticação de servidor com sessões em banco (cookies httpOnly + SameSite).
 * - Senhas com bcrypt (bcryptjs)
 * - Token de sessão aleatório de 32 bytes; apenas o SHA-256 é gravado no banco
 * - Verificação SEMPRE no servidor (middleware + helpers de rota)
 */
import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';

export const SESSION_COOKIE = 'jc_session';
export const ANALYTICS_COOKIE = 'jc_visitor';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERADOR';
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Valida força de senha: mínimo 10 caracteres com letra e número. */
export function strongPassword(pw: string): string | null {
  if (pw.length < 10) return 'A senha deve ter ao menos 10 caracteres.';
  if (!/[A-Za-zçÇ]/.test(pw)) return 'A senha deve conter letras.';
  if (!/[0-9]/.test(pw)) return 'A senha deve conter números.';
  return null;
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200), ip: ip?.slice(0, 60) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Retorna o usuário da sessão atual ou null. Sempre consulta o banco. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.active) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as 'ADMIN' | 'OPERADOR',
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError('Não autenticado', 401);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new AuthError('Acesso restrito ao administrador', 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Comparação em tempo constante para tokens. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Cookie anônimo de analytics (sem dados pessoais). */
export async function ensureVisitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(ANALYTICS_COOKIE)?.value;
  if (existing && /^v[0-9a-f-]{36}$/.test(existing)) return existing;
  const id = `v${crypto.randomUUID()}`;
  jar.set(ANALYTICS_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return id;
}
