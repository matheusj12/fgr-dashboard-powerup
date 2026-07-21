/*
 * Bootstrap do Dashboard dentro do Trello (Power-Up iframe).
 * Nenhuma regra de negocio aqui - so: falar com TrelloPowerUp.iframe(),
 * buscar os dados via FGRApi, calcular via FGRCalc e desenhar via FGRUi/FGRChartManager.
 */
var KEY = 'faf7976de1f3f5c94a3cdd396db99702';
var t = TrelloPowerUp.iframe({ appKey: KEY, appName: 'FGR Dashboard - Susane' });
var app = document.getElementById('app');

var POLL_INTERVAL_MS = 30000;
var shellRendered = false;
var pollTimer = null;
var agentInitialized = false;
var previousItems = null;
var latestSnapshot = { model: null, boardName: '', history: [], burndown: { dates: [], real: [], planned: null } };

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

function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function startPolling() {
  stopPolling();
  pollTimer = setInterval(function () { refresh(true); }, POLL_INTERVAL_MS);
}

// full=true na primeira carga (monta o shell); refresh depois so atualiza os graficos.
function refresh(isPoll) {
  var token, boardId, boardName;
  return t.getRestApi().getToken()
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

      return FGRCalc.saveHistorySnapshot(model.pct, storageGet, storageSet).then(function (hist) {
        if (!shellRendered) {
          FGRUi.renderShell(app, {
            cfg: cfg,
            onSaveConfig: function (cfgOut) { stopPolling(); storageSet('fgrConfig', cfgOut).then(boot); },
            onExpand: openExpanded
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
  shellRendered = false;
  stopPolling();
  app.innerHTML = '<div class="state-box"><div class="spinner"></div><div>Carregando dados do board…</div></div>';

  t.getRestApi().isAuthorized().then(function (isAuth) {
    if (!isAuth) { FGRUi.renderAuthGate(app, null, connect); return; }
    refresh(false).catch(function (err) { FGRUi.renderError(app, err, boot); });
  });
}

t.render(function () { boot(); });
