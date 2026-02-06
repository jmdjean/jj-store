# Melhoria 03 — Área admin: CSS e aparência profissional

## Origem (documento de negócio)

> "Na parte de admin está com o CSS muito esquisito, precisa ficar mais profissional."

## Objetivo

Deixar a **área administrativa** (Admin/Manager) com aparência **profissional**: layout consistente, CSS organizado, componentes alinhados e visuais que transmitam confiança e clareza para uso operacional diário.

## Convenções do projeto (aplicáveis)

- **Idioma:** textos de UI em **pt-BR**; código em **inglês**.
- **Frontend:** Angular 21; área admin restrita a ADMIN e MANAGER (roleGuard).
- **Design:** seguir princípios em `.cursor/rules/design-principles.mdc` e skill UX/UI (`05-skill-ux-ui-professional.md`).

## Escopo

### 1. Layout da área admin

- **Sidebar e/ou topbar:** estrutura clara de navegação (ex.: Produtos, Pedidos, Estoque, RAG, etc.) com itens bem identificados e estados visuais (ativo, hover).
- **Container principal:** conteúdo das telas (listagens, formulários) com padding e largura adequados, sem elementos “colados” nas bordas ou sobrepostos.
- **Hierarquia:** títulos de página, subtítulos e tabelas/formulários com tamanhos e pesos de fonte consistentes.

### 2. Consistência visual

- **Cores:** uso da mesma paleta (ou subpaleta) definida no projeto; botões primários/secundários e estados de erro/sucesso coerentes com o resto da aplicação.
- **Espaçamento:** padding e margin uniformes entre seções, cards, linhas de tabela e botões.
- **Bordas e sombras:** uso moderado para separar blocos (cards, sidebars, modais) sem poluir a tela.

### 3. Componentes e tabelas

- **Tabelas:** cabeçalhos legíveis, linhas alternadas ou hover para facilitar leitura; alinhamento de números e textos; ações (editar, excluir) claramente identificadas.
- **Formulários:** labels alinhados, campos com altura e contorno consistentes; botões "Salvar", "Cancelar" com posicionamento lógico (ex.: rodapé do formulário ou barra de ações).
- **Botões e links:** tamanho e contraste adequados; estados de loading quando a ação for assíncrona.

### 4. Responsividade e acessibilidade

- **Responsivo:** área admin utilizável em telas médias e grandes; sidebar colapsável ou adaptada em telas menores, se fizer sentido.
- **Acessibilidade:** contraste suficiente, foco visível em elementos interativos e estrutura semântica (títulos, landmarks) para leitores de tela quando possível.

## Checklist de tarefas

### Estrutura e navegação

- [ ] Layout base da área admin definido (sidebar e/ou topbar com itens de menu).
- [ ] Rota ativa destacada visualmente no menu.
- [ ] Container do conteúdo com padding e max-width consistentes.

### Estilos gerais

- [ ] Paleta de cores aplicada de forma consistente (botões, links, fundos, bordas).
- [ ] Espaçamentos (padding/margin) padronizados entre seções e componentes.
- [ ] Remoção ou ajuste de estilos “esquisitos” (fontes inconsistentes, cores soltas, elementos mal alinhados).

### Listagens e formulários

- [ ] Tabelas com cabeçalho e linhas legíveis; alinhamento e espaçamento adequados.
- [ ] Formulários (criar/editar produto, etc.) com labels e campos alinhados; botões de ação visíveis e consistentes.
- [ ] Cards ou painéis que agrupam conteúdo com borda/sombra sutil.

### Qualidade

- [ ] Build e lint do frontend passando.
- [ ] Textos da área admin em pt-BR com acentuação correta.
- [ ] Nenhum estilo quebrado em telas comuns (ex.: 1280px, 1920px).

## Critérios de aceite

- [ ] A área admin transmite aparência profissional (layout organizado, sem “CSS esquisito”).
- [ ] Navegação clara e conteúdo das telas legível e bem espaçado.
- [ ] Consistência com o restante do projeto (cores, tipografia, componentes).
- [ ] Mensagens e labels em pt-BR.

## Referências

- `tasks/06-admin-products-inventory.md` — produtos e estoque (admin).
- `tasks/08-admin-orders.md` — pedidos e status (admin).
- `.cursor/rules/design-principles.mdc` — princípios de UI/UX.
- `.claude/commands/05-skill-ux-ui-professional.md` — skill UX/UI.
- `CLAUDE.md` — roles ADMIN/MANAGER e estrutura do projeto.

## Commit sugerido

- `fix(front): área admin com CSS e layout profissional`
