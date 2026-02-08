# Tarefa 04 – Listagem de produtos: UX/UI com base em “Rastreabilidade”

## Objetivo

Deixar a **tela de listagem de produtos** (admin) mais **profissional e legível**, usando como referência a tela **“Rastreabilidade”** (imagem de referência fornecida).

## Referência: tela “Rastreabilidade”

- **Cabeçalho da página:** título claro à esquerda (ex.: “Rastreabilidade”); à direita, botão **“Recarregar”** com ícone de seta circular.
- **Bloco de filtros:** em um **card** separado, com filtros em formato de dropdown/botões (ex.: “Todas” / “Todos”) e rótulo “Filtros”.
- **Tabela de dados:** dentro de um **card** com sombra leve; cabeçalhos de coluna bem definidos; linhas com alternância sutil de fundo para leitura.
- **Coluna “Ações”:** ícone de olho (visualizar) e espaço para outras ações por linha.
- **Badges de status/tipo:** cores por tipo (ex.: “Atualização” em amarelo, “Criação” em verde, “Sucesso” em verde), mantendo consistência.
- **Hierarquia visual:** tipografia, espaçamento e alinhamento uniformes; uso de branco e cinzas para não poluir.

## Escopo da tarefa

1. **Cabeçalho da página**
   - Título principal à esquerda (ex.: “Produtos” ou “Lista de Produtos”).
   - Subtítulo ou descrição curta abaixo (ex.: “Gerencie cadastro, preços e estoque do catálogo.”).
   - À direita: botão **“Novo produto”** (já existe) e botão **“Recarregar”** com ícone (circular arrow) que recarrega a listagem (chamar o mesmo fluxo de carregamento de produtos).

2. **Seção de filtros**
   - Colocar filtros em um **card** dedicado com título “Filtros” (ou “Filtros de busca”).
   - Manter campos: Buscar (nome/descrição), Categoria, Status (Ativo / Inativo / Todos).
   - Estilo: inputs/selects alinhados ao referencial (bordas, padding); botões “Filtrar” e “Limpar” dentro do card.
   - Em telas maiores, dispor filtros em linha; em mobile, empilhar de forma legível.

3. **Tabela**
   - Envolver a tabela em um **card** (borda, bordas arredondadas, sombra sutil).
   - **Colunas sugeridas:** Ações | Nome (produto) | Categoria | Estoque | Preço de custo | Preço de venda | Status.
   - **Coluna Ações:** ícone “visualizar” (olho) para abrir/editar produto; manter botões “Editar” e “Remover” de forma compacta (ícones ou texto, conforme design system).
   - **Cabeçalhos:** texto legível, alinhamento consistente (numéricos à direita, texto à esquerda).
   - **Linhas:** alternância leve de fundo (ex.: zebra) para facilitar leitura; padding adequado nas células.
   - **Status:** exibir como **badge** colorido (ex.: “Ativo” em verde, “Inativo” em cinza ou vermelho suave), no mesmo espírito dos badges da tela de referência.
   - **Nome:** exibir nome em destaque; descrição pode ser truncada ou em segunda linha com estilo secundário.

4. **Estados**
   - Carregando: indicador ou mensagem dentro do card da tabela (“Carregando produtos...”).
   - Erro: mensagem de erro em destaque (card ou banner).
   - Vazio: mensagem “Nenhum produto encontrado com os filtros informados.” dentro do card.

5. **Responsividade**
   - Em telas pequenas, considerar scroll horizontal da tabela ou layout em cards por produto, mantendo usabilidade.

## Critérios de aceite

- [ ] Página com título e descrição no topo; botões “Novo produto” e “Recarregar” visíveis e funcionais.
- [ ] Filtros dentro de um card “Filtros”; layout limpo e consistente.
- [ ] Tabela dentro de card; colunas claras; coluna Ações com ícone de visualização/edição e Remover.
- [ ] Status exibido como badges coloridos (Ativo/Inativo).
- [ ] Estilos e hierarquia alinhados à referência “Rastreabilidade” (profissional, não “feio”).

## Skills recomendadas

- Frontend: `angular21-enterprise.skill.md`, `05-skill-ux-ui-professional.md`.

## Arquivos principais

- `frontend/src/app/features/admin/pages/admin-products-page.component.html`
- `frontend/src/app/features/admin/pages/admin-products-page.component.scss`
- `frontend/src/app/features/admin/pages/admin-products-page.component.ts` (lógica de recarregar e filtros)
