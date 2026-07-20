# FGR Dashboard — Power-Up do Trello (conta: Susane)

> Projeto independente, copiado de `projects/matheus/`. Antes de publicar, troque o
> placeholder `COLOQUE_A_TRELLO_API_KEY_DA_SUSANE_AQUI` (em `powerup/dashboard.js`,
> `powerup/connector.html` e `standalone/dashboard-full.js`) pela Trello API Key
> gerada na conta da Susane em https://trello.com/power-ups/admin — o Power-Up
> precisa ser criado e administrado pela própria conta dela.

Base do "FGR Project Intelligence": lê os cartões do board via Trello REST API e
calcula o progresso ponderado do empreendimento em tempo real. Dois pontos de entrada,
mesma regra de negócio (veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)):

- **Dentro do Trello** (`powerup/`): botão no board abre um modal-resumo.
- **Tela cheia** (`standalone/`): botão "Expandir Dashboard" abre a versão completa
  numa aba nova, fora do iframe do Trello (OAuth próprio, sem o bridge do Power-Up).

## Estrutura

```
shared/       utils.js, api.js, calculations.js, charts.js, ui.js  (regra de negócio + UI, sem Trello/OAuth)
powerup/      connector.html, dashboard.html, dashboard.js          (roda só dentro do Trello)
standalone/   dashboard-full.html, dashboard-full.js, auth.js       (tela cheia, OAuth próprio)
assets/css/   dashboard.css                                        (visual compartilhado)
docs/         ARCHITECTURE.md
```

## Como os dados são obtidos (sem backend, sem banco de dados)

- **Cartões, listas, etiquetas, membros e datas**: lidos ao vivo via Trello REST API,
  autenticado com o token do próprio membro que abre o dashboard — nunca um token
  fixo embutido no código. Dentro do Trello via `t.getRestApi().authorize()`; na tela
  cheia via redirect OAuth clássico do Trello (`standalone/auth.js`), token guardado
  no `localStorage` do navegador.
- **Peso, disciplina, prioridade** de cada entrega: lidos do bloco YAML já presente na
  descrição de cada cartão (mesmo formato criado na Fase 1/2 do projeto).
- **Configuração do empreendimento** e **histórico semanal de evolução**: dentro do
  Trello ficam no armazenamento nativo do Power-Up (`t.set('board','shared',...)`);
  na tela cheia ficam no `localStorage`, escopado por board — não é um banco de dados
  externo em nenhum dos dois casos.

## Como publicar

1. Hospede a pasta inteira (mantendo a estrutura de subpastas) em qualquer servidor
   HTTPS público (GitHub Pages, Netlify, Vercel, servidor próprio).
2. No [Power-Up Admin do Trello](https://trello.com/power-ups/admin), abra o Power-Up
   já criado ("FGR Project Intelligence").
3. Em **Informações básicas**, defina **"URL de conector Iframe"** para a URL pública
   de `powerup/connector.html` (ex.: `https://SEU_DOMINIO/powerup/connector.html`).
4. Em **Recursos**, confirme que `board-buttons` e `card-badges` estão habilitados.
5. Habilite o Power-Up no board (menu do board → Power-Ups → ativar).
6. Clique no botão **"Dashboard FGR"** no topo do board.

Se já existia uma versão publicada com os arquivos na raiz do repositório, é preciso
atualizar essa URL no Power-Up Admin para o novo caminho `powerup/connector.html` —
o board guarda a URL antiga em cache, então depois de trocar vale colocar um `?v=N`
no final para forçar um fetch novo (ex.: `...connector.html?v=5`).

Na primeira abertura, cada membro autoriza a leitura do board — consentimento
individual do Trello, não uma senha nossa.

## O que ainda depende de dado real no board

- **Próximas entregas / Atividades vencidas**: precisam de *due date* nos cartões.
- **Dashboard Responsáveis**: precisa de membros do Trello atribuídos aos cartões.
- **Prioridade** (Atividades críticas): precisa do campo `prioridade` preenchido no
  YAML da descrição do cartão (hoje em branco em todos os cartões-modelo).
- **Saúde do projeto**: precisa que alguém preencha "Prazo" e "Data de início" no
  próprio painel ("Configuração do empreendimento").

Peso e disciplina já estão preenchidos em todos os 73 cartões do board
`FGR - Modelo Padrão de Empreendimento`, com o cenário simulado da Fase 2 aplicado
(28 concluídas, 15 em andamento, 1 bloqueada, 5 em aprovação externa, 24 em backlog),
então o dashboard já abre mostrando ~25,4% de progresso ponderado real.
