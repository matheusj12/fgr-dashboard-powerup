/*
 * FGRChartFunnel — "Pipeline do Projeto": Backlog -> Em andamento -> Aprovacao externa ->
 * Concluido -> Entrega Final. "Entrega Final" fica 0 ate o board ter uma fase formal de
 * handover (nao inventamos numero para isso).
 * data: [{ name, value }]
 */
var FGRChartFunnel = (function () {
  function buildOption(data) {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} entregas' },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      series: [{
        type: 'funnel',
        left: '10%',
        width: '80%',
        sort: 'none',
        minSize: '10%',
        maxSize: '100%',
        gap: 3,
        label: { color: '#0B0B0B', formatter: '{b}\n{c}', fontWeight: 600 },
        itemStyle: { borderColor: '#101116', borderWidth: 2 },
        data: data
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
