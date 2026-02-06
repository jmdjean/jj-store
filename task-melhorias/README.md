# Task-melhorias — Melhorias gerais da loja (documentação de negócio)

Esta pasta contém **tarefas de melhoria** derivadas do documento de negócio **melhorias-gerais.docx**, organizadas em arquivos `.md` para implementação incremental.

## Origem

- **Documento:** `documentação de negocio/melhorias-gerais.docx`
- **Objetivo:** Aplicar melhorias de UX/UI, fluxo de compra e área administrativa conforme solicitado no negócio.

## Como usar

1. **Ordem sugerida:** seguir a numeração dos arquivos (01, 02, 03…) ou a ordem definida na seção *Ordem sugerida* abaixo.
2. **Uma tarefa por vez:** implementar apenas o escopo de um arquivo, validar (build/lint/test) e fazer commit antes de passar para a próxima.
3. **Checklist:** marcar os itens `[ ]` como `[x]` conforme forem concluídos.
4. **Convenções:** manter as regras do projeto (CLAUDE.md / AGENTS.md): código em inglês, mensagens ao usuário em pt-BR, arquitetura em camadas no backend, Angular 21 com Signals/guards no frontend.

## Índice das tarefas

| Arquivo | Tema | Resumo |
|--------|------|--------|
| [01-ux-ui-loja-visual-espaco-cores-cards.md](01-ux-ui-loja-visual-espaco-cores-cards.md) | UX/UI da loja | Visual menos “cru”, uso de espaço lateral, paleta de cores adequada à loja, cards de produto com bordas e amostragem melhor para o usuário. |
| [02-fluxo-checkout-login-cadastro.md](02-fluxo-checkout-login-cadastro.md) | Fluxo de compra | Ao clicar em “Comprar” no carrinho, redirecionar para login/cadastro; após autenticação, retornar ao checkout e finalizar; garantir registro de vendas e atualização de estoque. |
| [03-admin-css-profissional.md](03-admin-css-profissional.md) | Área admin | Deixar a área administrativa com aparência mais profissional, corrigindo CSS e consistência visual. |
| [04-formularios-validacao-mascaras.md](04-formularios-validacao-mascaras.md) | Formulários | CPF válido (Brasil), telefone com máscara 11 99999-9999, e-mail validado, campos monetários com máscara R$ (formato brasileiro). |
| [05-categorias-produtos-combo.md](05-categorias-produtos-combo.md) | Categorias | Tabela de categorias de produtos, seed com lista pré-definida, combo com filtro no cadastro de produto. |
| [06-dashboard-backoffice.md](06-dashboard-backoffice.md) | Dashboard admin | Página dashboard como tela inicial do backoffice: cards de vendas e por categorias, gráfico mês atual vs mês anterior. |

## Ordem sugerida

1. **01** — Melhorar a primeira impressão da loja (visual e UX do catálogo/carrinho).
2. **02** — Ajustar o fluxo de compra (login/cadastro no momento certo).
3. **03** — Profissionalizar a área admin (layout e CSS).
4. **04** — Formulários: validação CPF/telefone/e-mail e máscaras (telefone, R$).
5. **05** — Categorias de produtos: tabela, seed e combo com filtro no cadastro.
6. **06** — Dashboard no backoffice (vendas, por categoria, gráfico mês atual vs anterior).

## Relação com as etapas do projeto

- As etapas base estão em **`/tasks/`** (00-bootstrap até 13-mcp-agent-gateway).
- As **task-melhorias** são **evoluções** sobre o que já existe: não substituem as etapas, mas refinam UX/UI e fluxos conforme o documento de negócio.
- Ao implementar uma task-melhoria, considerar os arquivos em `tasks/` e em `CLAUDE.md` para manter consistência (roles, status de pedido, pt-BR, etc.).

## Atualizações

- Novos itens do documento de negócio podem virar novos arquivos nesta pasta (04, 05, …) ou serem incorporados aos existentes.
- Ao concluir uma tarefa, marcar o checklist e fazer um commit claro (ex.: `fix(front): UX loja - espaço, cores e cards`).
