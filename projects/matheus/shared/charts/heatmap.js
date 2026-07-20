/*
 * FGRChartHeatmap — "Mapa de Gargalos": intensidade de bloqueio/aprovacao pendente por disciplina.
 * data: [{ name, intensity }]  (intensity 0-100)
 */
var FGRChartHeatmap = (function () {
  function buildOption(data) {
    var categories = data.map(function (d) { return d.name; });
    var cells = data.map(function (d, i) { return [i, 0, Math.round(d.intensity * 10) / 10]; });

    return {
      tooltip: { position: 'top', formatter: function (p) { return categories[p.data[0]] + ': ' + p.data[2] + '% de peso parado'; } },
      grid: { left: 110, right: 24, top: 16, bottom: 40, containLabel: true },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      xAxis: { type: 'category', data: categories, axisLabel: { color: '#A6A7B8', interval: 0, rotate: 30 }, splitArea: { show: true } },
      yAxis: { type: 'category', data: ['Gargalo'], axisLabel: { color: '#A6A7B8' }, splitArea: { show: true } },
      visualMap: {
        min: 0, max: 100, calculable: false, show: false,
        inRange: { color: ['#21222C', FGRChartManager.PALETTE.laranja, FGRChartManager.PALETTE.vermelho] }
      },
      series: [{
        type: 'heatmap',
        data: cells,
        label: { show: true, color: '#0B0B0B', formatter: function (p) { return p.data[2] + '%'; } },
        itemStyle: { borderColor: '#1B1C25', borderWidth: 3 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.5)' } }
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
