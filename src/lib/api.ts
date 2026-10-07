/** Helpers de resposta e parsing de corpo para rotas de API. */
import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { AuthError } from './auth';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...(data as object) }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: fail('Corpo da requisição inválido.', 400) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: fail(first ? `${first.path.join('.') || 'campo'}: ${first.message}` : 'Dados inválidos.', 422, {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }),
    };
  }
  return { data: parsed.data };
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) return fail(e.message, e.status);
  console.error('[api]', e);
  return fail('Erro interno do servidor.', 500);
}
