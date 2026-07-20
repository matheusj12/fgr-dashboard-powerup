/*
 * FGRChartPie — pizza/donut reutilizavel. Usado em "Distribuicao por status" e "Aprovacoes por tipo".
 * data: [{ name, value }]
 */
var FGRChartPie = (function () {
  function buildOption(data, opts) {
    opts = opts || {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#A6A7B8' } },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      series: [{
        type: 'pie',
        radius: opts.donut === false ? '65%' : ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#1B1C25', borderWidth: 2, borderRadius: 4 },
        label: { color: '#A6A7B8', formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: '#2B2C38' } },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,.4)' } },
        animationEasing: 'cubicOut',
        data: data
      }]
    };
  }

  function create(container, data, opts) {
    var instance = echarts.init(container, 'fgrDark');
    instance.setOption(buildOption(data, opts));
    return instance;
  }
  function update(instance, data, opts) { instance.setOption(buildOption(data, opts)); }
  function destroy(instance) { instance.dispose(); }

  return { create: create, update: update, destroy: destroy };
})();
