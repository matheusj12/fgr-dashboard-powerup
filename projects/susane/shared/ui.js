/*
 * FGRUi — composicao das telas.
 * renderShell() monta o HTML uma unica vez (cards, containers de grafico, formulario).
 * updateCharts() roda a cada refresh (inicial ou polling) e so atualiza texto + chama
 * FGRChartManager.render(...) por grafico — nunca reconstroi o DOM inteiro, entao o
 * ECharts so recria a instancia se o container realmente mudou (ver chartManager.js).
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

  function chartCard(id, title, hint, colSpan) {
    return (
      '<div class="card chart-card' + (colSpan === 2 ? ' span-2' : '') + '" id="cardwrap-' + id + '">' +
      '<div class="chart-card-head">' +
      '<h2 class="chart-title" data-chart-title="' + FGRUtils.esc(title) + '" title="Clique para o Agente explicar este gráfico">' + title + (hint ? ' <span class="hint">' + hint + '</span>' : '') + '</h2>' +
      '<button class="icon-btn" data-fullscreen="' + id + '" title="Tela cheia">⛶</button>' +
      '</div>' +
      '<div class="chart-canvas" id="chart-' + id + '"></div>' +
      '</div>'
    );
  }

  // Monta o HTML uma unica vez. opts: { boardName, onSaveConfig, onExpand, cfg }
  function renderShell(app, opts) {
    opts = opts || {};
    var cfg = opts.cfg || null;
    var expandBtnHtml = opts.onExpand
      ? '<button class="btn ghost" id="expandBtn" title="Abrir versão em tela cheia">⛶ Expandir Dashboard</button>'
      : '';

    app.innerHTML =
      '<div class="topbar">' +
      '<div class="titlewrap"><h1>Dashboard FGR</h1><div class="sub" id="kpi-subtitle">Carregando…</div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      expandBtnHtml +
      '<div class="health-pill health-unknown" id="health-pill"><span class="dot"></span><span id="health-label">—</span></div>' +
      '</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:14px;">' +
      '<h2>Resumo executivo</h2>' +
      '<div class="grid cols-6">' +
      '<div class="kpi"><div class="v" style="font-size:15px;" id="kpi-empreendimento">—</div><div class="l">Empreendimento</div></div>' +
      '<div class="kpi"><div class="v" style="font-size:15px;" id="kpi-cliente">—</div><div class="l">Cliente</div></div>' +
      '<div class="kpi"><div class="v" style="font-size:15px;" id="kpi-responsavel">—</div><div class="l">Responsável</div></div>' +
      '<div class="kpi"><div class="v num" id="kpi-prazo">—</div><div class="l">Prazo</div></div>' +
      '<div class="kpi"><div class="v num" id="kpi-dias-restantes">—</div><div class="l">Dias restantes</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--good)" id="kpi-executado">—</div><div class="l">Executado</div></div>' +
      '</div>' +
      '</div>' +

      '<div class="card highlight-card">' +
      '<h2>Próximas entregas <span class="hint">por due date</span></h2>' +
      '<div id="upcoming-table"></div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('gauge', 'Progresso Geral', null) +
      '<div class="card">' +
      '<h2>Peso do Projeto</h2>' +
      '<div class="grid cols-3">' +
      '<div class="kpi"><div class="v num">100%</div><div class="l">Peso total</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--good)" id="kpi-peso-executado">—</div><div class="l">Executado</div></div>' +
      '<div class="kpi"><div class="v num" style="color:var(--text-soft)" id="kpi-peso-restante">—</div><div class="l">Restante</div></div>' +
      '</div>' +
      '<div class="grid cols-6" style="margin-top:16px;" id="status-kpis"></div>' +
      '</div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('status-pie', 'Distribuição por Status', null) +
      chartCard('disc-bar', 'Progresso por Disciplina', 'maior → menor') +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('weight-bar', 'Peso das Disciplinas', 'maior → menor') +
      chartCard('heatmap', 'Mapa de Gargalos', 'bloqueados + aguardando terceiros') +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      '<div class="card"><h2>Gargalos <span class="hint">detalhe por disciplina</span></h2><div id="gargalos-list"></div></div>' +
      chartCard('treemap', 'Distribuição do Peso do Projeto', null) +
      '</div>' +

      chartCard('timeline', 'Cronograma', 'largura = peso · verde = concluído', 2) +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('sankey', 'Fluxo das Disciplinas', 'ordem típica, não dependência medida') +
      chartCard('funnel', 'Pipeline do Projeto', null) +
      '</div>' +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('radar', 'Saúde do Empreendimento', null) +
      chartCard('burndown', 'Burn Down', 'restante vs. planejado') +
      '</div>' +

      chartCard('evolucao-line', 'Evolução do Empreendimento', 'histórico diário', 2) +

      '<div class="grid cols-2" style="margin-bottom:14px;">' +
      chartCard('responsavel-bar', 'Distribuição por Responsável', 'tarefas · peso') +
      chartCard('approvals-pie', 'Aprovações', 'por tipo') +
      '</div>' +

      chartCard('critical-bar', 'Atividades Críticas', null, 2) +

      '<div class="card"><h2>Configuração do empreendimento <span class="hint">para calcular a saúde do projeto</span></h2>' +
      '<div class="settings-form">' +
      '<label>Cliente<input type="text" id="cfgCliente" value="' + FGRUtils.esc((cfg && cfg.cliente) || '') + '" style="width:150px"></label>' +
      '<label>Responsável<input type="text" id="cfgResponsavel" value="' + FGRUtils.esc((cfg && cfg.responsavel) || '') + '" style="width:150px"></label>' +
      '<label>Prazo (meses)<input type="number" id="cfgPrazo" value="' + (cfg && cfg.prazoMeses || '') + '" style="width:90px"></label>' +
      '<label>Data de início<input type="date" id="cfgInicio" value="' + (cfg && cfg.dataInicio || '') + '"></label>' +
      '<button class="btn" id="cfgSave">Salvar</button>' +
      '</div>' +
      '<div style="margin-top:12px;color:var(--text-soft)" id="kpi-schedule-gap"></div>' +
      '</div>' +

      '<footer><span>Dados lidos ao vivo do board via Trello REST API.</span><span id="kpi-updated-at">—</span></footer>';

    document.getElementById('cfgSave').onclick = function () {
      opts.onSaveConfig({
        cliente: document.getElementById('cfgCliente').value,
        responsavel: document.getElementById('cfgResponsavel').value,
        prazoMeses: document.getElementById('cfgPrazo').value,
        dataInicio: document.getElementById('cfgInicio').value
      });
    };
    if (opts.onExpand) document.getElementById('expandBtn').onclick = opts.onExpand;

    app.querySelectorAll('[data-fullscreen]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-fullscreen');
        FGRChartManager.toggleFullscreen(id, document.getElementById('cardwrap-' + id));
      };
    });

    app.querySelectorAll('.chart-title').forEach(function (h) {
      h.onclick = function () {
        document.dispatchEvent(new CustomEvent('fgr:chart-click', { detail: { title: h.getAttribute('data-chart-title') } }));
      };
    });
  }

  // Roda a cada refresh (boot inicial + polling). So texto + FGRChartManager.render por grafico.
  function updateCharts(model, history, burndown, boardName) {
    var U = FGRUtils, cfg = model.cfg, health = model.health;

    document.getElementById('kpi-subtitle').textContent = 'Progresso ponderado calculado a partir de ' + model.items.length + ' entregas deste board';
    document.getElementById('health-pill').className = 'health-pill health-' + health.level;
    document.getElementById('health-label').textContent = health.label + (health.gap != null ? ' · gap ' + U.fmtNum(health.gap) + ' p.p.' : '');

    document.getElementById('kpi-empreendimento').textContent = boardName || '—';
    document.getElementById('kpi-cliente').textContent = (cfg && cfg.cliente) || '—';
    document.getElementById('kpi-responsavel').textContent = (cfg && cfg.responsavel) || '—';
    document.getElementById('kpi-prazo').textContent = cfg && cfg.prazoMeses ? cfg.prazoMeses + 'm' : '—';
    document.getElementById('kpi-dias-restantes').textContent = model.restantes != null ? model.restantes : '—';
    document.getElementById('kpi-executado').textContent = U.fmtPct(model.pct);
    document.getElementById('kpi-peso-executado').textContent = U.fmtPct(model.pct);
    document.getElementById('kpi-peso-restante').textContent = U.fmtPct(100 - model.pct);
    document.getElementById('kpi-updated-at').textContent = 'Atualizado ' + new Date().toLocaleTimeString('pt-BR');
    document.getElementById('kpi-schedule-gap').textContent = health.elapsedPct != null
      ? 'Prazo decorrido: ' + U.fmtPct(health.elapsedPct) + ' vs. progresso real ' + U.fmtPct(model.pct)
      : '';

    var LNAMES = FGRCalc.STAGE_ORDER;
    var LLABEL = { 'Backlog Geral': 'Backlog Geral', 'TEC': 'TEC', 'PROJETISTA': 'Projetista', 'NN': 'NN', 'CONCLUSÃO': 'Conclusão' };
    var LCOLOR = { 'Backlog Geral': 'var(--surface-2)', 'TEC': 'var(--accent)', 'PROJETISTA': 'var(--accent)', 'NN': 'var(--warning)', 'CONCLUSÃO': 'var(--good)' };
    document.getElementById('status-kpis').innerHTML = LNAMES.map(function (ln) {
      var count = model.byList[ln] || 0;
      return '<div class="kpi"><div class="v" style="color:' + LCOLOR[ln] + '">' + count + '</div><div class="l">' + LLABEL[ln] + '</div></div>';
    }).join('');

    document.getElementById('gargalos-list').innerHTML = model.bottlenecks.length
      ? model.bottlenecks.map(function (b) {
        return '<div class="bottleneck"><div><div class="name">' + U.esc(b.name) + '</div><div class="desc">Bloqueando ' + b.count + ' entrega' + (b.count > 1 ? 's' : '') + ' · ' + U.fmtNum(b.peso) + ' pts de peso</div></div><div class="count num">' + b.count + '</div></div>';
      }).join('')
      : '<div class="empty">Nenhum gargalo no momento</div>';

    document.getElementById('upcoming-table').innerHTML = model.upcoming.length
      ? '<table><thead><tr><th>Entrega</th><th>Etapa</th><th>Data</th><th>Checklist</th></tr></thead><tbody>' +
        model.upcoming.map(function (i) {
          var ck = i.checklist && i.checklist.total ? (i.checklist.done + '/' + i.checklist.total) : '—';
          return '<tr><td>' + U.esc(i.name) + '</td><td>' + U.esc(i.list) + '</td><td class="num">' + new Date(i.due).toLocaleDateString('pt-BR') + '</td><td class="num">' + ck + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<div class="empty">Nenhum cartão com due date definido ainda</div>';

    // --- graficos ECharts (create ou update, decidido pelo chartManager) ---
    FGRChartManager.render('gauge', document.getElementById('chart-gauge'), FGRChartGauge, { pct: model.pct });

    FGRChartManager.render('status-pie', document.getElementById('chart-status-pie'), FGRChartPie,
      LNAMES.map(function (ln) { return { name: LLABEL[ln], value: model.byList[ln] || 0 }; }));

    FGRChartManager.render('disc-bar', document.getElementById('chart-disc-bar'), FGRChartBar, {
      horizontal: true, unit: '%',
      categories: model.discRows.map(function (r) { return r.name; }),
      series: [{ name: '% concluído', data: model.discRows.map(function (r) { return Math.round(r.pct * 10) / 10; }) }]
    });

    var weightRows = model.discRows.slice().sort(function (a, b) { return b.peso - a.peso; });
    FGRChartManager.render('weight-bar', document.getElementById('chart-weight-bar'), FGRChartBar, {
      horizontal: true, unit: ' pts',
      categories: weightRows.map(function (r) { return r.name; }),
      series: [{ name: 'Peso', data: weightRows.map(function (r) { return Math.round(r.peso * 10) / 10; }) }]
    });

    FGRChartManager.render('heatmap', document.getElementById('chart-heatmap'), FGRChartHeatmap, model.heatmapRows);
    FGRChartManager.render('treemap', document.getElementById('chart-treemap'), FGRChartTreemap, model.treemapRows);
    FGRChartManager.render('timeline', document.getElementById('chart-timeline'), FGRChartTimeline, model.timelineByDisc);
    FGRChartManager.render('sankey', document.getElementById('chart-sankey'), FGRChartSankey, { nodes: model.sankeyNodes, links: model.sankeyLinks });
    FGRChartManager.render('funnel', document.getElementById('chart-funnel'), FGRChartFunnel, model.funnelRows);
    FGRChartManager.render('radar', document.getElementById('chart-radar'), FGRChartRadar, model.radar);

    var burndownSeries = [{ name: 'Restante (real)', data: burndown.real }];
    if (burndown.planned) burndownSeries.unshift({ name: 'Restante (planejado)', data: burndown.planned, dashed: true });
    FGRChartManager.render('burndown', document.getElementById('chart-burndown'), FGRChartLine, { dates: burndown.dates, series: burndownSeries });

    FGRChartManager.render('evolucao-line', document.getElementById('chart-evolucao-line'), FGRChartLine, {
      dates: (history || []).map(function (h) { return h.date; }),
      series: [{ name: '% concluído', data: (history || []).map(function (h) { return h.pct; }) }]
    });

    FGRChartManager.render('responsavel-bar', document.getElementById('chart-responsavel-bar'), FGRChartBar, {
      horizontal: false, unit: '',
      categories: model.responsavelRows.map(function (r) { return r.name; }),
      series: [
        { name: 'Tarefas', data: model.responsavelRows.map(function (r) { return r.count; }) },
        { name: 'Peso', data: model.responsavelRows.map(function (r) { return Math.round(r.peso * 10) / 10; }) }
      ]
    });

    FGRChartManager.render('approvals-pie', document.getElementById('chart-approvals-pie'), FGRChartPie, model.approvalsByType);

    FGRChartManager.render('critical-bar', document.getElementById('chart-critical-bar'), FGRChartBar, {
      horizontal: false, unit: '',
      categories: model.criticalBreakdown.map(function (r) { return r.name; }),
      series: [{ name: 'Entregas', data: model.criticalBreakdown.map(function (r) { return r.value; }) }]
    });
  }

  return { renderAuthGate: renderAuthGate, renderError: renderError, renderShell: renderShell, updateCharts: updateCharts };
})();
