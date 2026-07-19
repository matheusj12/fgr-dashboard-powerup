/*
 * FGRChartBar — barras horizontais ou verticais, 1+ series. Reutilizado por:
 * Progresso por Disciplina (horizontal), Peso das Disciplinas (vertical),
 * Distribuicao por Responsavel (vertical, multi-serie), Atividades Criticas (vertical).
 *
 * data: { categories:[...], series:[{name, data:[...]}], horizontal:bool, unit:'%'|'' }
 */
var FGRChartBar = (function () {
  function buildOption(data) {
    var categories = data.categories;
    var seriesDefs = data.series;
    var unit = data.unit || '';
    var horizontal = !!data.horizontal;

    var series = seriesDefs.map(function (s, idx) {
      return {
        name: s.name,
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        label: seriesDefs.length === 1 ? {
          show: true,
          position: horizontal ? 'right' : 'top',
          color: '#EDEDF2',
          formatter: '{c}' + unit
        } : { show: false },
        emphasis: { focus: 'series' },
        data: s.data
      };
    });

    var categoryAxis = { type: 'category', data: categories, axisLabel: { color: '#A6A7B8' } };
    var valueAxis = { type: 'value', axisLabel: { color: '#A6A7B8', formatter: '{value}' + unit }, splitLine: { lineStyle: { color: '#21222C' } } };

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: seriesDefs.length > 1 ? { top: 0, textStyle: { color: '#A6A7B8' } } : undefined,
      grid: { left: horizontal ? 110 : 40, right: 30, top: seriesDefs.length > 1 ? 34 : 16, bottom: horizontal ? 20 : 30, containLabel: true },
      toolbox: { right: 8, top: 4, feature: { saveAsImage: { title: 'Exportar PNG' }, dataZoom: { title: { zoom: 'Zoom', back: 'Restaurar' } } }, iconStyle: { borderColor: '#A6A7B8' } },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
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
