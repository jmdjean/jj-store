# SKILL — Backend Node.js (TypeScript) | código em inglês, mensagens pt-BR

## Objetivo
Desenvolver o backend em Node.js com **melhores práticas**, **código limpo**, **tipagem correta** e **arquitetura escalável**.  
**Regra de idioma:** código (nomes e comentários) em inglês; **mensagens voltadas ao usuário em pt-BR**.

---

## Princípios obrigatórios
1. **TypeScript obrigatório** (tipagem estrita).
2. **Sem `any`** (usar `unknown` e refinar).
3. **Arquitetura em camadas**:
   - `routes` → `controllers` → `services` → `repositories`
4. **Validação de entrada** com schemas/DTOs (mensagens pt-BR).
5. **RBAC** (ADMIN/MANAGER/CUSTOMER) e JWT.
6. **Tratamento de erros padronizado** (pt-BR).
7. **Documentação leve**: comentário de 1–2 linhas no topo de cada método (em inglês).
8. **Logs estruturados** (sem expor dados sensíveis).
9. **Testabilidade**: services sem dependências difíceis de mockar.

---

## Estrutura sugerida (backend)
```
backend/
  src/
    config/
    routes/
    controllers/
    services/
    repositories/
    middlewares/
    domain/          # entities, value objects, enums
    dtos/            # request/response dtos
    utils/
    app.ts
    server.ts
```

---

## Padrão de resposta da API (pt-BR)
### Sucesso
```json
{ "mensagem": "Operação realizada com sucesso.", "dados": { } }
```
### Erro (padronizado)
```json
{ "mensagem": "Não foi possível concluir a operação.", "detalhes": { "campo": "..." } }
```

Regras:
- `mensagem` sempre em pt-BR.
- `detalhes` opcional (útil para validação).
- HTTP status correto (400/401/403/404/409/500).

---

## Tratamento de erros
- Criar `AppError` com:
  - `statusCode`
  - `publicMessage` (pt-BR)
  - `details` (opcional)
- Middleware global de erro converte exceções para o padrão acima.
- Nunca retornar stack trace para o cliente.

---

## Validação de input
- Validar DTOs na borda (controllers).
- Mensagens pt-BR (“E-mail inválido”, “Senha obrigatória”, etc.).
- Sanitizar strings e limitar tamanhos.

---

## Segurança
- Hash de senha com bcrypt/argon2.
- JWT com expiração e segredo em env.
- Rate limit (opcional etapa futura).
- CORS configurável.
- Não logar senhas, tokens ou CPF bruto.

---

## Comentários de método (máx. 2 linhas)
Exemplo:
```ts
/** Creates a new order and decrements inventory atomically. */
async createOrder(input: CreateOrderInput): Promise<Order> { ... }
```

---

## Testes (recomendado)
- Unit tests para `services` e `utils`.
- Integration tests para rotas críticas (opcional).
- Mocks: repositories e gateways externos.

---

## Checklist por feature
- [ ] Rotas com validação
- [ ] Service com regra de negócio
- [ ] Repository com queries isoladas
- [ ] Erros padronizados pt-BR
- [ ] Testes cobrindo sucesso e falha
- [ ] Logging sem dados sensíveis

---

## Referências de implementação (pasta /references)
Consulte `/references/node/` para exemplos de:
- middleware de erro padronizado
- RBAC com JWT
- validação DTO com mensagens pt-BR
