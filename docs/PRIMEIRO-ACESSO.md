# Primeiro acesso — checklist do administrador

Este guia leva do sistema recém-instalado até o site no ar, com as decisões de
conteúdo que só o dono/administrador pode tomar.

## 1. Criar sua conta

- Abra `/admin/setup`, informe o `ADMIN_SETUP_TOKEN` (definido no `.env` do servidor),
  seu nome, e-mail e senha forte.
- Depois disso remova o token do ambiente (segurança).

## 2. Segurança imediata

- **Configurações → Equipe**: troque/desative a conta de teste
  (`admin@jclavagemaseco.com.br`) se ela existir no ambiente.
- Crie contas reais: `ADMIN` para quem gerencia financeiro/equipe;
  `OPERADOR` para quem só agenda e atende (sem acesso ao financeiro).

## 3. Conteúdo do site (Conteúdo do site)

- **Marca:** confirme nome, responsável e a logo. Se quiser trocar a logo, envie a imagem
  em **Galeria → Adicionar item** (ou qualquer upload) e cole a URL nos campos de logo.
- **Contato:** confirme telefone/WhatsApp `(62) 99157-9369`, Instagram e endereço
  (Rua Sulamita, Qd 02, Lt 38 — Setor Morada do Sol, CEP 74475-180).
- **Hero:** ajuste o texto principal se quiser; o selo “atendimento a domicílio em Goiânia”.
- **Exibições:** o aviso **“sem taxa de deslocamento”** está DESLIGADO de propósito.
  Ative somente quando confirmar que o atendimento sem taxa cobre toda a área que você atende.
- **Ordem das seções:** oculte/reordene à vontade (ex.: tirar “Resultados” se preferir).
- Use **Salvar rascunho** para revisar antes de **Publicar no site**.

## 4. Agenda (Configurações → Horários)

- Confirme dias/horários reais de atendimento (padrão: seg–sáb, 8h–18h, janelas de 2h).
- Defina **vagas por janela** (quantos atendimentos simultâneos você consegue fazer).
- Cadastre folgas futuras (feriados, compromissos).

## 5. Financeiro (só ADMIN)

- **Formas de pagamento:** PIX, Dinheiro, Cartão — ajuste conforme aceitar.
- **Contas:** Caixa e PIX (padrão). Crie outras (banco) se precisar.
- Quando concluir um atendimento em **Agendamentos → Concluir**, informe o valor:
  o sistema cria a conta a receber (uma única vez por OS) e você liquida — total ou
  em partes — em **Financeiro → Liquidar**.

## 6. Estoque

- Cadastre os produtos que você usa (shampoo, impermeabilizante, EPIs…).
- Use **Movimentar** para registrar entradas (compras) e consumos.
- O sistema avisa (painel e notificações) quando um item fica abaixo do mínimo.

## 7. Chatbot

- Revise as 15 FAQs (prontas na seed) — edite respostas conforme seu jeito de falar.
- **Não prometa** preços fixos ou prazos de secagem no chat: o orçamento é avaliado
  caso a caso (as respostas já refletem isso).
- Teste em **Chatbot → Testar respostas**.

## 8. Galeria

- A galeria inicial usa fotos reais fornecidas (comparadores antes/depois).
- Adicione novos trabalhos com autorização do cliente. Evite fotos com marcas de
  terceiros ou ilustrações — nada de “resultado” que não foi executado.

## 9. SEO

- Confirme título/descrição em **SEO** (padrão focado em “higienização de estofados em Goiânia”).
- Cadastre o site no Google Search Console e envie `https://SEUDOMINIO/sitemap.xml`.
- Crie o perfil da empresa no Google com o endereço real.

## 10. Rotina sugerida

- **Todo dia:** olhar **Visão geral** (novas solicitações têm notificação na campainha).
- **Ao confirmar:** checar que a janela tem vaga (o sistema impede conflito na confirmação).
- **Toda semana:** revisar estoque baixo e contas a receber vencidas.
