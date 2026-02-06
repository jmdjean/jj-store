# Melhoria 04 — Formulários: validação e máscaras profissionais

## Origem (documento de negócio / solicitação)

> Deixar formulários mais profissionais. CPF com tamanho e preenchimento corretos e validação pela regra do Brasil. Telefone com máscara 11 99999-9999 e validação. Email validado corretamente. Campos monetários com máscara R$ no formato brasileiro.

## Objetivo

Padronizar e profissionalizar os formulários da aplicação com **validações corretas** (CPF brasileiro, telefone celular, e-mail) e **máscaras de entrada** (telefone e valores em R$), em todos os pontos onde esses campos aparecem.

## Convenções do projeto (aplicáveis)

- **Idioma:** todo texto voltado ao usuário em **pt-BR** (labels, mensagens de validação, placeholders).
- **Código:** nomes de arquivos, classes, métodos, variáveis e comentários técnicos em **inglês**.
- **Frontend:** Angular 21; preferir Signals e formulários tipados; validadores reutilizáveis quando fizer sentido.
- **Backend:** manter validação de CPF/telefone/email no servidor onde os dados são persistidos (camada de serviços).

## Escopo

### 1. CPF

- **Regras:** 11 dígitos; algoritmo de dígitos verificadores do CPF brasileiro; rejeitar sequências inválidas (ex.: 111.111.111-11).
- **Onde aplicar:** cadastro de cliente (`customer-register-page`), exibição/edição de perfil (`customer-profile-page` — campo pode ser somente leitura; se editável, validar).
- **Frontend:** máscara visual `000.000.000-00`; validação em tempo real ou no submit; mensagens em pt-BR (ex.: "CPF inválido.", "Informe um CPF válido.").
- **Backend:** validar CPF no `customer-profile.service` (registro e atualização) e retornar `mensagem` em pt-BR em caso de erro.

### 2. Telefone

- **Formato:** máscara `(00) 00000-0000` para celular (11 dígitos) ou `(00) 0000-0000` para fixo (10 dígitos), conforme padrão brasileiro. Solicitação explícita: formato tipo `11 99999-9999` — interpretar como DDD + 9 dígitos (celular); pode-se exibir como `(11) 99999-9999` para alinhar ao padrão mais comum.
- **Validação:** aceitar 10 ou 11 dígitos (após remoção de formatação); DDD válido (11–99); celular: nono dígito 9.
- **Onde aplicar:** cadastro de cliente, perfil do cliente.
- **Frontend:** máscara de input; validação (pattern ou validador customizado); mensagem em pt-BR em caso de erro.
- **Backend:** validar tamanho e caracteres no serviço de perfil; persistir apenas dígitos ou no formato definido pelo projeto.

### 3. E-mail

- **Validação:** formato válido (RFC) e, se desejado, comprimento razoável; mensagem clara em pt-BR.
- **Onde aplicar:** cadastro de cliente, perfil do cliente, login (se houver campo de e-mail).
- **Frontend:** `Validators.email` já cobre formato básico; garantir mensagem de erro em pt-BR (ex.: "Informe um e-mail válido.").
- **Backend:** validar formato no serviço e retornar erro padronizado em pt-BR.

### 4. Campos monetários (R$)

- **Formato:** máscara brasileira com R$ (ex.: R$ 1.234,56); valor numérico enviado ao backend em centavos ou decimal conforme API existente.
- **Onde aplicar:** formulário de produto no backoffice (`admin-product-form-page`: `purchasePrice`, `salePrice`); qualquer outro formulário que exiba ou edite valores em reais.
- **Frontend:** input com máscara de moeda pt-BR; ao enviar, converter para o valor numérico esperado pela API (ex.: reais ou centavos, conforme contrato).
- **Backend:** não é obrigatório alterar; garantir que a API continua recebendo valores numéricos (reais ou centavos) conforme já definido.

## Checklist de tarefas

### CPF

- [ ] Criar validador/diretiva ou validador reutilizável de CPF (algoritmo brasileiro) no frontend.
- [ ] Aplicar máscara `000.000.000-00` nos formulários de cadastro e perfil (onde o CPF for editável).
- [ ] Mensagens de erro em pt-BR para CPF inválido.
- [ ] Validar CPF no backend (customer profile service) e retornar `mensagem` em pt-BR.

### Telefone

- [ ] Máscara de telefone (ex.: `(00) 00000-0000` / `(00) 0000-0000` ou conforme especificação `11 99999-9999`).
- [ ] Validador de telefone (10/11 dígitos, DDD e nono dígito quando for celular).
- [ ] Aplicar em cadastro e perfil do cliente; mensagens em pt-BR.
- [ ] Backend: validar e persistir formato acordado.

### E-mail

- [ ] Revisar validadores de e-mail nos formulários (cadastro, perfil).
- [ ] Mensagens de erro em pt-BR para e-mail inválido.
- [ ] Backend: validar formato e responder com `mensagem` em pt-BR.

### Campos monetários

- [ ] Aplicar máscara R$ (formato pt-BR) nos campos de preço de compra e venda do formulário de produto (admin).
- [ ] Garantir que o valor enviado à API permaneça no tipo e escala esperados (ex.: número em reais ou centavos).
- [ ] Exibir valores existentes (edição) com a mesma máscara.

### Consistência e qualidade

- [ ] Textos de UI e mensagens de validação em pt-BR com acentuação correta.
- [ ] Build e lint do frontend e backend passando.
- [ ] Testes unitários atualizados ou criados para validadores críticos (CPF, telefone), se aplicável.

## Critérios de aceite

- [ ] CPF só é aceito quando válido pelo algoritmo brasileiro; máscara aplicada; mensagem clara em pt-BR.
- [ ] Telefone com máscara e validação correta (formato brasileiro); mensagem em pt-BR.
- [ ] E-mail validado com mensagem em pt-BR.
- [ ] Preço de compra e venda no cadastro de produto com máscara R$ em formato brasileiro e valor correto na API.
- [ ] Nenhuma mensagem de validação em inglês; acentuação pt-BR correta.

## Referências

- `CLAUDE.md` / `AGENTS.md` — regras de idioma e arquitetura.
- `frontend/src/app/features/customer/pages/customer-register-page.component.ts` — cadastro com CPF, telefone, e-mail.
- `frontend/src/app/features/customer/pages/customer-profile-page.component.ts` — perfil com os mesmos campos.
- `frontend/src/app/features/admin/pages/admin-product-form-page.component.ts` — preços de produto.
- `backend/src/services/customer-profile.service.ts` — validação no servidor.

## Commit sugerido

- `feat(forms): validação CPF/telefone/email e máscaras R$ e telefone nos formulários`
