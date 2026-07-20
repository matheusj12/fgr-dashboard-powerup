/*
 * Bootstrap do Dashboard Full (tela cheia, fora do Trello).
 * Mesma regra de negocio e mesmos graficos do Power-Up (FGRCalc/FGRUi/FGRChartManager) -
 * so muda como os dados chegam: aqui via OAuth (FGRAuth) + REST direta (FGRApi).
 */
var KEY = 'ebdf1a3d948d7b795b6ffa7ae1dd4292';
var APP_NAME = 'FGR Dashboard';
var app = document.getElementById('app');

var params = new URLSearchParams(location.search);
var boardId = params.get('board');
var boardNameFromUrl = params.get('boardName') || '';

var POLL_INTERVAL_MS = 30000;
var shellRendered = false;
var pollTimer = null;
var agentInitialized = false;
var previousItems = null;
var latestSnapshot = { model: null, boardName: '', history: [], burndown: { dates: [], real: [], planned: null } };

function storageGet(key) {
  var raw = localStorage.getItem('fgr:' + key + ':' + boardId);
  return Promise.resolve(raw ? JSON.parse(raw) : null);
}
function storageSet(key, value) {
  localStorage.setItem('fgr:' + key + ':' + boardId, JSON.stringify(value));
  return Promise.resolve();
}

function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function startPolling() {
  stopPolling();
  pollTimer = setInterval(function () { refresh(true).catch(handleFatalError); }, POLL_INTERVAL_MS);
}

function handleFatalError(err) {
  stopPolling();
  if (err && /401|invalid token/i.test(err.message || '')) FGRAuth.clearToken();
  FGRUi.renderError(app, err, boot);
}

function refresh(isPoll) {
  var token;
  return FGRAuth.ensureToken(KEY, APP_NAME)
    .then(function (tok) {
      token = tok;
      return Promise.all([
        FGRApi.fetchBoardData(boardId, token, KEY),
        FGRApi.get('/boards/' + boardId + '?fields=name', token, KEY),
        storageGet('fgrConfig'),
        storageGet('fgrProgressHistory')
      ]);
    })
    .then(function (results) {
      var data = results[0], boardInfo = results[1];
      var cfg = results[2] || null;
      var boardName = boardInfo.name || boardNameFromUrl;

      var listName = {}; data.lists.forEach(function (l) { listName[l.id] = l.name; });
      var labelName = {}; data.labels.forEach(function (l) { labelName[l.id] = l.name; });
      var memberName = {}; data.members.forEach(function (m) { memberName[m.id] = m.fullName || m.username; });

      var items = FGRCalc.buildItems(data.cards, listName, labelName, memberName);
      var model = FGRCalc.computeModel(items, cfg);

      return FGRCalc.saveHistorySnapshot(model.pct, storageGet, storageSet).then(function (hist) {
        if (!shellRendered) {
          FGRUi.renderShell(app, {
            cfg: cfg,
            onSaveConfig: function (cfgOut) { stopPolling(); storageSet('fgrConfig', cfgOut).then(boot); },
            onExpand: null
          });
          shellRendered = true;
        }
        var burndown = FGRCalc.computeBurndown(hist, cfg);
        FGRUi.updateCharts(model, hist, burndown, boardName);
        latestSnapshot = { model: model, boardName: boardName, history: hist, burndown: burndown };

        if (!agentInitialized) {
          agentInitialized = true;
          FGRAgentPanel.init(function () { return latestSnapshot; });
        } else if (previousItems) {
          var diffs = FGREventWatcher.diff(previousItems, items);
          if (diffs.length) FGRAgentPanel.notifyChanges(diffs);
        }
        previousItems = items;

        if (!isPoll) startPolling();
      });
    });
}

function boot() {
  if (!boardId) {
    FGRUi.renderError(app, new Error('URL sem o parâmetro "board". Abra esta página a partir do botão "Expandir Dashboard" dentro do Trello.'), boot);
    return;
  }
  shellRendered = false;
  stopPolling();
  app.innerHTML = '<div class="state-box"><div class="spinner"></div><div>Carregando dados do board…</div></div>';
  refresh(false).catch(handleFatalError);
}

boot();
