# Melhoria 01 — UX/UI da loja: visual, espaço lateral, cores e cards de produto

## Origem (documento de negócio)

> "Quero melhorar meu site, está muito feio e cru, é uma loja online. Está usando pouco espaço lateral, precisa melhorar o UX dessa aplicação. Essas cores estão muito cruas, não tem a ver com loja online. O card dos produtos está comendo as bordas, precisa melhorar a amostragem pro usuário e deixar uma borda mais presente."

## Objetivo

Deixar a **área pública da loja** (catálogo, listagem de produtos, carrinho e páginas relacionadas) com aparência e experiência mais adequadas a uma loja online: uso melhor do espaço, paleta de cores coerente com o contexto de e-commerce, e cards de produto com bordas claras e amostragem mais confortável para o usuário.

## Convenções do projeto (aplicáveis)

- **Idioma:** todo texto voltado ao usuário em **pt-BR** (labels, botões, mensagens, validações).
- **Código:** nomes de arquivos, classes, métodos, variáveis e comentários técnicos em **inglês**.
- **Frontend:** Angular 21; preferir Signals e formulários tipados; respeitar guards e interceptors.
- **Design:** ver `.cursor/rules/design-principles.mdc` e skill UX/UI (`05-skill-ux-ui-professional.md`) para hierarquia visual, acessibilidade e consistência.

## Escopo

### 1. Uso do espaço lateral

- **Problema:** pouco uso do espaço lateral; layout parece “apertado” ou desbalanceado.
- **O que fazer:**
  - Definir **largura máxima (max-width)** do conteúdo principal e centralizar (ex.: container principal com `max-width` e `margin: 0 auto`).
  - Garantir **margens/padding laterais** consistentes em telas médias e grandes (ex.: 24px–32px ou equivalente em rem).
  - Em listagens (catálogo), usar grid ou flex com colunas que aproveitem a largura disponível sem colar nas bordas da viewport.
- **Onde:** layout principal da loja (header, container do catálogo, página do carrinho, footer se houver).

### 2. Paleta de cores

- **Problema:** cores “muito cruas”, não associadas a uma loja online.
- **O que fazer:**
  - Definir uma **paleta** (primária, secundária, neutros, estados de sucesso/erro) adequada a e-commerce (confiança, clareza, contraste para leitura).
  - Aplicar a paleta de forma consistente em botões, links, cards, cabeçalhos e fundos.
  - Evitar tons que pareçam “placeholder” ou genéricos demais; manter contraste suficiente (WCAG 2.1 AA quando possível).
- **Onde:** variáveis CSS/SCSS (ou tema Angular) e componentes da área pública (catálogo, carrinho, header, footer).

### 3. Cards de produto

- **Problema:** cards “comendo as bordas”; amostragem ruim para o usuário; borda pouco presente.
- **O que fazer:**
  - Garantir **espaçamento interno (padding)** dentro do card (imagem, título, preço, botão) para o conteúdo não colar nas bordas do card.
  - Deixar **borda ou sombra** visível (ex.: borda sutil ou `box-shadow`) para delimitar claramente o card.
  - Ajustar **espaçamento entre cards** (gap no grid/flex) para não parecer colado na borda da tela ou em outros cards.
  - Revisar **amostragem**: tamanho da imagem, tamanho de fonte do nome e preço, área clicável do botão “Adicionar ao carrinho” (ou equivalente).
- **Onde:** componente(s) de listagem de produtos (catálogo) e qualquer outro lugar onde o card de produto seja exibido.

### 4. UX geral da aplicação (loja)

- Revisar **hierarquia visual** (títulos, subtítulos, destaque de preço e CTA).
- Manter **navegação clara** (menu, breadcrumb se fizer sentido, voltar ao catálogo/carrinho).
- Garantir **feedback visual** em ações (ex.: botão “Adicionar ao carrinho” com estado de loading ou confirmação).
- **Responsividade:** layout e cards devem se comportar bem em mobile e desktop (conforme design principles do projeto).

## Checklist de tarefas

### Layout e espaço

- [ ] Container principal da loja com `max-width` e margens laterais consistentes.
- [ ] Catálogo (grid de produtos) com gap e margens que não “colem” nas bordas da tela.
- [ ] Página do carrinho e demais páginas públicas com o mesmo padrão de largura e espaçamento.

### Cores

- [ ] Paleta definida (variáveis CSS/SCSS ou tema) e documentada (ex.: comentário no tema ou em docs).
- [ ] Aplicação da paleta em header, botões, links, cards e fundos da área pública.
- [ ] Contraste e leitura verificados (evitar texto ilegível ou cores “cruas” demais).

### Cards de produto

- [ ] Padding interno do card suficiente (conteúdo não cola nas bordas do card).
- [ ] Borda ou sombra visível para delimitar o card.
- [ ] Gap entre cards e entre cards e a borda do container.
- [ ] Amostragem revisada: imagem, nome, preço e CTA legíveis e com área de toque adequada.

### Consistência e qualidade

- [ ] Textos de UI em pt-BR e com acentuação correta.
- [ ] Build e lint do frontend passando.
- [ ] Testes existentes mantidos ou atualizados (se houver testes de componente para catálogo/cards).

## Critérios de aceite

- [ ] A loja (catálogo e carrinho) não parece “crua”: uso de espaço e cores coerentes com uma loja online.
- [ ] Cards de produto têm borda/presença clara e amostragem confortável para o usuário.
- [ ] Espaço lateral utilizado de forma equilibrada em desktop e tablet.
- [ ] Nenhuma mensagem ou label em inglês na área pública; acentuação pt-BR correta.

## Referências

- `CLAUDE.md` / `AGENTS.md` — regras de idioma e arquitetura.
- `tasks/03-catalog.md` — etapa de catálogo (contexto de produtos e listagem).
- `tasks/04-cart-checkout.md` — etapa de carrinho e checkout.
- `.cursor/rules/design-principles.mdc` — princípios de UI/UX.
- `.claude/commands/05-skill-ux-ui-professional.md` — skill de UX/UI.

## Commit sugerido

- `fix(front): UX/UI loja - espaço lateral, paleta de cores e cards de produto`
