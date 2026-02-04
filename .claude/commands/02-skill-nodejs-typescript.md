# SKILL - Node.js Backend (TypeScript)

## Objective
Build backend features in Node.js + TypeScript with clean architecture, strict typing, standardized errors, and good testability.

**Language rule:** source code and technical comments in English; user-facing messages in pt-BR.

---

## Required principles
1. TypeScript with strict typing.
2. Avoid `any`; use `unknown` + refinement.
3. Layered architecture: `routes -> controllers -> services -> repositories`.
4. Input validation with DTO/schema.
5. JWT + RBAC (`ADMIN`, `MANAGER`, `CUSTOMER`).
6. Standardized error handling.
7. Method comments in English (max 2 lines, only when needed).
8. Structured logging without sensitive data.
9. Services designed for testability.

---

## Suggested structure
```text
backend/
  src/
    config/
    routes/
    controllers/
    services/
    repositories/
    middlewares/
    dtos/
    utils/
```

## API response standard
```json
{ "mensagem": "Operacao realizada com sucesso.", "dados": {} }
```

```json
{ "mensagem": "Nao foi possivel concluir a operacao.", "detalhes": { "campo": "..." } }
```

---

## Security baseline
- Hash passwords.
- JWT with expiration and env secret.
- Configurable CORS.
- Never log passwords, tokens, or raw personal data.

## Completion checklist
- [ ] Validation implemented
- [ ] Error middleware standardized
- [ ] RBAC applied on protected routes
- [ ] User-facing messages in pt-BR
