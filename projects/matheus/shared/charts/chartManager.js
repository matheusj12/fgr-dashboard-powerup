/*
 * FGRChartManager — camada de performance para todos os graficos ECharts.
 * Responsavel por: inicializar instancias, atualizar (setOption) sem recriar quando
 * o grafico ja existe, destruir instancias orfas, redimensionar em resize/fullscreen.
 * Cada modulo de grafico (gauge.js, pie.js, ...) so sabe montar um "option" do ECharts;
 * quem decide criar vs. atualizar e quem gerencia o ciclo de vida e este arquivo.
 */
var FGRChartManager = (function () {
  var PALETTE = { roxo: '#7C5CFA', verde: '#3DDC97', laranja: '#F59E0B', vermelho: '#EF4444', azul: '#3B82F6', cinza: '#27272A' };
  var registry = {}; // id -> { instance, module, container }
  var themeRegistered = false;

  function ensureTheme() {
    if (themeRegistered) return;
    echarts.registerTheme('fgrDark', {
      color: [PALETTE.roxo, PALETTE.azul, PALETTE.verde, PALETTE.laranja, PALETTE.vermelho, '#9D8DF1', '#60A5FA', '#34D399'],
      backgroundColor: 'transparent',
      textStyle: { color: '#EDEDF2', fontFamily: '-apple-system,system-ui,"Segoe UI",Arial,sans-serif' },
      title: { textStyle: { color: '#EDEDF2' } },
      legend: { textStyle: { color: '#A6A7B8' } },
      tooltip: {
        backgroundColor: '#1B1C25',
        borderColor: '#2B2C38',
        textStyle: { color: '#EDEDF2' }
      },
      grid: { borderColor: '#2B2C38' },
      categoryAxis: {
        axisLine: { lineStyle: { color: '#2B2C38' } },
        axisLabel: { color: '#A6A7B8' },
        splitLine: { lineStyle: { color: '#2B2C38' } }
      },
      valueAxis: {
        axisLine: { lineStyle: { color: '#2B2C38' } },
        axisLabel: { color: '#A6A7B8' },
        splitLine: { lineStyle: { color: '#21222C' } }
      }
    });
    themeRegistered = true;
  }

  // Cria (se nao existir) ou atualiza (se ja existir) o grafico "id" dentro de "container",
  // usando o modulo passado (que precisa expor create(container, data) e update(instance, data)).
  function render(id, container, chartModule, data) {
    ensureTheme();
    var entry = registry[id];
    if (entry && entry.container === container && !entry.instance.isDisposed()) {
      chartModule.update(entry.instance, data);
      return entry.instance;
    }
    if (entry) { try { chartModule.destroy(entry.instance); } catch (e) {} }
    var instance = chartModule.create(container, data);
    registry[id] = { instance: instance, module: chartModule, container: container };
    return instance;
  }

  function dispose(id) {
    var entry = registry[id];
    if (!entry) return;
    try { entry.module.destroy(entry.instance); } catch (e) {}
    delete registry[id];
  }

  function disposeAll() {
    Object.keys(registry).forEach(dispose);
  }

  function resizeAll() {
    Object.keys(registry).forEach(function (id) {
      var entry = registry[id];
      if (entry && !entry.instance.isDisposed()) entry.instance.resize();
    });
  }

  var resizeAttached = false;
  function autoResize() {
    if (resizeAttached) return;
    resizeAttached = true;
    var raf = null;
    window.addEventListener('resize', function () {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resizeAll);
    });
  }

  // Alterna um card entre normal e tela cheia (position:fixed via CSS .fgr-fullscreen)
  // e forca o ECharts a recalcular o tamanho depois da transicao de layout.
  function toggleFullscreen(id, cardEl) {
    cardEl.classList.toggle('fgr-fullscreen');
    setTimeout(function () {
      var entry = registry[id];
      if (entry && !entry.instance.isDisposed()) entry.instance.resize();
    }, 60);
  }

  autoResize();

  return {
    PALETTE: PALETTE,
    render: render,
    dispose: dispose,
    disposeAll: disposeAll,
    resizeAll: resizeAll,
    toggleFullscreen: toggleFullscreen
  };
})();
