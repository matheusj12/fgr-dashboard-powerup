/*
 * FGRUtils — funcoes puras de formatacao e parsing.
 * Sem DOM, sem Trello, sem HTML. Usado por todos os outros modulos.
 */
var FGRUtils = (function () {
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function fmtPct(n) {
    return (Math.round(n * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  }

  function fmtNum(n) {
    return (Math.round(n * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  // Le o bloco ```yaml ... ``` de dentro da descricao de um cartao do Trello.
  function parseYamlBlock(desc) {
    var out = {};
    if (!desc) return out;
    var m = desc.match(/```yaml([\s\S]*?)```/);
    var body = m ? m[1] : desc;
    body.split('\n').forEach(function (line) {
      var idx = line.indexOf(':');
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var val = line.slice(idx + 1).trim();
      if (!key) return;
      out[key] = val;
    });
    return out;
  }

  return { esc: esc, fmtPct: fmtPct, fmtNum: fmtNum, parseYamlBlock: parseYamlBlock };
})();
