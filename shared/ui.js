/*
 * FGRUi — composicao das telas (auth gate, erro, dashboard completo).
 * Usa FGRUtils + FGRCharts. Recebe callbacks (onConnect, onRetry, onSaveConfig, onExpand)
 * em vez de chamar Trello/OAuth diretamente - assim funciona igual dentro do Power-Up
 * ou no app standalone, e quem muda e so quem passa os callbacks.
 */
var FGRUi = (function () {
  function renderAuthGate(app, message, onConnect) {
    app.innerHTML =
      '<div class="state-box">' +
      '<div style="font-size:32px;">📊</div>' +
      '<div><b>Conecte o Dashboard FGR ao seu board</b></div>' +
      '<div style="color:var(--text-mute);max-width:340px;text-align:center;">' +
      (message || 'Precisamos da sua autorização de leitura para calcular o progresso ponderado a partir dos cartões deste board.') +
      '</div>' +
      '<button class="btn" id="connectBtn">Conectar ao Trello</button>' +
      '</div>';
    document.getElementById('connectBtn').onclick = function () {
      var btn = document.getElementById('connectBtn');
      btn.disabled = true;
      btn.textContent = 'Abrindo autorização…';
      onConnect();
    };
  }

  function renderError(app, err, onRetry) {
    app.innerHTML =
      '<div class="state-box">' +
      '<div style="font-size:28px;">⚠️</div>' +
      '<div><b>Não foi possível carregar o dashboard</b></div>' +
      '<div style="color:var(--text-mute);max-width:360px;text-align:center;">' + FGRUtils.esc(err.message || String(err)) + '</div>' +
      '<button class="btn ghost" id="retryBtn">Tentar novamente</button>' +
      '</div>';
    document.getElementById('retryBtn').onclick = function () { onRetry(); };
  }

  // opts: { boardName, onSaveConfig(cfgOut), onExpand()|null }
  function renderDashboard(app, model, history, opts) {
    opts = opts || {};
    var pct = model.pct, cfg = model.cfg, health = model.health, restantes = model.restantes;
    var U = FGRUtils, C = FGRCharts;

    var expandBtnHtml = opts.onExpand
      ? '<button class="btn ghost" id="expandBtn" title="Abrir versão em tela cheia">⛶ Expandir Dashboard</button>'
      : '';

    app.innerHTML =
      '<div class="topbar">' +
      '<div class="titlewrap"><h1>Dashboard FGR</h1><div class="sub">Progresso ponderado calculado a partir de ' + model.items.length + ' entregas deste board</div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      expandBtnHtml +
      '<div class="health-pill health-' + health.level + '"><span class="dot"></span>' + health.label + (health.gap != null ? ' · gap ' + U.fmtNum(health.gap) + ' p.p.' : '') + '</div>' +
      '</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:14px;">' +
      '<h2>Resumo executivo</h2>' +
      '<div class="grid cols-6">' +
      '<div class="kpi"><div class="v" style="font-size:15px;">' + U.esc(opts.boardName || '—') + '</div><div class="l">Empreendimento</div></div>' +
      '<div class="kpi"><div class="v" style="font-size:15px;">' + U.esc((cfg && cfg.cliente) || '—') + '</div><div class="l">Cliente</div></div>' +
      '<div class="kpi"><div class="v" style="font-size:15px;">' + U.esc((cfg && cfg.responsavel) || '—') + '</div><div class="l">Responsável</div></div>' +
      '<div class="kpi"><div class="v num">' + (cfg && cfg.prazoMeses ? cfg.prazoMeses + 'm' : '—') + '</div><div class="l">Prazo</div></div>' +
      '<div class="kpi"><div class="v num">' + (restantes != null ? restantes : '—') + '</div><div class="l">Dias restantes</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--good)">' + U.fmtPct(pct) + '</div><div class="l">Executado</div></div>' +
      '</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:14px;">' +
      '<h2>Progresso ponderado (Peso do Projeto)</h2>' +
      C.heroProgressBar(pct) +
      '<div class="grid cols-3" style="margin-top:16px;">' +
      '<div class="kpi"><div class="v num">100%</div><div class="l">Peso total</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--good)">' + U.fmtPct(pct) + '</div><div class="l">Executado</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--text-soft)">' + U.fmtPct(100 - pct) + '</div><div class="l">Restante</div></div>' +
      '</div>' +
      '</div>' +

      '<div class="grid cols-6" style="margin-bottom:14px;">' + C.statusDistribution(model) + '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      '<div class="card"><h2>Progresso por disciplina</h2>' + C.barRows(model.discRows.map(function (r) { return { name: r.name, pct: r.pct }; })) + '</div>' +
      '<div class="card"><h2>Gargalos <span class="hint">bloqueados + aguardando aprovação externa</span></h2>' +
      (model.bottlenecks.length ? model.bottlenecks.map(function (b) {
        return '<div class="bottleneck"><div><div class="name">' + U.esc(b.name) + '</div><div class="desc">Bloqueando ' + b.count + ' entrega' + (b.count > 1 ? 's' : '') + ' · ' + U.fmtNum(b.peso) + ' pts de peso</div></div><div class="count num">' + b.count + '</div></div>';
      }).join('') : '<div class="empty">Nenhum gargalo no momento</div>') +
      '</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:14px;">' +
      '<h2>Cronograma <span class="hint">largura = peso da disciplina · preenchido = % concluído</span></h2>' +
      '<div style="display:flex;align-items:flex-end;">' + C.timeline(model) + '</div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      '<div class="card"><h2>Aprovações <span class="hint">entregas em análise externa agora</span></h2>' +
      (model.waitingExternal.length ? '<table><thead><tr><th>Entrega</th><th>Disciplina</th><th class="num">Peso</th></tr></thead><tbody>' +
        model.waitingExternal.map(function (i) {
          return '<tr><td>' + U.esc(i.name) + '</td><td>' + U.esc(i.disciplina) + '</td><td class="num">' + U.fmtNum(i.peso) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty">Nenhuma entrega aguardando aprovação externa</div>') +
      '</div>' +
      '<div class="card"><h2>Atividades críticas</h2>' +
      '<div class="grid cols-3">' +
      '<div class="kpi"><div class="v num" style="color:var(--critical)">' + model.critical.highPriority + '</div><div class="l">Prioridade alta</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--critical)">' + model.critical.overdue + '</div><div class="l">Vencidas</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--critical)">' + model.critical.blocked + '</div><div class="l">Bloqueadas</div></div>' +
      '</div>' +
      (model.critical.highPriority === 0 && model.critical.overdue === 0 ? '<div class="empty">Prioridade e datas ainda não preenchidas nos cartões — defina "prioridade" e due date para ativar este painel.</div>' : '') +
      '</div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      '<div class="card"><h2>Próximas entregas <span class="hint">por due date</span></h2>' +
      (model.upcoming.length ? '<table><thead><tr><th>Entrega</th><th>Data</th><th>Responsável</th></tr></thead><tbody>' +
        model.upcoming.map(function (i) {
          return '<tr><td>' + U.esc(i.name) + '</td><td class="num">' + new Date(i.due).toLocaleDateString('pt-BR') + '</td><td>' + (i.members.length ? U.esc(i.members.join(', ')) : '—') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty">Nenhum cartão com due date definido ainda</div>') +
      '</div>' +
      '<div class="card"><h2>Responsáveis</h2>' +
      (model.memberRows.length ? C.barRows(model.memberRows, { max: model.maxMember }) : '<div class="empty">Nenhum membro atribuído aos cartões ainda</div>') +
      '</div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      '<div class="card"><h2>Evolução <span class="hint">snapshot a cada abertura do dashboard</span></h2>' + C.historyRows(history) + '</div>' +
      '<div class="card"><h2>Configuração do empreendimento <span class="hint">para calcular a saúde do projeto</span></h2>' +
      '<div class="settings-form">' +
      '<label>Cliente<input type="text" id="cfgCliente" value="' + U.esc((cfg && cfg.cliente) || '') + '" style="width:150px"></label>' +
      '<label>Responsável<input type="text" id="cfgResponsavel" value="' + U.esc((cfg && cfg.responsavel) || '') + '" style="width:150px"></label>' +
      '<label>Prazo (meses)<input type="number" id="cfgPrazo" value="' + (cfg && cfg.prazoMeses || '') + '" style="width:90px"></label>' +
      '<label>Data de início<input type="date" id="cfgInicio" value="' + (cfg && cfg.dataInicio || '') + '"></label>' +
      '<button class="btn" id="cfgSave">Salvar</button>' +
      '</div>' +
      (health.elapsedPct != null ? '<div style="margin-top:12px;color:var(--text-soft)">Prazo decorrido: <b class="num">' + U.fmtPct(health.elapsedPct) + '</b> vs. progresso real <b class="num">' + U.fmtPct(pct) + '</b></div>' : '') +
      '</div>' +
      '</div>' +

      '<footer><span>Dados lidos ao vivo do board via Trello REST API.</span><span>Atualizado agora</span></footer>';

    document.getElementById('cfgSave').onclick = function () {
      opts.onSaveConfig({
        cliente: document.getElementById('cfgCliente').value,
        responsavel: document.getElementById('cfgResponsavel').value,
        prazoMeses: document.getElementById('cfgPrazo').value,
        dataInicio: document.getElementById('cfgInicio').value
      });
    };

    if (opts.onExpand) {
      document.getElementById('expandBtn').onclick = opts.onExpand;
    }
  }

  return { renderAuthGate: renderAuthGate, renderError: renderError, renderDashboard: renderDashboard };
})();
