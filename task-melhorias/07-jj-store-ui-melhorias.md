# JJ Store — Guia de melhorias de UI (layout mais profissional)

> Objetivo: deixar o visual **mais maduro**, com **hierarquia clara**, **cores consistentes**, **tipografia moderna** e **componentes com aparência “produto pronto”**.

---

## 1) Problemas que aparecem no layout atual (rápido diagnóstico)
- **Hierarquia fraca**: muitos elementos têm “peso” parecido (título, inputs, cards, botões).
- **Cores sem sistema**: o verde do botão, o laranja do CTA e os tons do fundo não parecem pertencer à mesma paleta.
- **Espaçamento irregular**: alguns blocos têm muito “ar” e outros ficam apertados.
- **Componentes “crus”**: botões, inputs e cards parecem padrão, com pouca personalidade (borda, sombra, estados).
- **Resumo do pedido**: precisa parecer “sticky + premium” (destaque do total, frete, confiança).

---

## 2) Defina um “Design System mínimo” (em 30 min)
Crie variáveis de tema para padronizar tudo:

### Tokens (recomendado)
- **Raios**: 12px (cards), 10px (inputs), 999px (pílulas/badges)
- **Sombras**:
  - `sm`: 0 1px 2px rgba(0,0,0,.06)
  - `md`: 0 8px 24px rgba(0,0,0,.10)
- **Espaçamentos (8pt grid)**: 4, 8, 12, 16, 24, 32, 40, 56
- **Bordas**: 1px com cor sutil (ex.: `#E5E7EB`)

### Paleta (simples e profissional)
Escolha **1 cor primária**, **1 cor de destaque**, e neutros:
- **Primária** (CTA principal): um azul/teal “sério”
- **Destaque** (alertas/promo): âmbar/laranja bem controlado
- **Neutros**: cinzas frios (texto, bordas, fundos)

**Regra**: CTA principal sempre na primária; evite misturar verde + laranja como CTAs principais na mesma tela.

---

## 3) Tipografia (parece “pro” só de ajustar isso)
Recomendação:
- **Fonte**: Inter, Plus Jakarta Sans, ou system-ui (se quiser simples).
- **Escala**:
  - H1 (título da página): 32–40px / 700
  - H2 (“Seu carrinho”): 24–28px / 700
  - Texto base: 16px / 400–500
  - Metadados (ex.: “Catálogo online”): 14px / 400, cor neutra
- **Cor de texto**:
  - Principal: quase preto (ex.: `#111827`)
  - Secundário: `#6B7280`
  - Bordas/divisores: `#E5E7EB`

---

## 4) Layout: estrutura que “vende”
### Header/topo
- Transforme o topo em **barra limpa** (logo + busca + carrinho), com:
  - fundo branco
  - sombra leve
  - limite de largura (container)
- **Busca**: input com ícone + botão “Buscar” como **secundário** (outline), e o CTA principal fica para “Finalizar compra”.

### Página do carrinho
Use um grid consistente:
- **Desktop**: 2 colunas (Itens 8/12, Resumo 4/12)
- **Mobile**: coluna única, e o Resumo vira card fixo no final (ou sticky bottom)

---

## 5) Cards e componentes (onde o visual “matura” de verdade)
### Card de item
Inclua e padronize:
- miniatura maior (72–96px)
- nome com no máximo 2 linhas
- preço unitário + subtotal do item
- controles de quantidade mais “premium”:
  - botões quadrados com ícones
  - estado disabled
  - feedback visual ao clicar

**Sugestão de layout do item:**
- esquerda: imagem
- centro: nome + variações (cor/tamanho) + preço unitário
- direita: stepper de quantidade + subtotal + “Remover” (link danger)

### Botões
Defina 3 tipos:
1. **Primary**: “Finalizar compra” (sempre primária)
2. **Secondary**: “Buscar”, “Continuar comprando”
3. **Tertiary/Danger**: “Remover” (texto/link com ícone)

Estados obrigatórios:
- hover / active
- disabled
- loading (spinner + texto “Processando…”)

### Inputs
- altura 44–48px
- borda 1px + foco com outline
- placeholder mais claro
- ícone de busca no input (melhora percepção de qualidade)

---

## 6) “Resumo” que converte mais
No card de resumo:
- Destaque **Total** no final (maior, negrito).
- Mostre:
  - Subtotal
  - Frete (ou “calcular frete”)
  - Cupom (campo compacto)
  - Total
- CTA “Finalizar compra” ocupando 100% da largura
- Selos de confiança abaixo (ex.: “Compra segura”, “Pix/Cartão”, “Entrega rápida”) com ícones pequenos

**Bônus**: deixe o Resumo **sticky** no desktop (acompanha a rolagem).

---

## 7) Feedback e microinterações
- Ao adicionar ao carrinho: use toast discreto + badge no carrinho já existe (ótimo) — só refine visual.
- Ao alterar quantidade: pequena animação (fade/scale) no subtotal.
- “Remover”: confirmação leve (modal ou undo toast “Desfazer”).

---

## 8) Acessibilidade (faz o site parecer “profissional de verdade”)
Checklist:
- Contraste adequado (texto vs fundo)
- Foco visível em inputs/botões
- Tamanho mínimo de alvo (44px)
- Mensagens de erro claras e próximas do campo
- Não depender só de cor para indicar estados (usar ícone/label)

---

## 9) Checklist de “Quick Wins” (aplique hoje)
1. Definir **container** (max-width 1100–1200px) e centralizar tudo.
2. Unificar CTA: **Finalizar compra** como primária; “Buscar” como secundário.
3. Trocar tipografia para Inter/Plus Jakarta + ajustar escala (H1/H2/texto).
4. Aumentar espaçamentos (grid 8pt) e alinhar cards.
5. Melhorar card do item: subtotal, remover como link danger, stepper mais elegante.
6. Resumo sticky + total destacado + cupom/frete.
7. Definir tokens (cores, bordas, sombra, raio) e aplicar em todos os componentes.

---

## 10) Snippet de base (CSS variables) — adapte ao seu stack
> Cole no seu `:root` e use em botões/cards/inputs.

```css
:root {
  --bg: #F6F7FB;
  --surface: #FFFFFF;
  --text: #111827;
  --muted: #6B7280;
  --border: #E5E7EB;

  --primary: #0F766E;      /* teal */
  --primary-hover: #115E59;
  --danger: #DC2626;

  --radius-card: 12px;
  --radius-input: 10px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 10px 30px rgba(0,0,0,.10);
}
```

---

## 11) Próximo passo (se você quiser elevar mais)
Me manda:
- qual stack (React/Next, Angular, etc.)
- se usa Tailwind / CSS Modules / styled-components
- e o link do repositório ou um trecho do CSS atual

Aí eu te devolvo:
- um **tema completo** (tokens + classes)
- componentes prontos (Button, Input, Card, Toast)
- e um layout de carrinho bem “e-commerce real”.
