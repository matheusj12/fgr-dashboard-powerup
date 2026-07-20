/*
 * FGRChartSankey — "Fluxo das Disciplinas": ordem canonica de fases do empreendimento
 * (Topografia -> Ambiental -> Urbanismo -> Infraestrutura -> Comercial), com o peso da
 * disciplina seguinte como magnitude do fluxo. Ilustra a sequencia tipica, nao um grafo
 * de dependencia medido (isso ainda e uma pendencia de negocio, ver docs/ARCHITECTURE.md).
 * data: { nodes:[{name}], links:[{source,target,value}] }
 */
var FGRChartSankey = (function () {
  function buildOption(data) {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} pts' },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' } }, iconStyle: { borderColor: '#A6A7B8' } },
      series: [{
        type: 'sankey',
        nodeWidth: 18,
        nodeGap: 18,
        layoutIterations: 32,
        emphasis: { focus: 'adjacency' },
        label: { color: '#EDEDF2' },
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
        itemStyle: { color: FGRChartManager.PALETTE.roxo, borderColor: '#101116' },
        data: data.nodes,
        links: data.links
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
