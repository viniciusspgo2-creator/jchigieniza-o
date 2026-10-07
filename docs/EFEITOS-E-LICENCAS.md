# Efeitos visuais — pesquisa, referências e licenças

> Princípio: nenhuma biblioteca foi adicionada só por efeito. O que já existia no stack
> (framer-motion, Canvas API nativa) cobre tudo. Abaixo, o que foi consultado de fato
> durante o desenvolvimento (acesso à internet confirmado na sessão) e a licença de cada item.

## 1. Bolhas de sabão (hero)

- **Implementação:** própria, Canvas 2D (`src/components/site/bubbles-canvas.tsx`).
  Gradientes radiais + halo iridescente (`createConicGradient`) + reflexo especular;
  contorno fino e alpha baixo para parecer bolha translúcida, não círculo sólido.
- **Referências técnicas (documentação):**
  - MDN — Canvas API e `CanvasRenderingContext2D.createConicGradient`:
    https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createConicGradient
  - MDN — `IntersectionObserver` (pausa quando fora da tela):
    https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **Licença:** código próprio (mesma licença do projeto). Nenhuma dependência adicionada.

## 2. Comparador antes/depois acessível

- **Implementação:** própria (~90 linhas, `src/components/site/before-after.tsx`):
  camadas com `clip-path`, arraste por pointer events e **input range** nativo para teclado/leitor de tela.
- **Referências pesquisadas (GitHub API, leitura de READMEs):**
  - `sneas/img-comparison-slider` (possui versão acessível, licença MIT) — https://github.com/sneas/img-comparison-slider
  - `Paul-Browne/image-comparison-slider` — https://github.com/Paul-Browne/image-comparison-slider
  - `react-comparison-slider` — https://github.com/alexcurtis/react-comparison-slider
- **Decisão:** não dependência externa; inspirado no padrão de acessibilidade do img-comparison-slider
  (range + labels ARIA), sem amarrar o projeto a um web component.
- **Licença:** MIT (referência apenas — sem cópia de código).

## 3. Animações (revelação no scroll, microinterações)

- **Biblioteca:** framer-motion / Motion — já presente no projeto, licença **MIT**.
- **Referência oficial consultada:** https://motion.dev/llms.txt (e docs do framer-motion)
  - `whileInView` / `useInView` para revelar seções ao rolar;
  - `useReducedMotion` + `MotionConfig` para respeitar usuários com movimento reduzido;
  - `whileTap`/`whileHover` nos CTAs (feedback tátil).
- **Regras aplicadas:** animações curtas (<400 ms), nada de parallax infinito, carrossel controlado
  (sem rotação autônoma), Canvas pausa fora da tela e com aba oculta.

## 4. Luz que segue o cursor

- **Implementação:** própria — `radial-gradient` via CSS custom properties + `requestAnimationFrame`
  (quando aplicável). Ativa só em `pointer: fine`; em touch fica estático.
- **Referência técnica:** MDN — Pointer events e CSS custom properties:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

## 5. Tipografia e ícones

- **Ícones:** lucide-react — licença **ISC** (ícones CC-BY/ISC conforme pacote).
- **Fontes:** system-ui + fontes locais do ambiente; nenhuma fonte de terceiros embarcada
  sem verificação. Nomes/branding do site são da própria empresa (imagem fornecida pelo cliente).

## 6. Fotos

- Fonte: arquivos fornecidos pelo cliente (`fotos.rar`, 22 imagens). Excluídas 3 imagens com
  marca de terceiros/emoji para evitar falsa atribuição; removidas duplicatas.
- Conversão para WebP com sharp (licença Apache-2.0).

---

### Resumo de licenças

| Item | Origem | Licença |
|---|---|---|
| framer-motion | npm `framer-motion@12` | MIT |
| lucide-react | npm `lucide-react@0.525` | ISC |
| sharp | npm `sharp@0.34` | Apache-2.0 |
| shadcn/ui (componentes copiáveis) | repositório oficial | MIT |
| Bolhas, comparador, cursor light | código próprio | licença do projeto |

Nenhum efeito utiliza assets ou código de licença não comercial / GPL copyleft que exija
abertura do código do site.
