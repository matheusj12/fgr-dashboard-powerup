/*
 * FGRChartGauge — progresso geral do empreendimento (peso executado). Cor automatica por faixa:
 * 0-50% vermelho, 50-80% amarelo, 80-100% verde.
 */
var FGRChartGauge = (function () {
  function bandColor(pct) {
    if (pct < 50) return FGRChartManager.PALETTE.vermelho;
    if (pct < 80) return FGRChartManager.PALETTE.laranja;
    return FGRChartManager.PALETTE.verde;
  }

  function buildOption(data) {
    var pct = Math.round(data.pct * 10) / 10;
    var color = bandColor(pct);
    return {
      series: [{
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: '92%',
        progress: { show: true, width: 16, itemStyle: { color: color } },
        axisLine: { lineStyle: { width: 16, color: [[1, 'rgba(255,255,255,.08)']] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: {
          valueAnimation: true,
          formatter: function (v) { return v.toFixed(1) + '%'; },
          color: '#EDEDF2',
          fontSize: 34,
          fontWeight: 700,
          offsetCenter: [0, '5%']
        },
        title: { show: true, offsetCenter: [0, '45%'], color: '#A6A7B8', fontSize: 12 },
        data: [{ value: pct, name: 'Progresso ponderado' }]
      }]
    };
  }

  function create(container, data) {
    var instance = echarts.init(container, 'fgrDark');
    instance.setOption(buildOption(data));
    return instance;
  }
  function update(instance, data) { instance.setOption(buildOption(data)); }
  function destroy(instance) { instance.dispose(); }

  return { create: create, update: update, destroy: destroy };
})();
