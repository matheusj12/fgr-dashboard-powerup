/*
 * FGRContextBuilder — resume o estado do board (KPIs, riscos, progresso, bloqueios,
 * atividades criticas etc.) num JSON compacto para enviar a IA, em vez de mandar os
 * 73 cartoes crus a cada pergunta. Reduz custo/latencia e e o unico lugar que precisa
 * mudar se um dia quisermos incluir mais/menos informacao no contexto da IA.
 */
var FGRContextBuilder = (function () {
  function round1(n) { return Math.round((n || 0) * 10) / 10; }

  function build(model, boardName, history, burndown) {
    var criticalItems = model.items
      .filter(function (i) { return i.list !== 'Concluido'; })
      .slice()
      .sort(function (a, b) { return b.peso - a.peso; })
      .slice(0, 8)
      .map(function (i) {
        return { nome: i.name, disciplina: i.disciplina, peso: round1(i.peso), status: i.list, prioridade: i.prioridade || null, responsaveis: i.members };
      });

    var recentHistory = (history || []).slice(-6).map(function (h) { return { data: h.date, pct: h.pct }; });

    return {
      empreendimento: boardName,
      progresso_ponderado_pct: round1(model.pct),
      saude: { nivel: model.health.level, label: model.health.label, gap_cronograma_pp: model.health.gap != null ? round1(model.health.gap) : null },
      dias_restantes: model.restantes,
      distribuicao_status: model.byList,
      progresso_por_disciplina: model.discRows.map(function (r) { return { disciplina: r.name, pct: round1(r.pct), peso: round1(r.peso) }; }),
      gargalos: model.bottlenecks.map(function (b) { return { disciplina: b.name, entregas_paradas: b.count, peso_parado: round1(b.peso) }; }),
      aprovacoes_pendentes_por_tipo: model.approvalsByType,
      atividades_criticas_resumo: model.criticalBreakdown,
      entregas_mais_pesadas_em_aberto: criticalItems,
      responsaveis: model.responsavelRows.slice(0, 10),
      radar_saude: {
        prazo: round1(model.radar.prazo), progresso: round1(model.radar.progresso), aprovacao: round1(model.radar.aprovacao),
        bloqueios: round1(model.radar.bloqueios), produtividade: round1(model.radar.produtividade), execucao: round1(model.radar.execucao)
      },
      evolucao_recente: recentHistory,
      burndown_ultimo_ponto: {
        restante_real_pct: burndown && burndown.real && burndown.real.length ? round1(burndown.real[burndown.real.length - 1]) : null,
        restante_planejado_pct: burndown && burndown.planned && burndown.planned.length ? round1(burndown.planned[burndown.planned.length - 1]) : null
      }
    };
  }

  return { build: build };
})();
