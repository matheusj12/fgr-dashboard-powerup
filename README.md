# FGR Dashboard — Power-Up do Trello

Power-Up nativo (sem sistema externo) que lê os cartões do board via Trello REST API
e calcula o progresso ponderado do empreendimento em tempo real, dentro do próprio
Trello (Board Button → modal).

## Arquivos

- `connector.html` — conector do Power-Up. Registra as capacidades `board-buttons`
  (abre o dashboard) e `card-badges` (mostra o peso no verso do cartão, no board).
- `dashboard.html` — o dashboard em si. Único arquivo com toda a lógica (HTML + CSS + JS),
  sem dependências externas além de `https://p.trello.com/1/client.js` (SDK oficial do
  próprio Trello, obrigatório em qualquer Power-Up).

Os dois arquivos usam caminho relativo entre si (`./dashboard.html`), então funcionam
em qualquer domínio — não há URL fixa gravada no código.

## Como os dados são obtidos (sem backend, sem banco de dados)

- **Cartões, listas, etiquetas, membros e datas**: lidos ao vivo via Trello REST API
  (`GET /1/boards/{id}/cards`, `/lists`, `/labels`, `/members`), autenticado com o
  token do próprio membro que abre o dashboard (fluxo `t.getRestApi().authorize()` —
  nunca um token fixo embutido no código).
- **Peso, disciplina, prioridade** de cada entrega: lidos do bloco YAML já presente na
  descrição de cada cartão (mesmo formato criado na Fase 1/2 do projeto).
- **Configuração do empreendimento** (cliente, responsável, prazo, data de início) e
  **histórico semanal de evolução**: guardados no armazenamento nativo do Power-Up
  (`t.set('board','shared', ...)` / `t.get(...)`), escopado ao board — não é um banco
  de dados externo, é o mecanismo de dados que o próprio Trello disponibiliza para
  Power-Ups.

## Como publicar

1. Hospede os dois arquivos (`connector.html` e `dashboard.html`) juntos, na mesma
   pasta, em qualquer servidor HTTPS público (GitHub Pages, Netlify, Vercel, servidor
   próprio — tanto faz, são arquivos estáticos).
2. No [Power-Up Admin do Trello](https://trello.com/power-ups/admin), abra o Power-Up
   já criado ("FGR Project Intelligence" — mesma chave de API já usada neste projeto).
3. Em **Informações básicas**, defina a **"Nova URL do iframe connector"** para a URL
   pública de `connector.html`.
4. Em **Recursos** (Capabilities), adicione:
   - `board-buttons` → mesma URL do connector
   - `card-badges` → mesma URL do connector
5. Habilite o Power-Up no board (menu do board → Power-Ups → ativar "FGR Dashboard").
6. Clique no botão **"Dashboard FGR"** que aparece no topo do board.

Na primeira abertura, cada membro autoriza o Power-Up a ler o board (`scope: read`) —
é um consentimento individual do Trello, não uma senha nossa.

## O que ainda depende de dado real no board

- **Próximas entregas / Atividades vencidas**: precisam de *due date* nos cartões
  (nenhum cartão do board-modelo tem data ainda — é um campo por empreendimento).
- **Dashboard Responsáveis**: precisa de membros do Trello atribuídos aos cartões.
- **Prioridade** (Atividades críticas): precisa do campo `prioridade` preenchido no
  YAML da descrição do cartão (hoje em branco em todos os cartões-modelo).
- **Saúde do projeto**: precisa que alguém preencha "Prazo" e "Data de início" no
  próprio painel (seção "Configuração do empreendimento") — sem isso, mostra
  "Configure o prazo" em vez de um status.

Peso e disciplina já estão preenchidos em todos os 73 cartões do board
`FGR - Modelo Padrão de Empreendimento`, com o cenário simulado da Fase 2 aplicado
(28 concluídas, 15 em andamento, 1 bloqueada, 5 em aprovação externa, 24 em backlog),
então o dashboard já abre mostrando ~25,4% de progresso ponderado real assim que for
publicado e habilitado.
