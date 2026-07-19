/*
 * Bootstrap do Dashboard dentro do Trello (Power-Up iframe).
 * Nenhuma regra de negocio aqui - so: falar com TrelloPowerUp.iframe(),
 * buscar os dados via FGRApi, calcular via FGRCalc e desenhar via FGRUi.
 */
var KEY = 'ebdf1a3d948d7b795b6ffa7ae1dd4292';
var t = TrelloPowerUp.iframe({ appKey: KEY, appName: 'FGR Dashboard' });
var app = document.getElementById('app');

function storageGet(key) { return t.get('board', 'shared', key); }
function storageSet(key, value) { return t.set('board', 'shared', key, value); }

function connect() {
  t.getRestApi().authorize({ scope: 'read', expiration: '30days' })
    .then(function () { boot(); })
    .catch(function (err) {
      FGRUi.renderAuthGate(app, 'Autorização não concluída (' + (err && err.message ? err.message : 'popup fechado') + '). Tente novamente.', connect);
    });
}

function openExpanded() {
  Promise.all([t.board('id', 'name'), t.member('id', 'fullName')]).then(function (res) {
    var board = res[0], member = res[1];
    var url = new URL('../standalone/dashboard-full.html', location.href);
    url.searchParams.set('board', board.id);
    url.searchParams.set('boardName', board.name || '');
    url.searchParams.set('memberId', member.id || '');
    url.searchParams.set('memberName', member.fullName || '');
    window.open(url.toString(), '_blank');
  });
}

function boot() {
  app.innerHTML = '<div class="state-box"><div class="spinner"></div><div>Carregando dados do board…</div></div>';

  t.getRestApi().isAuthorized().then(function (isAuth) {
    if (!isAuth) { FGRUi.renderAuthGate(app, null, connect); return; }

    var token, boardId, boardName;
    t.getRestApi().getToken()
      .then(function (tok) {
        token = tok;
        return t.board('id', 'name');
      })
      .then(function (board) {
        boardId = board.id;
        boardName = board.name;
        return Promise.all([
          FGRApi.fetchBoardData(boardId, token, KEY),
          storageGet('fgrConfig'),
          storageGet('fgrProgressHistory')
        ]);
      })
      .then(function (results) {
        var data = results[0];
        var cfg = results[1] || null;

        var listName = {}; data.lists.forEach(function (l) { listName[l.id] = l.name; });
        var labelName = {}; data.labels.forEach(function (l) { labelName[l.id] = l.name; });
        var memberName = {}; data.members.forEach(function (m) { memberName[m.id] = m.fullName || m.username; });

        var items = FGRCalc.buildItems(data.cards, listName, labelName, memberName);
        var model = FGRCalc.computeModel(items, cfg);

        FGRCalc.saveHistorySnapshot(model.pct, storageGet, storageSet).then(function (hist) {
          FGRUi.renderDashboard(app, model, hist, {
            boardName: boardName,
            onSaveConfig: function (cfgOut) { storageSet('fgrConfig', cfgOut).then(boot); },
            onExpand: openExpanded
          });
        });
      })
      .catch(function (err) { FGRUi.renderError(app, err, boot); });
  });
}

t.render(function () { boot(); });
