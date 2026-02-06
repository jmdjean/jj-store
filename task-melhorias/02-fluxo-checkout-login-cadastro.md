# Melhoria 02 — Fluxo de checkout: login/cadastro antes de finalizar a compra

## Origem (documento de negócio)

> "Ao adicionar no carrinho os produtos e clicar em comprar, deve abrir a tela de login ou cadastro, para o comprador se cadastrar e finalizar a compra. Assim que ele logar, daí sim ele pode completar a compra. Daí cadastrar nos produtos que foram vendidos, atualizar o estoque e toda lógica que o projeto já faz."

## Objetivo

Garantir que, ao clicar em **"Comprar"** (ou equivalente) a partir do carrinho, o usuário seja levado à **tela de login ou cadastro**; após autenticação (ou novo cadastro), retornar ao **checkout** para concluir o pedido. Confirmar que a lógica existente de registro de vendas e atualização de estoque permaneça funcionando.

## Convenções do projeto (aplicáveis)

- **Idioma:** todo texto voltado ao usuário em **pt-BR**.
- **Código:** em **inglês** (arquivos, classes, métodos, variáveis, comentários técnicos).
- **Backend:** camadas routes → controllers → services → repositories; regras de negócio nos services.
- **Frontend:** Angular 21; guards (authGuard, roleGuard); interceptors para JWT e erros.

## Escopo

### 1. Ponto de entrada: "Comprar" no carrinho

- **Comportamento esperado:** ao clicar no botão que leva ao checkout (ex.: "Comprar", "Finalizar compra", "Ir para o checkout"):
  - Se o usuário **não** estiver autenticado (CUSTOMER): redirecionar para **login** ou oferta de **cadastro** (com opção de "Já tenho conta" / "Criar conta").
  - Se o usuário **já** estiver logado: seguir para a tela de **checkout** (confirmar endereço, itens e finalizar).
- **Implementação típica:**
  - Rota `/checkout` (ou equivalente) protegida por **authGuard**; ao acessar sem estar logado, redirecionar para `/login` (ou `/auth/login`) com **returnUrl** ou query param indicando `/checkout` (ex.: `?returnUrl=/checkout`).
  - Na tela de login/cadastro, após sucesso de login ou cadastro, redirecionar para o `returnUrl` quando existir; caso contrário, para home ou carrinho.

### 2. Tela de login e cadastro

- Garantir que exista **uma tela (ou fluxo)** onde o usuário possa:
  - **Fazer login** (e-mail/senha ou conforme o projeto).
  - **Criar conta** (cadastro) com os dados necessários para CUSTOMER (conforme `tasks/02-customer-profile.md` e regras de negócio).
- Após **login** ou **cadastro** bem-sucedido: redirecionar para **checkout** quando o usuário veio do carrinho (ex.: `returnUrl=/checkout`).
- Mensagens em pt-BR (ex.: "Login realizado com sucesso", "Conta criada. Faça login para continuar" ou fluxo direto pós-cadastro).

### 3. Conclusão do checkout (já existente)

- O projeto já possui lógica de checkout: criar pedido, itens, decrementar estoque (em transação), e possivelmente gerar documento RAG do pedido.
- **Não alterar** a lógica de negócio do backend (criação de pedido, order_items, estoque); apenas garantir que o **fluxo do frontend** leve o usuário logado até essa etapa.
- Validar que, após o redirect pós-login/cadastro, o usuário consegue:
  - Ver o resumo do carrinho no checkout.
  - Confirmar endereço (ou usar o do perfil).
  - Finalizar a compra e receber confirmação em pt-BR.

### 4. Registro de vendas e estoque

- Conforme documento de negócio: "cadastrar nos produtos que foram vendidos, atualizar o estoque e toda lógica que o projeto já faz".
- **Verificar** que os endpoints e serviços atuais já fazem isso (ex.: `POST /cart/checkout` ou equivalente cria ordem, itens e decrementa estoque).
- Se algo estiver faltando (ex.: auditoria, registro de itens vendidos), documentar ou incluir no checklist como item opcional desta melhoria.

## Checklist de tarefas

### Frontend — Navegação e guards

- [x] Rota de checkout protegida por authGuard (apenas usuário autenticado).
- [x] Ao acessar checkout sem login: redirecionar para login (ou cadastro) com `returnUrl` (ex.: `/checkout` ou `/carrinho/checkout`).
- [x] Botão "Comprar" no carrinho leva à rota de checkout (que por sua vez dispara o redirect para login se necessário).

### Frontend — Login e cadastro

- [x] Tela de login com redirecionamento pós-sucesso para `returnUrl` quando existir.
- [x] Fluxo de cadastro disponível (nova conta CUSTOMER); após sucesso, redirecionar para `returnUrl` ou para login com mensagem em pt-BR.
- [x] Mensagens de sucesso/erro em pt-BR (ex.: "Não foi possível fazer login", "Preencha todos os campos").

### Frontend — Checkout

- [x] Usuário logado que acessa checkout vê resumo do carrinho e pode confirmar endereço e finalizar.
- [x] Após finalizar, mensagem de sucesso em pt-BR e redirecionamento adequado (ex.: "Meus pedidos" ou home).

### Backend (verificação)

- [x] Endpoint de checkout cria pedido e itens e decrementa estoque em transação (já existente; apenas validar).
- [x] Respostas de erro do checkout em pt-BR (ex.: "Estoque insuficiente para o produto X").

## Critérios de aceite

- [x] Usuário não logado que clica em "Comprar" no carrinho é levado à tela de login/cadastro.
- [x] Após login ou cadastro, o usuário é redirecionado ao checkout e consegue finalizar a compra.
- [x] Pedido é criado corretamente; estoque é atualizado; mensagens ao usuário em pt-BR.
- [x] Nenhum fluxo quebrado para usuário já logado (acesso direto ao checkout continua funcionando).

## Referências

- `tasks/01-auth-rbac.md` — autenticação e roles.
- `tasks/02-customer-profile.md` — perfil e cadastro do cliente.
- `tasks/04-cart-checkout.md` — carrinho e checkout (backend e frontend).
- `CLAUDE.md` — guards (authGuard, roleGuard) e fluxo cliente.

## Commit sugerido

- `feat(front): fluxo checkout com redirect para login/cadastro e returnUrl`
