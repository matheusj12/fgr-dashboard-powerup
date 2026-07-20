# FGR Dashboard — Power-Up do Trello (multi-conta)

Este repositório reúne várias instâncias independentes do mesmo Power-Up "FGR
Project Intelligence", uma por conta/organização do Trello. Cada conta precisa
da própria Trello API Key (gerada em https://trello.com/power-ups/admin pela
conta dona do board), então cada uma vive em sua própria pasta com cópia
completa do código — nada é compartilhado entre contas.

## Projetos

| Pasta | Conta | Status |
| --- | --- | --- |
| [`projects/matheus/`](projects/matheus/) | Matheus | Em produção |
| [`projects/susane/`](projects/susane/) | Susane | Aguardando Trello API Key própria (placeholder) |

Cada pasta tem seu próprio `README.md` (como publicar, como obter os dados) e
`docs/ARCHITECTURE.md` (organização interna de `shared/`, `powerup/`,
`standalone/`). A estrutura interna é idêntica nos dois projetos.

## Criar uma conta nova

1. `cp -r projects/matheus projects/<novo-nome>`
2. Criar um Power-Up novo em https://trello.com/power-ups/admin **na conta do
   Trello dessa pessoa** e copiar a Trello API Key gerada.
3. Substituir a key antiga por essa nova em `powerup/dashboard.js`,
   `powerup/connector.html` e `standalone/dashboard-full.js`.
4. Trocar o `appName` (em `powerup/connector.html` e `powerup/dashboard.js`)
   para identificar a conta.
5. Nos storages locais (`shared/ai/config.js` e `standalone/auth.js`), trocar
   o sufixo do `STORAGE_KEY` (ex.: `fgrToken_susane`) para um valor único
   dessa conta — evita que o token/chave de uma conta sobrescreva o de outra
   caso os projetos sejam publicados no mesmo domínio.
6. Publicar seguindo o "Como publicar" do README da pasta do projeto.
