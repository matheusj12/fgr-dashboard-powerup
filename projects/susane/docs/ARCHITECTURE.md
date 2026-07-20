# Arquitetura — FGR Project Intelligence (Power-Up)

## Estrutura

```
fgr-dashboard-powerup/projects/susane/
├── shared/            # Toda a regra de negocio e renderizacao. Zero dependencia de Trello/OAuth.
│   ├── utils.js       # esc, fmtPct, fmtNum, parseYamlBlock
│   ├── api.js         # unica funcao que fala com api.trello.com (recebe key+token prontos)
│   ├── calculations.js# pesos, indicadores, KPIs, progresso, saude do projeto, gargalos
│   ├── charts.js       # blocos visuais reutilizaveis (barras, distribuicao, cronograma)
│   └── ui.js           # composicao das telas (auth gate, erro, dashboard completo)
├── powerup/            # Roda SOMENTE dentro do iframe do Trello
│   ├── connector.html   # TrelloPowerUp.initialize() — board-buttons, card-badges
│   ├── dashboard.html   # markup + <script> tags
│   └── dashboard.js     # bootstrap: TrelloPowerUp.iframe(), t.getRestApi(), t.board(), t.get/set
├── standalone/          # App completo, tela cheia, fora do Trello
│   ├── dashboard-full.html
│   ├── dashboard-full.js # bootstrap: le ?board= da URL, usa FGRAuth + FGRApi
│   └── auth.js           # FGRAuth — fluxo OAuth de token do Trello (redirect + localStorage)
├── assets/css/dashboard.css  # visual identico nos dois apps
└── docs/
```

## Regra de ouro

`shared/` nunca importa nada de `powerup/` ou `standalone/`, e nunca referencia
`TrelloPowerUp`, `t.*` ou `location.hash`/OAuth. Ele só recebe dados já prontos
(cards, cfg, token) e devolve HTML ou números. Isso é o que permite os dois apps
compartilharem praticamente 100% do código.

`powerup/dashboard.js` e `standalone/dashboard-full.js` são os únicos arquivos que
sabem *como* obter o token — um via bridge do Power-Up, o outro via OAuth redirect —
e depois os dois chamam exatamente as mesmas funções (`FGRApi.fetchBoardData`,
`FGRCalc.computeModel`, `FGRUi.renderDashboard`).

## Fluxo do botão "Expandir Dashboard"

1. Dentro do modal (`powerup/dashboard.js`), o botão chama `t.board()` + `t.member()`
   (dados já disponíveis via bridge do Power-Up, sem custo extra).
2. Monta a URL `standalone/dashboard-full.html?board=<id>&boardName=...&memberId=...&memberName=...`
   e abre em nova aba com `window.open(url, '_blank')`.
3. `standalone/dashboard-full.js` lê o `board` da URL, garante um token via `FGRAuth`
   (localStorage; se não existir, redireciona para a tela de autorização do próprio
   Trello e volta com o token no fragmento da URL) e segue exatamente o mesmo caminho
   de cálculo/renderização do Power-Up.

## Onde crescer no futuro

Cada nova capacidade (Gantt, Burndown/Burnup real, exportação PDF/Excel, comparação
entre empreendimentos, camada de IA) deve virar um novo módulo dentro de `shared/`
(ex.: `shared/gantt.js`, `shared/export.js`) consumido pelos dois bootstraps —
nunca duplicado entre `powerup/` e `standalone/`. Só crie esses módulos quando a
funcionalidade for implementada de fato, não como esqueleto vazio.
