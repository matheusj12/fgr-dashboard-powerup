/*
 * FGRChartLine — linha(s) ao longo do tempo. Usado em "Evolucao do Empreendimento" (1 serie)
 * e "Burn Down" (2 series: planejado tracejado + executado solido).
 * data: { dates:[...], series:[{name, data:[...], dashed:bool}] }
 */
var FGRChartLine = (function () {
  function buildOption(data) {
    var series = data.series.map(function (s) {
      return {
        name: s.name,
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2.5, type: s.dashed ? 'dashed' : 'solid' },
        areaStyle: s.dashed ? undefined : { opacity: 0.12 },
        data: s.data
      };
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#A6A7B8' } },
      grid: { left: 40, right: 24, top: 34, bottom: 30, containLabel: true },
      toolbox: {
        right: 8, top: 4,
        feature: { saveAsImage: { title: 'Exportar PNG' }, dataZoom: { title: { zoom: 'Zoom', back: 'Restaurar' } }, restore: { title: 'Restaurar' } },
        iconStyle: { borderColor: '#A6A7B8' }
      },
      xAxis: { type: 'category', data: data.dates, axisLabel: { color: '#A6A7B8' } },
      yAxis: { type: 'value', axisLabel: { color: '#A6A7B8', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#21222C' } } },
      series: series
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
