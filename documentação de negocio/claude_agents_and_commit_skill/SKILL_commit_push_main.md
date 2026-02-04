# SKILL — Commit & Push (direto na main)

## Objetivo
Padronizar o fluxo de **commit e push** ao final de cada etapa/tarefa, sempre mantendo a branch `main` atualizada.

> Regra: ao finalizar a etapa, fazer **commit com resumo do que foi feito** e **push direto na `main`**.

---

## Checklist obrigatório antes do commit
1. Garantir que a etapa está completa conforme `/tasks/<etapa>.md`.
2. Rodar lint e corrigir erros:
   - Frontend: `npm run lint`
   - Backend: `npm run lint`
3. Rodar testes (quando existirem):
   - Frontend: `npm test` (Jest) ou `npm run test`
   - Backend: `npm test` (se configurado)
4. Garantir que não há arquivos temporários ou segredos commitados.
5. Revisar `git status` para ver exatamente o que será commitado.

---

## Formato da mensagem do commit
A mensagem deve ter um **resumo claro** do que foi feito. Exemplos:

- `feat(auth): adiciona login JWT e RBAC (pt-BR)`
- `feat(catalogo): cria listagem pública e detalhes de produto (pt-BR)`
- `feat(rag): indexa produtos no pgvector e cria endpoint de busca (pt-BR)`

Se quiser incluir corpo (recomendado quando houver várias mudanças):
```
feat(admin): CRUD de produtos e estoque (pt-BR)

- adiciona endpoints protegidos (ADMIN/MANAGER)
- cria telas de listagem e formulário
- inclui validações e mensagens pt-BR
```

---

## Comandos (exemplo)
> Ajuste os scripts conforme o repositório.

### 1) Verificar mudanças
```bash
git status
```

### 2) Adicionar arquivos (preferir granular quando necessário)
```bash
git add .
```

### 3) Commit com resumo
```bash
git commit -m "feat: resumo do que foi feito (pt-BR)"
```

### 4) Push direto na main
```bash
git push origin main
```

---

## Boas práticas
- Um commit por etapa (quando possível).
- Evitar commits “WIP”.
- Não misturar refatorações grandes com feature nova no mesmo commit.
- Se o agente precisar alterar muita coisa, dividir em sub-etapas e commitar cada uma com clareza.

---

FIM.
