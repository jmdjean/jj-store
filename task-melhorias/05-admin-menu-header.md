# Tarefa 05 – Admin/Manager: menu no header (remover menu lateral)

## Objetivo

**Remover o menu lateral** da área administrativa (admin e manager) e **colocar a navegação no header** da página, conforme a ideia descrita no documento **documentação de negócio/melhorias-gerais.docx**.

## Contexto atual

- **Layout:** `frontend/src/app/features/admin/pages/admin-page.component.html`
- **Sidebar:** `<aside class="admin-sidebar">` com logo JJ Store, subtítulo “Gestão de catálogo, pedidos e inventário” e links: Dashboard, Produtos, Pedidos, Pesquisa RAG.
- **Header (topbar):** `<header class="admin-topbar">` com logo, texto “Área administrativa”, “Olá, [nome]” e botão “Sair”.
- O conteúdo principal fica em `admin-content-area` > `admin-content` com `<router-outlet />`.

## Escopo da tarefa

1. **Remover o menu lateral**
   - Remover o `<aside class="admin-sidebar">` (ou equivalente) e todo o bloco de navegação lateral.
   - Ajustar o layout para que a área útil ocupe toda a largura (sem coluna fixa à esquerda).

2. **Incluir o menu no header**
   - No `<header class="admin-topbar">` (ou no header único da área admin):
     - Manter à esquerda: logo JJ Store (link para /admin) e, se fizer sentido, o texto “Área administrativa” / “Gestão de catálogo, pedidos e inventário”.
     - Inserir **links de navegação** no header: Dashboard, Produtos, Pedidos, Pesquisa RAG.
     - Manter à direita: “Olá, [nome]” e botão “Sair”.
   - Navegação no header deve:
     - Destacar o item ativo (ex.: `routerLinkActive` com classe `active`).
     - Ser acessível (teclado e leitores de tela).
     - Em mobile: considerar menu hambúrguer ou dropdown que exiba os mesmos itens.

3. **Layout e CSS**
   - Ajustar estilos para um header único com logo + itens de menu + usuário/sair.
   - Garantir que o conteúdo principal (`<main class="admin-content">`) use toda a largura disponível abaixo do header.
   - Manter identidade visual da JJ Store (cores, tipografia) conforme doc de melhorias.

4. **Documento de melhorias**
   - O documento **melhorias-gerais.docx** contém a ideia do header; ao implementar, seguir essa ideia (e, se no doc houver detalhes como ordem dos itens ou textos, replicar).

## Critérios de aceite

- [ ] Menu lateral (sidebar) removido; não há coluna fixa com links à esquerda.
- [ ] Links Dashboard, Produtos, Pedidos, Pesquisa RAG estão no header da página.
- [ ] Item ativo da navegação fica visualmente destacado.
- [ ] Logo, “Olá, [nome]” e “Sair” permanecem no header; layout responsivo e acessível.
- [ ] Área de conteúdo principal utiliza toda a largura abaixo do header.

## Skills recomendadas

- Frontend: `angular21-enterprise.skill.md`, `05-skill-ux-ui-professional.md`.

## Arquivos principais

- `frontend/src/app/features/admin/pages/admin-page.component.html`
- `frontend/src/app/features/admin/pages/admin-page.component.scss` (ou estilos globais do admin)
- Rotas e `routerLink`/`routerLinkActive` já existentes podem ser reutilizados; apenas a posição dos links muda.
