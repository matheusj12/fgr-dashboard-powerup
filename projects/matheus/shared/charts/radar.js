/*
 * FGRChartRadar — "Saude do Empreendimento": Prazo, Progresso, Aprovacao, Bloqueios,
 * Produtividade, Execucao — cada eixo 0-100 (formulas em FGRCalc.computeModel().radar).
 * data: { prazo, progresso, aprovacao, bloqueios, produtividade, execucao }
 */
var FGRChartRadar = (function () {
  var AXES = [
    ['prazo', 'Prazo'], ['progresso', 'Progresso'], ['aprovacao', 'Aprovação'],
    ['bloqueios', 'Bloqueios'], ['produtividade', 'Produtividade'], ['execucao', 'Execução']
  ];

  function buildOption(data) {
    var values = AXES.map(function (a) { return Math.round((data[a[0]] || 0) * 10) / 10; });
    return {
      tooltip: {},
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      radar: {
        indicator: AXES.map(function (a) { return { name: a[1], max: 100 }; }),
        splitArea: { areaStyle: { color: ['rgba(255,255,255,.02)', 'rgba(255,255,255,.05)'] } },
        axisName: { color: '#A6A7B8' },
        splitLine: { lineStyle: { color: '#2B2C38' } },
        axisLine: { lineStyle: { color: '#2B2C38' } }
      },
      series: [{
        type: 'radar',
        areaStyle: { opacity: 0.25 },
        lineStyle: { width: 2, color: FGRChartManager.PALETTE.roxo },
        itemStyle: { color: FGRChartManager.PALETTE.roxo },
        data: [{ value: values, name: 'Saúde atual' }]
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
