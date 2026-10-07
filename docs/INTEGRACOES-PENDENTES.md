# Integrações pendentes (roteiro honesto)

O sistema funciona **hoje** sem nenhum serviço externo pago. O que está abaixo são
melhorias opcionais, com sugestão de implementação. Nada disto é simulado no código atual:
onde algo depende de serviço externo, o sistema opera com alternativas internas.

## 1. E-mail transacional

**Hoje:** recuperação de senha gera link exibido no painel para o admin repassar por
canal seguro (WhatsApp/telefone). Nenhum e-mail é enviado.
**Futuro:** Resend / Amazon SES / SMTP do domínio.
**Onde:** `src/app/api/admin/auth/recuperar/route.ts` e `users/[id]` (hoje retornam o link;
trocar por envio de e-mail + mensagem genérica “enviamos um link para seu e-mail”).

## 2. Notificações instantâneas de nova solicitação

**Hoje:** notificação interna no painel (campainha, polling 30s) — registrada no banco.
**Futuro:** envio para o WhatsApp do Jhone via WhatsApp Business API oficial
(Meta Cloud API — exige conta business e aprovação) ou Telegram Bot (mais simples).
**Onde:** helper `notify()` em `src/lib/` (adicionar canal e-g. `sendTelegram()`).

## 3. Chatbot com linguagem natural (LLM)

**Hoje:** FAQ + reconhecimento por palavras-chave (funciona offline, sem chave).
**Futuro:** opcionalmente `z-ai-web-dev-sdk` (ou OpenAI/Anthropic) **somente no servidor**,
restrito ao contexto das FAQs aprovadas — sem inventar preços/prazos.
**Onde:** `src/lib/chat-engine.ts` já tem o ponto de extensão (`source: 'llm'`).

## 4. Uploads em object storage

**Hoje:** disco local (`uploads/`), servidos por rota com validação de path.
**Futuro:** S3/R2/Supabase Storage com URLs assinadas.
**Onde:** `src/app/api/admin/uploads/route.ts` (trocar `writeFile` por client S3).

## 5. Backup automatizado

**Hoje:** backup manual (arquivo do banco + pasta uploads).
**Futuro:** cron no servidor (`pg_dump` + `restic`/`rclone`) ou backups gerenciados do provedor.

## 6. Analytics avançado

**Hoje:** pageviews, sessões aproximadas e eventos de conversão first-party, sem PII,
excluindo /admin. Dashboard mostra 30 dias.
**Futuro:** gráfico de série temporal no painel; exportação CSV; funnel do formulário
(as bases `PageView`/`AnalyticsEvent` já registram tudo que é necessário).

## 7. Pagamentos online

**Hoje:** registro manual de recebimentos (PIX/dinheiro/cartão na visita).
**Futuro:** PIX com QR dinâmico (Mercado Pago/Asaas) e link de pagamento no orçamento.
**Onde:** `FinancialAccount` + `PaymentMethod` já modelam a conciliação; adicionar
webhook de confirmação criando `TransactionPayment`.

## 8. Recibos automáticos

**Hoje:** recibo sob demanda (informado no agendamento; registrado em notas).
**Futuro:** PDF gerado na conclusão (react-pdf) e envio por WhatsApp/e-mail.
