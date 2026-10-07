# JC Lavagem a Seco — Site + Sistema de Gestão

Site institucional (One Page + Blog) e painel administrativo completo para a **JC Lavagem a Seco** — higienização de estofados em geral a domicílio em Goiânia, responsável **Jhone Costa**.

- **WhatsApp:** (62) 99157-9369 — [wa.me/5562991579369](https://wa.me/5562991579369)
- **Instagram:** [@jc.lavagem.a.seco.62](https://www.instagram.com/jc.lavagem.a.seco.62)
- **Endereço:** Rua Sulamita, Quadra 02, Lote 38, Setor Morada do Sol, Goiânia – GO, CEP 74475-180

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui (New York) + Lucide |
| Animações | framer-motion (MIT) — respeita `prefers-reduced-motion` |
| Banco | PostgreSQL (produção) / SQLite (desenvolvimento sandbox) via Prisma |
| Auth | Sessões próprias: cookie httpOnly + hash de token no banco, bcryptjs |
| Validação | zod (server-side em 100% das rotas) |
| Imagens | sharp (conversão para WebP, redimensionamento, proteção) |
| Analytics | First-party (PageView/AnalyticsEvent anônimos, exclui /admin) |

## Estrutura

```
src/
  app/
    page.tsx                # One Page (seções ordenáveis pelo painel)
    blog/                   # Índice + artigos (JSON-LD BlogPosting)
    privacidade/            # Aviso de privacidade
    admin/
      (auth)/login|setup|recuperar
      (panel)/painel|agendamentos|clientes|financeiro|fornecedores|
              estoque|conteudo|galeria|blog|seo|chatbot|configuracoes
    api/
      agendamento/          # POST público (validação de janela) + GET slots
      chat/                 # Chatbot: FAQ + fallback WhatsApp
      servicos-publicos/    # Serviços ativos para o formulário
      analytics/            # Pageviews e eventos de conversão
      uploads/public|admin  # Upload com validação + sharp
      admin/*               # Rotas protegidas (requireUser/requireAdmin)
  components/site/          # Hero (bolhas), comparador, chatbot, formulário…
  components/admin/         # Shell do painel + blocos de UI
  lib/                      # auth, slots (fuso SP), money, audit, site-content…
prisma/schema.prisma        # Modelagem completa (ver abaixo)
content/blog/*.md           # Fonte dos 6 artigos seed
scripts/seed.ts             # Seed idempotente
```

## Como rodar (desenvolvimento)

```bash
cp .env.example .env            # ajuste variáveis
bun install
bun run db:push                 # cria/atualiza o schema
bun scripts/seed.ts             # serviços, FAQ, galeria, horários, artigos
bun run dev                     # http://localhost:3000
```

### Criar o primeiro administrador (fluxo seguro)

1. Defina em `.env`: `ADMIN_SETUP_TOKEN=<segredo-forte-único>`
2. Acesse **/admin/setup** — o token é pedido uma única vez e a senha inicial é escolhida por você.
3. Não existe senha padrão em código. Após o primeiro admin, a rota de setup se desativa (somente usuários existentes + token configurado).
4. Novos usuários são criados por um admin em **Configurações → Equipe** (perfil `ADMIN` ou `OPERADOR`).
5. Recuperação de senha: `/admin/recuperar` (token de uso único, 1h) ou redefinição gerada por admin (link exibido uma única vez).

> Não há credenciais padrão: o primeiro admin é criado em `/admin/setup` com o `ADMIN_SETUP_TOKEN`.

## Permissões

| Recurso | OPERADOR | ADMIN |
|---|---|---|
| Agendamentos, clientes, estoque, fornecedores, galeria, blog, chatbot, conteúdo, SEO, horários | ✓ | ✓ |
| Financeiro (lançamentos, liquidar, contas, categorias) | ✗ (sem acesso no menu e 403 nas rotas) | ✓ |
| Criar/desativar usuários, resetar senha | ✗ | ✓ |

Toda ação relevante grava `AuditLog` (quem, o quê, quando, detalhes).

## Fluxo de agendamento (status)

`SOLICITADO → EM_ANALISE → CONFIRMADO → EM_ATENDIMENTO → CONCLUIDO` (ou `CANCELADO`)

- O formulário público grava no banco e gera **protocolo** `JC-AAAA-NNNNNN` — não depende de abrir o WhatsApp (que é opcional e pós-confirmação).
- **Conflito de horário:** a submissão valida janelas contra horários/folgas; a **confirmação** pelo painel roda dentro de `db.$transaction` com checagem de capacidade — dois atendimentos não ocupam a mesma janela, mesmo em corrida.
- Solicitações (não confirmadas) não bloqueiam a agenda fisicamente; quem resolve duplicidade é a validação transacional do momento de confirmar.
- Fuso: `America/Sao_Paulo` (lib própria: `lib/tz.ts`). Datas de preferência em `YYYY-MM-DD`.
- Ao concluir, o admin pode gerar **conta a receber** (idempotente por `bookingId @unique`).

## Financeiro (regras de integridade)

- Valores em **centavos (Int)** — nunca float.
- Lançamentos `PENDENTE` (previsto) vs `PAGO` (liquidado) — o liquidado vem de `TransactionPayment` (permite **parciais**).
- Lançamento pago/cancelado **não é apagado**; correção = novo lançamento/movimento com histórico preservado.
- Parcelamento cria N lançamentos vinculados por `groupId`.
- CSV em `/api/admin/finance/export`.

## Estoque

- Saldos em unidade base (`ml`, `g`, `un`); movimentos `ENTRADA/SAIDA/CONSUMO/AJUSTE` com `balanceAfter` (histórico imutável).
- Impedida saída além do saldo (validação server-side).
- Cancelar agendamento **não** devolve material automaticamente (evita estoque fantasma) — ajuste manual com motivo.

## Site editável (conteúdo)

- Blocos versionados em `SiteContent` (`value` publicado / `draft` rascunho) com merge sobre defaults em `lib/site-content.ts`.
- **“Sem taxa de deslocamento”** nasce **desligado** — ative somente após confirmar área.
- Seções podem ser ocultadas/reordenadas; logo, contatos, textos e CTAs editáveis.
- Galeria: só itens marcados como ativos vão ao ar; comparadores exigem par antes/depois.

## Chatbot

- Base de FAQ editável + reconhecimento por palavras-chave (normaliza acentos).
- Não sabe? Admite e oferece WhatsApp humano — nunca inventa preço/prazo.
- Preço/formas de pagamento dinâmicos (`DINAMICO_PAGAMENTOS` resolve do banco).

## SEO

- Metadados por página, canonical, Open Graph, `sitemap.xml` dinâmico (inclui artigos), `robots.txt` bloqueando `/admin` e `/api/`.
- JSON-LD: `LocalBusiness` (dados reais) na home; `BlogPosting` nos artigos.
- Painel `noindex, nofollow`.

## Analytics first-party

- `PageView` por navegação + eventos (`WHATSAPP_CLICK`, `BOOKING_SUBMIT`, `PHONE_CLICK`, `INSTAGRAM_CLICK`, `CHAT_OPEN`, `CHAT_WHATSAPP`).
- Sem dados pessoais; sessão anônima; rotas `/admin` excluídas no cliente e no servidor.

## Segurança (resumo)

- Senhas com bcrypt; sessão = token aleatório, apenas o **hash** vai ao banco; cookie httpOnly/sameSite=lax.
- Validação e autorização **no servidor** em todas as rotas (zod + `requireUser/requireAdmin`).
- Rate limit em login, setup, chat e formulário público.
- Uploads: MIME + tamanho + reprocessamento com sharp (remove payloads), nomes gerados, sem execução.
- Markdown do blog renderizado sem HTML cru; conteúdo sanitizado.
- Auditoria de operações do painel.

## Variáveis de ambiente

Veja **.env.example** (comentado). Principais: `DATABASE_URL`, `ADMIN_SETUP_TOKEN`, `NEXT_PUBLIC_SITE_URL`, `NODE_ENV`.

## Deploy (resumo)

Guia completo em **docs/DEPLOY.md**. Em produção use PostgreSQL (troque `provider`/`url`), `NEXT_PUBLIC_SITE_URL` com o domínio real, rode `prisma migrate deploy` + seed e **remova/rotate o ADMIN_SETUP_TOKEN** após criar o admin.

## Documentos complementares

- `docs/EFEITOS-E-LICENCAS.md` — pesquisa de efeitos com referências reais e licenças
- `docs/DEPLOY.md` — passo a passo de publicação
- `docs/PRIMEIRO-ACESSO.md` — checklist do primeiro dia de uso
- `docs/INTEGRACOES-PENDENTES.md` — o que ficou para depois (com sugestões)
