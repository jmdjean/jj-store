# Tarefa 03 – Formulário de produto: UX/UI com base no “Novo contrato”

## Objetivo

Deixar o formulário de cadastro/edição de produto **menos “cru” e mais profissional**, usando como referência visual e de estrutura o formulário **“Novo contrato”** (imagem de referência fornecida).

## Referência: formulário “Novo contrato”

- Layout em **card** com cantos arredondados e sombra leve.
- **Título** da página + **subtítulo** explicativo.
- **Campos em grid de duas colunas** quando fizer sentido (ex.: paciente/sede, plano/valor, datas).
- **Labels** acima dos campos; **placeholders** claros (ex.: “Selecione um paciente”).
- **Campos obrigatórios** marcados com asterisco (*).
- **Campo de valor (R$)** com hint abaixo (ex.: “Deixe em branco para usar o valor padrão…”); formatação e orientação claras.
- **Área de texto** para observações/descrição com placeholder e opção de redimensionar.
- **Botões de ação** no canto inferior direito: Cancelar (secundário/outline) e Salvar (primário, com ícone se aplicável).
- Uso de **espaço em branco**, tipografia e hierarquia visual consistentes.

## Escopo da tarefa

1. **Estrutura e layout**
   - Envolver o formulário em um **card** (container com borda, bordas arredondadas e sombra sutil).
   - Manter título “Novo produto” / “Editar produto” e subtítulo atual, alinhados à referência (título em destaque, subtítulo mais discreto).
   - Agrupar campos em **blocos lógicos** e usar **grid de duas colunas** onde for adequado (ex.: Quantidade em estoque + Peso; Preço de custo + Preço de venda; Nome + Categoria se fizer sentido).

2. **Campos e labels**
   - Labels **acima** dos inputs (já é o caso; reforçar estilo).
   - Marcar campos **obrigatórios** com asterisco (*) e texto de hint onde ajudar (ex.: para preços, que aceitam R$ e decimais).
   - Placeholders claros e em pt-BR (ex.: “Selecione uma categoria”, “Descreva o produto”, “https://...” para URL da imagem).
   - Descrição: textarea com placeholder e resize vertical, estilo alinhado à área “Observações” do referencial.

3. **Preços**
   - Manter máscara de moeda (após correção da tarefa 02).
   - Adicionar **texto de ajuda** curto abaixo dos campos de preço (ex.: “Valor em reais (R$)”) para evitar dúvidas.

4. **Categoria**
   - Manter busca + select; deixar visualmente alinhado ao restante (mesmo padrão de input/select do card).
   - Placeholder do select: “Selecione uma categoria”.

5. **Ações**
   - **Cancelar:** link ou botão secundário (outline), levando de volta à listagem de produtos.
   - **Salvar produto:** botão primário (cor de destaque), com estado “Salvando...” quando `saving()`.
   - Posicionar os dois no **canto inferior direito** do card, com espaçamento consistente.

6. **Estilo geral**
   - Paleta e tipografia alinhadas ao restante do admin (e ao referencial): fundo claro, bordas discretas, boa legibilidade.
   - Espaçamento entre seções e entre label/campo/hint uniforme.
   - Estados de erro de validação visíveis (ex.: borda ou texto em vermelho + mensagem abaixo do campo).

## Critérios de aceite

- [ ] Formulário exibido dentro de um card com aparência “polida” (bordas, sombra, hierarquia).
- [ ] Campos obrigatórios marcados com *; hints onde necessário (ex.: preços).
- [ ] Layout em duas colunas para grupos lógicos (estoque/peso, preços).
- [ ] Botões Cancelar e Salvar produto no canto inferior direito, com estilos primário/secundário distintos.
- [ ] Textos em pt-BR com acentuação correta; sem “cru” ou sem estilo.

## Skills recomendadas

- Frontend: `angular21-enterprise.skill.md`, `05-skill-ux-ui-professional.md`.

## Dependência

- Recomendado concluir a **tarefa 02** (correção dos campos de preço) antes ou em paralelo, para que o formulário final já tenha preços funcionando corretamente.
