# Deploy — JC Lavagem a Seco (Vercel + Neon PostgreSQL)

## Visão geral

App Next.js 16 (App Router) + Prisma + PostgreSQL (Neon). O projeto já está
100% preparado para a Vercel: schema em `postgresql`, uploads de imagens
armazenados no próprio banco (sem filesystem), consultas com fallback seguro
e script de build compatível com deploy em banco vazio.

## 1. Banco de dados (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech) e um projeto (ex.: `jc-lavagem`).
2. Copie a **Connection String (Pooler)** do painel do Neon.
3. Garanta que a URL contenha `?sslmode=require`:
   ```
   postgresql://USUARIO:SENHA@ep-xxxx-pooler.regiao.aws.neon.tech/neondb?sslmode=require
   ```
4. O schema é criado automaticamente no primeiro build (`prisma db push`).
   Banco vazio NÃO quebra o deploy — todas as páginas têm fallback seguro.

## 2. Deploy na Vercel

1. Suba o projeto para um repositório Git e importe na Vercel.
2. Framework Preset: **Next.js** (detectado automaticamente). Não altere o
   Build Command — o `package.json` já contém exatamente:
   ```json
   "build": "prisma generate && prisma db push --skip-generate && next build"
   ```
3. Configure as variáveis de ambiente (aba *Settings → Environment Variables*)
   conforme a tabela abaixo.
4. Faça o deploy. Ao final, rode o seed UMA vez (passo 4).

## 3. Variáveis de ambiente (Vercel)

| Variável | Formato / exemplo | Obrigatória |
|---|---|---|
| `DATABASE_URL` | `postgresql://usuario:senha@ep-xxx-pooler.regiao.aws.neon.tech/neondb?sslmode=require` | ✅ |
| `ADMIN_SETUP_TOKEN` | token forte e único (ex.: `openssl rand -base64 32`) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://www.seudominio.com.br` | ✅ |

> `.env.example` traz o modelo comentado. Nunca comite o `.env` real
> (o `.gitignore` já cobre, e mantém o `.env.example` no repositório).

## 4. Passos manuais — UMA vez após o primeiro deploy

1. **Seed do banco** (serviços, FAQ, galeria, horários, formas de pagamento e
   os 6 artigos do blog). Na sua máquina, apontando para o Neon:
   ```bash
   # .env local com a DATABASE_URL do Neon
   bun install
   bun scripts/seed.ts
   ```
   Idempotente: só insere o que não existe. Edições feitas no painel depois
   não são sobrescritas.
2. **Criar o primeiro administrador**: acesse
   `https://SEUDOMINIO/admin` → você será levado ao fluxo de primeiro acesso
   (`/admin/setup`). Cole o valor de `ADMIN_SETUP_TOKEN` e defina e-mail/senha
   definitivos do administrador.
   > Recomendado: após criar o admin, remova/troque o `ADMIN_SETUP_TOKEN`
   > na Vercel (nova variável + redeploy) para invalidar o fluxo.

## 5. Acesso ao painel administrativo

- URL: `https://SEUDOMINIO/admin` (ou o botão do cadeado no topo do site).
- Primeiro acesso: fluxo `/admin/setup` com o `ADMIN_SETUP_TOKEN` (passo 4.2).
- Perfis: **ADMIN** (acesso total) e **OPERADOR** (criado pelo admin em
  *Usuários*). Senhas com bcrypt; sessões em cookie httpOnly; auditoria de
  ações habilitada.
- No rodapé do site também há o link "Painel administrativo".

## 6. Armazenamento de imagens (sem filesystem)

- Uploads do painel e do formulário ficam na tabela `StoredFile` do próprio
  PostgreSQL (processados com sharp → WebP) e são servidos por
  `/api/uploads/[...file]` com cache imutável.
- Imagens do tema (hero, galeria, capas do blog) são estáticas em `/public`.
- O painel também aceita **URLs externas** (CDN) para capa de artigos e
  galeria — `next.config.ts` já permite qualquer host `https` em
  `images.remotePatterns`.

## 7. Verificações de build (já validadas)

- `bunx tsc --noEmit` — 0 erros (`typescript.ignoreBuildErrors` removido).
- `bunx eslint src --max-warnings=0` — 0 erros/0 avisos.
- `bun run build` (script exato exigido) — compilou e gerou todas as páginas.
- Testado com banco vazio: páginas usam fallbacks (`safe()` / `.catch()`) e
  o build segue sem quebrar.
