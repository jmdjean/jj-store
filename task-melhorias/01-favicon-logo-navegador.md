# Tarefa 01 – Favicon: logo JJ Store na aba do navegador

## Objetivo

Garantir que a aba do navegador exiba o **logo da JJ Store** como favicon, e não o ícone padrão do Angular (letra "A").

## Contexto

- O `frontend/src/index.html` referencia `favicon.ico`.
- O projeto já possui `JJ-store-logo.png` em `frontend/public/` (e na raiz do frontend).
- Atualmente o usuário pode estar vendo o favicon padrão do Angular na aba.

## Escopo

1. **Substituir o favicon**
   - Usar o logo JJ Store como favicon em todas as páginas da aplicação.
   - Opções:
     - **A)** Gerar um `favicon.ico` a partir do `JJ-store-logo.png` (16x16 e 32x32) e colocá-lo em `frontend/public/favicon.ico`, mantendo em `index.html`:  
       `<link rel="icon" type="image/x-icon" href="favicon.ico">`
     - **B)** Usar diretamente o PNG no `index.html`, por exemplo:  
       `<link rel="icon" type="image/png" href="JJ-store-logo.png">`  
       (e, se desejado, adicionar um `sizes` e variantes para diferentes resoluções.)

2. **Manter consistência**
   - Se houver outros lugares que referenciem favicon (por exemplo, PWA ou meta tags), atualizar para o mesmo asset.

## Critérios de aceite

- [ ] Ao abrir qualquer rota da aplicação (loja, admin, login etc.), a aba do navegador exibe o logo JJ Store (ou um ícone derivado dele), e não o "A" do Angular.
- [ ] O arquivo de favicon está em `frontend/public/` (ou o PNG é referenciado corretamente no `index.html`).
- [ ] Build de produção continua servindo o favicon corretamente.

## Skills recomendadas

- Frontend: `angular21-enterprise.skill.md` (e, se for criar/editar assets, `05-skill-ux-ui-professional.md` para consistência visual).

## Notas

- Não é obrigatório usar ferramentas externas para gerar `.ico`; usar PNG é aceitável e mais simples se o logo for legível em tamanhos pequenos.
