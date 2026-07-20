/*
 * FGRChartTimeline — cronograma visual por disciplina: barra empilhada horizontal,
 * largura total = peso da disciplina (share do projeto), parte cheia = % ja concluido.
 * data: [{ name, share, donePct }]  (mesmo shape de FGRCalc.computeModel().timelineByDisc)
 */
var FGRChartTimeline = (function () {
  function buildOption(data) {
    var categories = data.map(function (d) { return d.name; });
    var done = data.map(function (d) { return Math.round(d.share * d.donePct / 100 * 10) / 10; });
    var remaining = data.map(function (d) { return Math.round((d.share - d.share * d.donePct / 100) * 10) / 10; });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: '#A6A7B8' } },
      grid: { left: 130, right: 30, top: 34, bottom: 20, containLabel: true },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      xAxis: { type: 'value', axisLabel: { color: '#A6A7B8', formatter: '{value} pts' }, splitLine: { lineStyle: { color: '#21222C' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#A6A7B8' } },
      series: [
        { name: 'Concluído', type: 'bar', stack: 'total', barMaxWidth: 20, itemStyle: { color: FGRChartManager.PALETTE.verde, borderRadius: [0, 4, 4, 0] }, data: done },
        { name: 'Restante', type: 'bar', stack: 'total', barMaxWidth: 20, itemStyle: { color: '#2B2C38', borderRadius: [0, 4, 4, 0] }, data: remaining }
      ]
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
