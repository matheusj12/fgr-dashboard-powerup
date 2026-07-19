/*
 * FGRCharts — blocos visuais reutilizaveis (barras, distribuicao por status, cronograma).
 * Recebe dados ja calculados por FGRCalc e devolve HTML. Nao sabe de onde os dados vieram.
 */
var FGRCharts = (function () {
  var LNAMES = ['Backlog', 'Em andamento', 'Bloqueado', 'Em aprovacao externa', 'Concluido'];
  var LLABEL = { 'Backlog': 'Backlog', 'Em andamento': 'Em andamento', 'Bloqueado': 'Bloqueado', 'Em aprovacao externa': 'Aprovação externa', 'Concluido': 'Concluído' };

  function barRows(rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<div class="empty">' + (opts.emptyText || 'Sem dados ainda') + '</div>';
    return rows.map(function (r) {
      return '<div class="row"><div class="name" title="' + FGRUtils.esc(r.name) + '">' + FGRUtils.esc(r.name) + '</div>' +
        '<div class="track"><div class="fill" style="width:' + (opts.max ? (r.value / opts.max * 100) : r.pct) + '%"></div></div>' +
        '<div class="val num">' + (opts.max ? r.value : FGRUtils.fmtPct(r.pct)) + '</div></div>';
    }).join('');
  }

  function statusDistribution(model) {
    return LNAMES.map(function (ln) {
      var color = ln === 'Concluido' ? 'var(--good)' : ln === 'Bloqueado' ? 'var(--critical)' : ln === 'Em aprovacao externa' ? 'var(--warning)' : ln === 'Em andamento' ? 'var(--accent)' : 'var(--surface-2)';
      var count = model.byList[ln] || 0;
      return '<div class="kpi"><div class="v" style="color:' + color + '">' + count + '</div><div class="l">' + LLABEL[ln] + '</div></div>';
    }).join('');
  }

  function timeline(model) {
    return model.timelineByDisc.map(function (d) {
      return '<div style="flex:0 0 ' + d.share + '%;min-width:26px;">' +
        '<div style="height:22px;background:var(--surface-2);border-radius:4px;overflow:hidden;">' +
        '<div style="height:100%;width:' + d.donePct + '%;background:var(--accent);"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-soft);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + FGRUtils.esc(d.name) + '</div>' +
        '</div>';
    }).join('<div style="width:2px;"></div>');
  }

  function historyRows(history) {
    var rows = (history || []).slice(-8);
    if (!rows.length) return '<div class="empty">Histórico será construído conforme o dashboard for aberto ao longo das semanas.</div>';
    return rows.map(function (h) {
      return '<div class="row"><div class="name">' + FGRUtils.esc(h.date) + '</div>' +
        '<div class="track"><div class="fill" style="width:' + h.pct + '%"></div></div>' +
        '<div class="val num">' + FGRUtils.fmtPct(h.pct) + '</div></div>';
    }).join('');
  }

  function heroProgressBar(pct) {
    return '<div class="hero-progress">' +
      '<div class="pct num">' + FGRUtils.fmtPct(pct) + '</div>' +
      '<div class="track"><div class="fill" style="width:' + Math.min(100, pct) + '%"></div></div>' +
      '</div>';
  }

  return {
    barRows: barRows,
    statusDistribution: statusDistribution,
    timeline: timeline,
    historyRows: historyRows,
    heroProgressBar: heroProgressBar
  };
})();
