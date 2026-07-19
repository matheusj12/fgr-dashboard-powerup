/*
 * FGRChartTreemap — "Distribuicao do Peso do Projeto": cada bloco = uma disciplina,
 * tamanho = peso, cor = % executado (mais verde = mais concluido).
 * data: [{ name, peso, pct }]
 */
var FGRChartTreemap = (function () {
  function colorForPct(pct) {
    if (pct >= 80) return FGRChartManager.PALETTE.verde;
    if (pct >= 40) return FGRChartManager.PALETTE.azul;
    if (pct > 0) return FGRChartManager.PALETTE.laranja;
    return '#3A3B47';
  }

  function buildOption(data) {
    var nodes = data.map(function (d) {
      return {
        name: d.name,
        value: Math.round(d.peso * 10) / 10,
        pct: Math.round(d.pct * 10) / 10,
        itemStyle: { color: colorForPct(d.pct) }
      };
    });

    return {
      tooltip: {
        formatter: function (p) {
          return p.name + '<br/>Peso: ' + p.data.value + ' pts<br/>Executado: ' + p.data.pct + '%';
        }
      },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        upperLabel: { show: false },
        label: {
          color: '#0B0B0B',
          formatter: function (p) { return p.name + '\n' + p.data.value + ' pts · ' + p.data.pct + '%'; },
          fontWeight: 600
        },
        itemStyle: { borderColor: '#101116', borderWidth: 2, gapWidth: 2 },
        data: nodes
      }]
    };
  }

  function create(container, data) {
    var instance = echarts.init(container, 'fgrDark');
    instance.setOption(buildOption(data));
    return instance;
  }
  function update(instance, data) { instance.setOption(buildOption(data), { notMerge: true }); }
  function destroy(instance) { instance.dispose(); }

  return { create: create, update: update, destroy: destroy };
})();
