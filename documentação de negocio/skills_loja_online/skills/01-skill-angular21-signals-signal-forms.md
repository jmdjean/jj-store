# SKILL — Frontend Angular 21 (Signals + Signal Forms) | pt-BR para UI, código em inglês

## Objetivo
Gerar **código frontend de altíssima qualidade** usando **Angular 21**, com **Signals**, **Signal Forms**, arquitetura sustentável, tipagem correta, performance e DX.  
**Regra de idioma:** *todo código-fonte (nomes de variáveis, classes, métodos, comentários técnicos) em inglês*; **mensagens ao usuário em pt-BR** (labels, erros, toasts, textos).

---

## Princípios obrigatórios
1. **Código em inglês**: nomes de arquivos, classes, métodos, variáveis, enums e interfaces.
2. **Mensagens ao usuário em pt-BR**: validações, mensagens de erro/sucesso, textos de UI.
3. **Tipagem correta**: nada de `any`. Usar `unknown` quando necessário e refinar.
4. **Clean Code e SOLID (quando fizer sentido)**: funções pequenas, responsabilidades claras.
5. **Documentação leve**: **um comentário no topo de cada método** com **no máximo 2 linhas**, explicando o que faz.
6. **Testes unitários em Jest**: cobertura mínima para serviços, guards, pipes e componentes críticos.
7. **Rodar lint no fim**: `npm run lint` e corrigir antes de finalizar.
8. **Sem gambiarras de UI**: preferir componentes reutilizáveis e layout consistente.

---

## Estrutura sugerida (frontend)
```
frontend/
  src/app/
    core/                 # auth, interceptors, guards, env, config
    shared/               # ui components, pipes, directives, utils
    features/
      catalog/
      cart/
      checkout/
      admin/
    app.routes.ts
  src/assets/i18n/pt-BR.json (opcional)
```

### Regras de organização
- `core` não depende de `features`.
- `shared` não depende de `features`.
- `features` pode depender de `core` e `shared`.
- Rotas por feature (lazy-loading quando fizer sentido).

---

## State management (Signals)
- Preferir **Signals** para estado local e compartilhado simples.
- Evitar “store global gigante”. Criar *feature stores* leves por domínio:
  - `CartStore` (signals)
  - `AuthStore` (signals)
  - `AdminProductsStore` (signals)

### Regras de Signals
- `signal<T>()` para estado.
- `computed()` para derivação.
- `effect()` apenas para efeitos colaterais controlados (evitar loops).
- Evitar mutação direta de objetos aninhados; preferir `set`/`update` com cópia segura.

---

## Formulários com Signal Forms
- Usar Signal Forms para:
  - forms tipados e reativos
  - validação centralizada
  - melhor performance e previsibilidade

### Padrões obrigatórios
- Campos tipados (interfaces de form value).
- Validação com mensagens pt-BR.
- Reutilizar validadores e mensagens em `shared/forms`.

---

## HTTP e API
- Um `ApiClient` centralizado (wrap de HttpClient) + interceptors:
  - `AuthInterceptor` (Bearer token)
  - `ErrorInterceptor` (normaliza erro em pt-BR)
- DTOs separados de Models:
  - `ProductDto` (wire)
  - `Product` (domain model)
- Sempre mapear dados e tratar `null/undefined` corretamente.

---

## UX e mensagens pt-BR
- Criar um `ToastService`/`NotificationService` com mensagens pt-BR.
- Centralizar textos (opcional):
  - `assets/i18n/pt-BR.json`
  - ou `shared/ui/messages.ts`
- Erros comuns:
  - “Não foi possível carregar os dados. Tente novamente.”
  - “Verifique os campos destacados.”
  - “Sessão expirada. Faça login novamente.”

---

## Testes unitários com Jest
### Alvos prioritários
- Services (API + stores)
- Guards (auth/role)
- Componentes de checkout e carrinho
- Pipes e utilitários

### Regras
- Testes determinísticos (sem dependência de tempo/rede).
- Mock do HttpClient via HttpTestingController (ou mock adapters).
- Cobrir cenários de erro com mensagens pt-BR.

---

## Comentários de método (máx. 2 linhas)
Exemplo:
```ts
/** Loads products list based on current filters and pagination. */
loadProducts(): void { ... }
```

Regras:
- Comentário *sempre* em inglês (faz parte do código).
- Máximo 2 linhas.
- Sem redundância (“this function loads products” é ok, mas não explicar o óbvio demais).

---

## Finalização obrigatória
Ao concluir uma tarefa:
1. `npm test` (ou `npm run test`)
2. `npm run lint`
3. `npm run build`
4. Corrigir warnings/erros antes de entregar

---

## Checklists rápidos

### Checklist de um componente de tela
- [ ] Container + componentes puros (separação)
- [ ] Signals para estado e derived state
- [ ] Loading/empty/error states
- [ ] Mensagens pt-BR
- [ ] Tipagem completa
- [ ] Testes unitários
- [ ] Lint ok

### Checklist de um serviço
- [ ] Responsabilidade única
- [ ] Interface/DTOs tipados
- [ ] Tratamento de erro consistente
- [ ] Testes

---

## Referências de implementação (pasta /references)
Consulte os arquivos em `/references/angular/` para exemplos de:
- `signal-store` (estado por feature)
- `error-mapper` (erros pt-BR)
- `typed-signal-form` (form tipado)
