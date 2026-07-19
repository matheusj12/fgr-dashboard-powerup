/*
 * Bootstrap do Dashboard Full (tela cheia, fora do Trello).
 * Mesma regra de negocio do Power-Up (FGRCalc/FGRUi) - so muda como os dados chegam:
 * aqui e via OAuth (FGRAuth) + REST direta (FGRApi), usando o board id da query string.
 */
var KEY = 'ebdf1a3d948d7b795b6ffa7ae1dd4292';
var APP_NAME = 'FGR Dashboard';
var app = document.getElementById('app');

var params = new URLSearchParams(location.search);
var boardId = params.get('board');
var boardNameFromUrl = params.get('boardName') || '';

function storageGet(key) {
  var raw = localStorage.getItem('fgr:' + key + ':' + boardId);
  return Promise.resolve(raw ? JSON.parse(raw) : null);
}
function storageSet(key, value) {
  localStorage.setItem('fgr:' + key + ':' + boardId, JSON.stringify(value));
  return Promise.resolve();
}

function boot() {
  if (!boardId) {
    FGRUi.renderError(app, new Error('URL sem o parâmetro "board". Abra esta página a partir do botão "Expandir Dashboard" dentro do Trello.'), boot);
    return;
  }

  app.innerHTML = '<div class="state-box"><div class="spinner"></div><div>Carregando dados do board…</div></div>';

  FGRAuth.ensureToken(KEY, APP_NAME).then(function (token) {
    return Promise.all([
      FGRApi.fetchBoardData(boardId, token, KEY),
      FGRApi.get('/boards/' + boardId + '?fields=name', token, KEY),
      storageGet('fgrConfig'),
      storageGet('fgrProgressHistory')
    ]);
  }).then(function (results) {
    var data = results[0], boardInfo = results[1];
    var cfg = results[2] || null;
    var boardName = boardInfo.name || boardNameFromUrl;

    var listName = {}; data.lists.forEach(function (l) { listName[l.id] = l.name; });
    var labelName = {}; data.labels.forEach(function (l) { labelName[l.id] = l.name; });
    var memberName = {}; data.members.forEach(function (m) { memberName[m.id] = m.fullName || m.username; });

    var items = FGRCalc.buildItems(data.cards, listName, labelName, memberName);
    var model = FGRCalc.computeModel(items, cfg);

    FGRCalc.saveHistorySnapshot(model.pct, storageGet, storageSet).then(function (hist) {
      FGRUi.renderDashboard(app, model, hist, {
        boardName: boardName,
        onSaveConfig: function (cfgOut) { storageSet('fgrConfig', cfgOut).then(boot); },
        onExpand: null
      });
    });
  }).catch(function (err) {
    if (err && /401|invalid token/i.test(err.message || '')) {
      FGRAuth.clearToken();
    }
    FGRUi.renderError(app, err, boot);
  });
}

boot();
