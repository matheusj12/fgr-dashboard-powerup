/*
 * FGRCalc — toda a regra de negocio: pesos, indicadores, KPIs, progresso, saude, risco.
 * Nao conhece Trello Power-Up, nao conhece OAuth, nao conhece HTML. So dados -> dados.
 */
var FGRCalc = (function () {
  var CANON_ORDER = ['Topografia', 'Ambiental', 'Area Institucional', 'Urbanismo', 'AVTO', 'Sondagens', 'Infraestrutura', 'Comercial', 'Administracao/Cliente'];

  function buildItems(cards, listName, labelName, memberName) {
    return cards.map(function (c) {
      var y = FGRUtils.parseYamlBlock(c.desc);
      var disciplina = (y.disciplina && y.disciplina.trim()) ||
        (c.idLabels && c.idLabels[0] ? labelName[c.idLabels[0]] : 'Sem disciplina');
      var pesoRaw = (y.peso || '').replace(',', '.').trim();
      var peso = parseFloat(pesoRaw) || 0;
      return {
        id: c.id,
        name: c.name,
        list: listName[c.idList] || '—',
        disciplina: disciplina,
        peso: peso,
        prioridade: (y.prioridade || '').trim(),
        due: c.due,
        members: (c.idMembers || []).map(function (id) { return memberName[id]; }).filter(Boolean),
        dataPrevista: (y.data_prevista || '').trim()
      };
    });
  }

  // Saude do projeto: compara progresso ponderado real vs. progresso esperado pelo cronograma.
  function healthOf(pctPonderado, cfg, blockedCount) {
    if (!cfg || !cfg.prazoMeses || !cfg.dataInicio) {
      return { level: 'unknown', label: 'Configure o prazo', gap: null, elapsedPct: null };
    }
    var start = new Date(cfg.dataInicio + 'T00:00:00');
    var now = new Date();
    var totalDays = Number(cfg.prazoMeses) * 30;
    var elapsedDays = Math.max(0, (now - start) / 86400000);
    var elapsedPct = Math.min(100, elapsedDays / totalDays * 100);
    var gap = elapsedPct - pctPonderado;
    var level = 'good';
    if (gap > 15 || blockedCount >= 2) level = 'critical';
    else if (gap > 5 || blockedCount >= 1) level = 'warning';
    var labels = { good: 'Saudável', warning: 'Atenção', critical: 'Crítico' };
    return { level: level, label: labels[level], gap: gap, elapsedPct: elapsedPct };
  }

  function diasRestantes(cfg) {
    if (!cfg || !cfg.prazoMeses || !cfg.dataInicio) return null;
    var start = new Date(cfg.dataInicio + 'T00:00:00');
    var totalDays = Number(cfg.prazoMeses) * 30;
    var elapsedDays = Math.max(0, (new Date() - start) / 86400000);
    return Math.max(0, Math.round(totalDays - elapsedDays));
  }

  // Modelo unico com todos os indicadores derivados dos itens do board. E o unico ponto
  // que sabe calcular peso executado, gargalos, criticidade, produtividade por responsavel etc.
  function computeModel(items, cfg) {
    var totalPeso = items.reduce(function (s, i) { return s + i.peso; }, 0) || 1;
    var doneItems = items.filter(function (i) { return i.list === 'Concluido' || i.list === 'Concluído'; });
    var pesoDone = doneItems.reduce(function (s, i) { return s + i.peso; }, 0);
    var pct = pesoDone / totalPeso * 100;

    var byList = {};
    items.forEach(function (i) { byList[i.list] = (byList[i.list] || 0) + 1; });

    var byDisc = {};
    items.forEach(function (i) {
      if (!byDisc[i.disciplina]) byDisc[i.disciplina] = { total: 0, done: 0 };
      byDisc[i.disciplina].total += i.peso;
      if (i.list === 'Concluido') byDisc[i.disciplina].done += i.peso;
    });
    var discRows = Object.keys(byDisc).map(function (k) {
      var d = byDisc[k];
      return { name: k, pct: d.total ? d.done / d.total * 100 : 0, peso: d.total };
    }).sort(function (a, b) { return b.pct - a.pct; });

    var blocked = items.filter(function (i) { return i.list === 'Bloqueado'; });
    var waitingExternal = items.filter(function (i) { return i.list === 'Em aprovacao externa'; });

    var bottlenecksByDisc = {};
    blocked.concat(waitingExternal).forEach(function (i) {
      if (!bottlenecksByDisc[i.disciplina]) bottlenecksByDisc[i.disciplina] = { count: 0, peso: 0 };
      bottlenecksByDisc[i.disciplina].count++;
      bottlenecksByDisc[i.disciplina].peso += i.peso;
    });
    var bottlenecks = Object.keys(bottlenecksByDisc).map(function (k) {
      return { name: k, count: bottlenecksByDisc[k].count, peso: bottlenecksByDisc[k].peso };
    }).sort(function (a, b) { return b.peso - a.peso; });

    var health = healthOf(pct, cfg, blocked.length);
    var restantes = diasRestantes(cfg);

    var withDue = items.filter(function (i) { return !!i.due; }).sort(function (a, b) { return new Date(a.due) - new Date(b.due); });
    var upcoming = withDue.filter(function (i) { return i.list !== 'Concluido'; }).slice(0, 10);
    var now = new Date();
    var overdue = withDue.filter(function (i) { return i.list !== 'Concluido' && new Date(i.due) < now; });
    var highPriority = items.filter(function (i) { return /alta/i.test(i.prioridade); });
    var critical = { highPriority: highPriority.length, overdue: overdue.length, blocked: blocked.length };

    var byMember = {};
    items.forEach(function (i) { i.members.forEach(function (m) { byMember[m] = (byMember[m] || 0) + 1; }); });
    var memberRows = Object.keys(byMember).map(function (k) { return { name: k, count: byMember[k] }; }).sort(function (a, b) { return b.count - a.count; });
    var maxMember = Math.max.apply(null, memberRows.map(function (r) { return r.count; }).concat([1]));

    var timelineByDisc = CANON_ORDER.filter(function (k) { return byDisc[k]; }).map(function (k) {
      var d = byDisc[k];
      return { name: k, share: d.total / totalPeso * 100, donePct: d.total ? d.done / d.total * 100 : 0 };
    });

    return {
      items: items, totalPeso: totalPeso, pct: pct, byList: byList, discRows: discRows,
      blocked: blocked, waitingExternal: waitingExternal, bottlenecks: bottlenecks,
      health: health, restantes: restantes, upcoming: upcoming, critical: critical,
      memberRows: memberRows, maxMember: maxMember, timelineByDisc: timelineByDisc, cfg: cfg
    };
  }

  // getFn/setFn: (key) => Promise, injetados por quem chama (Power-Up storage ou localStorage).
  function saveHistorySnapshot(pct, getFn, setFn) {
    return getFn('fgrProgressHistory').then(function (hist) {
      hist = hist || [];
      var today = new Date().toISOString().slice(0, 10);
      var rounded = Math.round(pct * 10) / 10;
      if (!hist.length || hist[hist.length - 1].date !== today) {
        hist.push({ date: today, pct: rounded });
        hist = hist.slice(-12);
      } else {
        hist[hist.length - 1].pct = rounded;
      }
      return setFn('fgrProgressHistory', hist).then(function () { return hist; });
    });
  }

  return {
    CANON_ORDER: CANON_ORDER,
    buildItems: buildItems,
    healthOf: healthOf,
    diasRestantes: diasRestantes,
    computeModel: computeModel,
    saveHistorySnapshot: saveHistorySnapshot
  };
})();
