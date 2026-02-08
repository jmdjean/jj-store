# Tarefas de melhorias – JJ Store

Este diretório contém as tarefas derivadas do documento **documentação de negócio/melhorias-gerais.docx** e de solicitações complementares. As melhorias cobrem UX/UI da área administrativa, formulários, listagens e identidade visual.

## Como executar

- **Ordem sugerida:** executar as tarefas na ordem numérica (01, 02, 03…) quando houver dependência entre elas.
- **Skills:** usar as skills do repositório (`.claude/commands` ou referenciadas em `CLAUDE.md` / `AGENTS.md`) para auxiliar no desenvolvimento:
  - Frontend Angular: `angular21-enterprise.skill.md` + `05-skill-ux-ui-professional.md`
  - Backend Node: `node-ecommerce-nestjs.skill.md`
  - Outras skills indicadas em cada tarefa quando aplicável.

## Lista de tarefas

| # | Arquivo | Resumo |
|---|---------|--------|
| 01 | [01-favicon-logo-navegador.md](./01-favicon-logo-navegador.md) | Favicon da aba do navegador = logo JJ Store (não o "A" do Angular) |
| 02 | [02-formulario-produto-preco.md](./02-formulario-produto-preco.md) | Corrigir erro ao preencher campos de preço no formulário de produto |
| 03 | [03-formulario-produto-ux.md](./03-formulario-produto-ux.md) | Melhorar UX/UI do formulário de produto com base no formulário "Novo contrato" |
| 04 | [04-listagem-produtos-ux.md](./04-listagem-produtos-ux.md) | Profissionalizar listagem de produtos com base na tela "Rastreabilidade" |
| 05 | [05-admin-menu-header.md](./05-admin-menu-header.md) | Remover menu lateral admin/manager e colocar menu no header (conforme doc de melhorias) |
| 06 | [06-melhorias-doc-word.md](./06-melhorias-doc-word.md) | Itens adicionais do documento Word de melhorias gerais |

## Convenções

- Código e nomes técnicos em **inglês**.
- Textos de interface (labels, mensagens, validações) em **pt-BR** com acentuação correta (UTF-8).
- Commits pequenos e descritivos por tarefa concluída.
