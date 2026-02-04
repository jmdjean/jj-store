# SKILL - Angular 21 Frontend (Signals + Signal Forms)

## Objective
Generate high-quality Angular 21 frontend code using Signals and Signal Forms, with maintainable architecture, strong typing, and consistent UX.

**Language rule:** source code and technical comments in English; user-facing messages in pt-BR.

---

## Required principles
1. Code in English (files, classes, methods, variables, enums, interfaces).
2. User-facing messages in pt-BR (validation, success/error messages, labels, toasts).
3. Strict typing: avoid `any`; use `unknown` and refine.
4. Clean architecture: small functions, clear responsibilities.
5. Lightweight method comments in English (max 2 lines, only when needed).
6. Unit tests with Jest for critical services, guards, pipes, and components.
7. Run lint before finishing.
8. Prefer reusable UI over ad-hoc solutions.

---

## Suggested structure
```text
frontend/
  src/app/
    core/
    shared/
    features/
    app.routes.ts
```

### Organization rules
- `core` must not depend on `features`.
- `shared` must not depend on `features`.
- `features` may depend on `core` and `shared`.

---

## Signals state patterns
- Use feature stores by domain.
- Use `signal()` for mutable state.
- Use `computed()` for derived state.
- Use `effect()` for side effects.
- Avoid direct nested object mutation.

## Signal Forms patterns
- Centralized validation.
- Typed form models.
- Clear submit lifecycle.
- Preserve user input on recoverable failures.

### pt-BR message examples
- "Nao foi possivel carregar os dados. Tente novamente."
- "Sessao expirada. Faca login novamente."

---

## Completion checklist
- [ ] Scope implemented for the current stage
- [ ] Lint/build/tests passing (when available)
- [ ] User-facing messages in pt-BR
- [ ] Code and technical comments in English
