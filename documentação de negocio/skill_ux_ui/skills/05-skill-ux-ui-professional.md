# SKILL — UX/UI (Experiência do Usuário) para Loja Online (Angular 21)

## Objetivo
Garantir que todas as telas do frontend (Angular 21) sejam **profissionais, maduras e consistentes**, seguindo boas práticas de **UX**, **UI**, **acessibilidade** e **feedback ao usuário**.  
Esta skill deve **auxiliar diretamente** a skill de Angular: orientar layout, padrões de tela, grids com **badges** (cores semânticas), formulários, mensagens de erro “user-friendly” (pt-BR) e estados (loading/empty/error).

> **Regra do projeto:**  
> - **Código** (nomes e comentários técnicos) em **inglês**  
> - **Textos/mensagens para o usuário** em **Português (Brasil)**

---

## 1) Pilares obrigatórios de UX
### 1.1 Clareza
- O usuário deve entender em **3 segundos**:
  - onde está (título + breadcrumb quando fizer sentido)
  - o que pode fazer (ações principais visíveis)
  - o que aconteceu (feedback imediato)

### 1.2 Consistência
- Mesma linguagem visual em todo o app:
  - espaçamentos, tipografia, botões, ícones, grids, formulários
- Mesmos padrões de componentes:
  - botão primário sempre igual
  - erros sempre no mesmo formato

### 1.3 Eficiência
- Menos cliques, menos digitação, mais atalhos:
  - busca e filtros rápidos
  - paginação clara
  - ações comuns acessíveis

### 1.4 Acessibilidade (A11y)
- Acessibilidade não é opcional:
  - navegação via teclado
  - foco visível
  - labels corretos
  - contraste adequado
  - não depender apenas de cor (cor + texto/ícone)

---

## 2) Design system leve (recomendado)
### 2.1 Tokens de UI (padronização)
Definir tokens/variáveis (CSS) e **usar sempre**:
- **Spacing:** 4/8/12/16/24/32/48
- **Radius:** 8/12/16
- **Shadow:** 1–2 níveis (discreto)
- **Typography:** base 14–16; títulos 18–28; line-height confortável
- **Colors:** usar classes semânticas (não hardcode em cada tela)

### 2.2 Componentes reutilizáveis obrigatórios (shared/ui)
Criar e reutilizar (nomes em inglês):
- `AppHeader` (logo, busca, conta, carrinho)
- `PageHeader` (title, description, actions, breadcrumb opcional)
- `Card`
- `Button` (variants: primary/secondary/ghost/danger)
- `Badge` (semantic: success/warning/danger/info/neutral)
- `DataGrid` (tabela/lista com paginação/filtros)
- `EmptyState` (ícone, título, texto, CTA)
- `ErrorState` (mensagem pt-BR + “Tentar novamente”)
- `Skeleton` / `LoadingOverlay`
- `FormField` (label, hint, error)
- `ConfirmDialog` (ações destrutivas)

> Regra: telas novas devem usar esses componentes antes de criar CSS ad-hoc.

---

## 3) Padrões de tela (templates)
### 3.1 Tela de listagem (catálogo / admin)
Sempre estruturar:
- **Topo (PageHeader)**:
  - Título (H1)
  - Descrição curta (opcional)
  - Ação principal (ex.: “Novo produto” no admin)
- **Barra de ferramentas** (abaixo do header):
  - busca
  - filtros
  - ordenação
  - contador de resultados
- **Conteúdo**:
  - grid/lista/tabela com paginação
  - estados: loading/empty/error

### 3.2 Tela de formulário (cadastro/edição)
- **Seções** claras:
  - Dados principais
  - Preços
  - Estoque
  - Imagem (opcional)
- **Ações fixas**:
  - Primária: “Salvar” / “Finalizar compra”
  - Secundária: “Cancelar” / “Voltar”
- **Validação**:
  - feedback instantâneo (sem ser agressivo)
  - erros no campo + resumo (quando vários erros)
- **Sem perda de dados**: nunca limpar o form em erro de submit

### 3.3 Tela de detalhe (produto/pedido)
- Layout em **cards**:
  - informações principais destacadas
  - ações contextuais (ex.: “Cancelar pedido” quando permitido)
- Resumo do pedido com status bem visível.

---

## 4) Estados obrigatórios (sempre implementar)
### 4.1 Loading
- Listagens: skeleton nos cards/linhas
- Formulários: botão “Salvando…” e desabilitado
- Evitar spinners grandes no meio da tela sem contexto

### 4.2 Empty state
- Mensagem amigável + sugestão de ação:
  - “Nenhum produto encontrado. Tente ajustar os filtros.”
  - CTA: “Limpar filtros”

### 4.3 Error state
- Texto pt-BR, curto e útil:
  - “Não foi possível carregar os dados. Tente novamente.”
- Botão: “Tentar novamente”
- Se erro for de autenticação:
  - “Sua sessão expirou. Faça login novamente.”

---

## 5) Badges em grids (cores e semântica)
### 5.1 Quando usar
- Status de pedido
- Nível de estoque
- Situação (ativo/inativo) quando existir
- Categoria, se realmente ajudar (evitar poluição)

### 5.2 Regras de design
- Badge deve ser **discreto e legível**
- Não depender só de cor: sempre **texto** + (opcional) **ícone**
- Tamanho:
  - grids: `sm`
  - detalhe: `md`
- Cores devem vir de **classes semânticas**:
  - `badge--success`, `badge--warning`, `badge--danger`, `badge--info`, `badge--neutral`

### 5.3 Mapeamentos recomendados (pt-BR)
**Pedidos**
- `CREATED` → Neutral (“Criado”)
- `PAID` → Info (“Pago”)
- `PICKING` → Warning (“Em separação”)
- `SHIPPED` → Info (“Enviado”)
- `DELIVERED` → Success (“Entregue”)
- `CANCELED` → Danger (“Cancelado”)

**Estoque**
- `>= 10` → Success (“Em estoque”)
- `1–9` → Warning (“Estoque baixo”)
- `0` → Danger (“Sem estoque”)

---

## 6) Mensagens de erro e sucesso (pt-BR) — user-friendly
### 6.1 Princípios
- Sem culpar o usuário
- Dizer o que aconteceu e como resolver
- Evitar termos técnicos (“stack”, “payload”, “invalid request”)

### 6.2 Exemplos prontos
**Genéricas**
- Sucesso: “Operação realizada com sucesso.”
- Erro: “Não foi possível concluir a operação. Tente novamente.”
- Rede: “Falha de conexão. Verifique sua internet e tente novamente.”
- Sessão: “Sua sessão expirou. Faça login novamente.”

**Formulários**
- Obrigatório: “Campo obrigatório.”
- E-mail: “Informe um e-mail válido.”
- CPF: “O CPF informado é inválido.”
- Senha: “A senha deve ter no mínimo 8 caracteres.”
- Quantidade: “Informe uma quantidade válida.”

**Carrinho/checkout**
- Estoque: “Quantidade indisponível em estoque.”
- Checkout: “Não foi possível finalizar a compra. Verifique os itens e tente novamente.”
- Cancelamento: “Prazo de cancelamento expirado.” / “Pedido cancelado com sucesso.”

> Recomendação: centralizar mensagens em `shared/i18n/pt-BR.ts` ou `assets/i18n/pt-BR.json`.

---

## 7) Formulários: boas práticas de experiência
### 7.1 Ergonomia
- Labels claros
- Placeholder só como exemplo (não substituir label)
- Agrupar campos relacionados
- Máscaras quando útil (CPF, CEP, telefone)

### 7.2 Validação
- Evitar erro “gritado” antes do usuário interagir
- Usar:
  - `touched/dirty` (ou equivalente em Signal Forms)
  - exibir erros após interação ou submit

### 7.3 Ajuda contextual
- `hint` em campos importantes:
  - “Usaremos seu CPF apenas para identificação no cadastro.” (se aplicável)
- Mostrar exemplos:
  - “Ex.: 00000-000” para CEP

---

## 8) Tabelas/grids: usabilidade “admin-grade”
### 8.1 Obrigatórios em telas admin (produtos/pedidos)
- Busca rápida
- Filtros relevantes
- Paginação com page size
- Ordenação por colunas principais
- Ações por linha (editar, ver detalhes) com ícones e tooltips

### 8.2 Padrões
- Colunas essenciais primeiro
- Coluna de ações no fim
- “Nada encontrado” com CTA
- “Carregando…” via skeleton (evitar layout pulando)

---

## 9) Microinterações e detalhes que passam confiança
- Hover e foco suaves em botões/cards
- Skeleton em vez de tela branca
- Confirmação em ações destrutivas:
  - “Tem certeza que deseja cancelar este pedido?”
- Indicação de progresso em checkout (passos)
- Totais e preços sempre bem formatados (`R$ 1.234,56`)

---

## 10) Checklist obrigatório por tela
- [ ] Layout consistente (PageHeader + conteúdo)
- [ ] Estados: loading + empty + error
- [ ] Mensagens pt-BR user-friendly
- [ ] Componentes reutilizáveis (sem CSS ad-hoc)
- [ ] Acessibilidade mínima (teclado, labels, foco)
- [ ] Badges em grids quando há status
- [ ] Feedback de sucesso/erro (toast/snackbar)
- [ ] Responsivo (desktop e mobile)
- [ ] Revisar alinhamentos e espaçamento (tokens)

---

## 11) Checklist obrigatório por formulário
- [ ] Labels claros e consistentes
- [ ] Validação amigável (pt-BR)
- [ ] Erro no campo + resumo se necessário
- [ ] Botão salvar desabilita no submit
- [ ] Não perder dados em erro
- [ ] ConfirmDialog para ações destrutivas

---

## 12) Integração com a skill de Angular
Sempre que gerar código de frontend, aplicar:
- Padrões de tela (list/form/detail)
- Componentes shared/ui
- Badges semânticas em grids
- Mensagens pt-BR centralizadas
- A11y mínima

---

FIM.
