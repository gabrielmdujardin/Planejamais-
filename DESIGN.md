---
version: alpha
name: Planeja+ Editorial
description: Sistema visual premium e editorial para o Planeja+ — planejamento de eventos com a calma de uma revista impressa e a precisão de um software de alto nível.
colors:
  ink: "#1C1A17"
  ink-soft: "#4A453E"
  muted: "#6F685E"
  paper: "#FBF8F2"
  paper-deep: "#F2EDE3"
  surface: "#FFFFFF"
  hairline: "#E4DDD0"
  primary: "#0F5C46"
  primary-hover: "#0B4636"
  on-primary: "#FBF8F2"
  accent: "#C8F169"
  on-accent: "#1C1A17"
  clay: "#B5552F"
  on-clay: "#FFFFFF"
  espresso: "#141210"
  on-espresso: "#F2EDE3"
typography:
  display-xl:
    fontFamily: Instrument Serif
    fontSize: 5.5rem
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.03em
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.02em
  heading-md:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: Geist Mono
    fontSize: 0.6875rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.2em
  numeric:
    fontFamily: Geist Mono
    fontSize: 0.9375rem
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1"
rounded:
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 128px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: 14px 8px 14px 24px
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
  button-ghost:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  card-shell:
    backgroundColor: "{colors.paper-deep}"
    rounded: "{rounded.xl}"
    padding: 6px
  card-core:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 28px
  eyebrow:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 48px
  nav-island:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: 56px
  section-dark:
    backgroundColor: "{colors.espresso}"
    textColor: "{colors.on-espresso}"
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  caption:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.body-md}"
  divider:
    backgroundColor: "{colors.hairline}"
    height: 1px
  badge-alert:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-clay}"
    rounded: "{rounded.pill}"
---

## Overview

**Editorial Luxury encontra precisão de software.** O Planeja+ organiza o
momento mais importante da vida de alguém — o produto deve transmitir calma,
controle e sofisticação. A interface remete a uma revista de casamento
impressa em papel de algodão: fundos creme quentes, títulos serifados enormes,
números em fonte mono tabular (orçamentos, convidados, prazos) e um verde
profundo herdado da identidade original da marca.

Princípios: respiro generoso, hierarquia tipográfica dramática, profundidade
física (cartões com "dupla moldura") e movimento com massa — nada surge de
forma estática.

## Colors

- **Ink (#1C1A17):** Tinta quente quase preta para títulos e texto. Nunca use `#000`.
- **Paper (#FBF8F2) / Paper Deep (#F2EDE3):** A base. Creme de papel algodão; o tom mais profundo forma as "bandejas" externas dos cartões.
- **Primary (#0F5C46):** Verde floresta — evolução do esmeralda original, mais sóbrio. Usado em CTAs principais e estados ativos.
- **Accent (#C8F169):** Lima elétrico. Uso raro e intencional: um destaque por tela (ex.: um KPI positivo, um CTA hero secundário).
- **Clay (#B5552F):** Terracota para alertas, prazos vencidos e orçamento estourado — substitui o vermelho genérico.
- **Espresso (#141210):** Seções escuras de contraste (rodapé, faixa de depoimentos, modo escuro).

## Typography

- **Instrument Serif** para display: títulos hero e de seção, sempre grandes, com tracking negativo. Itálico para ênfase emocional ("seu *grande* dia").
- **Geist** para interface e corpo — geométrica, neutra, legível.
- **Geist Mono** para rótulos em caixa alta (eyebrows) e todos os números (com `tnum`), dando ao app o ar de instrumento de precisão.
- Proibido: Inter, Roboto, Arial, Open Sans, Helvetica.

## Layout

- Seções de marketing com no mínimo 128px de respiro vertical (`py-32`).
- Landing usa **Editorial Split**: tipografia massiva à esquerda, cartões interativos escalonados à direita.
- Dashboard usa **Bento assimétrico** (`col-span-8` + pilha de `col-span-4`).
- Abaixo de 768px tudo colapsa em coluna única, `px-4`, sem rotações nem sobreposições. Use `min-h-[100dvh]`, nunca `h-screen`.

## Elevation & Depth

Profundidade vem de camadas, não de sombras pesadas. Sombras permitidas são
difusas e quentes: `0 24px 48px -24px rgba(28,26,23,0.12)`. Cartões ganham um
brilho interno sutil `inset 0 1px 0 rgba(255,255,255,0.6)`. Uma textura de
grão fixa (`opacity: 0.03`, `pointer-events: none`) cobre a viewport para dar
sensação de papel. `backdrop-blur` apenas em elementos fixos (nav, modais).

## Shapes

Raios exagerados e concêntricos. Cartões: casca externa `32px` com padding de
`6px`, núcleo interno `26px` (`calc(32px - 6px)`). Botões e badges sempre em
pílula. Inputs `16px`.

## Components

- **Card (Double-Bezel):** casca `paper-deep` + anel hairline → núcleo `surface` com brilho interno.
- **Button primary:** pílula verde, com ícone de seta aninhado num círculo próprio à direita; no hover o círculo desliza na diagonal; no clique `scale(0.98)`.
- **Eyebrow:** pílula minúscula em Geist Mono caixa alta antes de todo H1/H2.
- **Nav Island:** pílula flutuante destacada do topo (`mt-6`), nunca barra colada de ponta a ponta.
- **Motion:** easing padrão `cubic-bezier(0.32, 0.72, 0, 1)`, 500–800ms; entrada por scroll com fade-up + blur via `IntersectionObserver`. Respeitar `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** usar números grandes em Geist Mono para métricas do evento.
- **Do** usar serifada itálica para palavras emocionais nos títulos.
- **Do** manter um único destaque lima por tela.
- **Don't** usar bordas cinza genéricas de 1px nem `shadow-md`.
- **Don't** usar transições `linear`/`ease-in-out` ou mudanças de estado instantâneas.
- **Don't** usar grids simétricos de 3 colunas estilo Bootstrap.
- **Don't** animar `width`/`height`/`top`/`left` — apenas `transform` e `opacity`.
