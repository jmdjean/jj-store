# Tarefa 02 – Formulário de produto: corrigir campos de preço

## Objetivo

Corrigir o **erro ao preencher os campos de preço** (Preço de custo e Preço de venda) no formulário de cadastro/edição de produto (novo e editar produto).

## Contexto técnico

- **Componente:** `frontend/src/app/features/admin/pages/admin-product-form-page.component.*`
- **Campos afetados:** `purchasePrice` (Preço de custo) e `salePrice` (Preço de venda).
- **Implementação atual:**
  - Form: `FormBuilder` com `purchasePrice` e `salePrice` numéricos (`[0, [Validators.required, Validators.min(0)]]`).
  - Template: inputs `type="text"` com `inputmode="decimal"` e diretiva `appCurrencyMask`.
  - Diretiva: `frontend/src/app/core/directives/currency-mask.directive.ts` — formata exibição em R$ (pt-BR) e atualiza o `NgControl` com valor numérico.

## Possíveis causas do erro (a validar)

1. **Sincronização ao editar:** ao carregar produto para edição, `patchValue` define números; a diretiva pode não atualizar o valor exibido no input (timing/ordem de inicialização).
2. **Valor inicial zero:** exibição "R$ 0,00" vs valor do control (0) pode gerar inconsistência em `valueChanges` ou na primeira interação.
3. **Parse em edge cases:** campo vazio, apenas "R$", paste de texto não numérico, ou decimais em formato en-US podem quebrar o parse ou a validação.
4. **Conflito com validação:** `Validators.min(0)` com valores definidos pela máscara (por exemplo, `emitEvent: false`) pode deixar o estado do form inconsistente para o usuário (ex.: erro de validação mesmo com valor correto).

## Escopo da tarefa

1. **Reproduzir e documentar**
   - Reproduzir o erro (novo produto e editar produto): digitar, apagar, colar, usar apenas decimais.
   - Anotar cenários em que o preço quebra (ex.: "ao editar, campos ficam vazios" ou "ao colar R$ 1.234,56 dá erro").

2. **Ajustar a diretiva de máscara (se necessário)**
   - Garantir que, após `patchValue` com números, os inputs de preço exibam o valor formatado (R$ X.XXX,XX).
   - Garantir parse robusto: R$, apenas vírgula, apenas ponto, campos vazios, paste.
   - Garantir que o valor escrito no `NgControl` seja sempre número (reais) e que `updateValueAndValidity` seja chamado quando fizer sentido.

3. **Ajustar o componente do formulário (se necessário)**
   - Se for preciso inicializar o valor exibido após carregar o produto, considerar `setTimeout`, `afterNextRender` ou atualização explícita do valor do input após `patchValue`.
   - Garantir que obrigatório e `min(0)` funcionem corretamente com os valores definidos pela máscara.

4. **Testes**
   - Testar: novo produto (preço de custo e venda); editar produto (valores carregados e alterados); limpar campo; colar valor; só decimais; valor zero.
   - Garantir que o payload enviado à API contenha números corretos (sem string, sem NaN).

## Critérios de aceite

- [ ] Não ocorre erro ao preencher Preço de custo e Preço de venda em "Novo produto" e "Editar produto".
- [ ] Ao editar produto, os campos de preço são preenchidos com o valor formatado (R$ X.XXX,XX).
- [ ] Validação (obrigatório e ≥ 0) funciona corretamente com a máscara.
- [ ] API recebe `purchasePrice` e `salePrice` numéricos corretos.

## Skills recomendadas

- Frontend: `angular21-enterprise.skill.md`, `05-skill-ux-ui-professional.md`.
