/*
 * FGREventWatcher — compara os itens de dois polls consecutivos e descreve, em
 * linguagem natural, o que mudou de verdade no board (mudanca de lista, cartao novo,
 * bloqueio, prazo, responsavel, peso). Usado pelo painel do Agente para interromper
 * discretamente quando algo relevante acontece, sem esperar o usuario perguntar.
 */
var FGREventWatcher = (function () {
  var LABEL = { 'Backlog Geral': 'Backlog Geral', 'TEC': 'TEC', 'PROJETISTA': 'Projetista', 'NN': 'NN', 'CONCLUSÃO': 'Conclusão' };
  var STATUS_BLOQUEADO = 'Pause / Estratégia';
  var STATUS_AGUARDANDO = 'Devendo';

  function transitionText(item, fromList, toList) {
    if (FGRCalc.isDone(toList)) return 'A disciplina ' + item.disciplina + ' concluiu a entrega "' + item.name + '".';
    return '"' + item.name + '" mudou de ' + (LABEL[fromList] || fromList) + ' para ' + (LABEL[toList] || toList) + '.';
  }

  function hasLabel(item, name) { return (item.labels || []).indexOf(name) > -1; }

  // items: [{id, name, disciplina, list, labels, peso, due, members, checklist}]
  function diff(prevItems, nextItems) {
    if (!prevItems || !prevItems.length) return [];
    var prevMap = {};
    prevItems.forEach(function (i) { prevMap[i.id] = i; });

    var changes = [];
    nextItems.forEach(function (item) {
      var prev = prevMap[item.id];
      if (!prev) {
        changes.push({ text: 'Novo cartão adicionado: "' + item.name + '" (' + item.disciplina + ').', severity: 'info' });
        return;
      }
      if (prev.list !== item.list) {
        var severity = FGRCalc.isDone(item.list) ? 'good' : 'info';
        changes.push({ text: transitionText(item, prev.list, item.list), severity: severity });
      }
      if (!hasLabel(prev, STATUS_BLOQUEADO) && hasLabel(item, STATUS_BLOQUEADO)) {
        changes.push({ text: '"' + item.name + '" (' + item.disciplina + ') foi marcada como Pause / Estratégia.', severity: 'critical' });
      }
      if (!hasLabel(prev, STATUS_AGUARDANDO) && hasLabel(item, STATUS_AGUARDANDO)) {
        changes.push({ text: '"' + item.name + '" (' + item.disciplina + ') ficou aguardando terceiros (Devendo).', severity: 'info' });
      }
      if (prev.due !== item.due && item.due) {
        changes.push({ text: 'O prazo de "' + item.name + '" foi definido/alterado para ' + new Date(item.due).toLocaleDateString('pt-BR') + '.', severity: 'info' });
      }
      var prevMembers = (prev.members || []).join(',');
      var nextMembers = (item.members || []).join(',');
      if (prevMembers !== nextMembers) {
        changes.push({ text: 'O responsável por "' + item.name + '" foi atualizado.', severity: 'info' });
      }
      var prevCk = prev.checklist || { done: 0, total: 0 };
      var nextCk = item.checklist || { done: 0, total: 0 };
      if (prevCk.done !== nextCk.done && nextCk.total) {
        changes.push({ text: 'Checklist de "' + item.name + '" avançou para ' + nextCk.done + '/' + nextCk.total + '.', severity: 'info' });
      }
    });
    return changes;
  }

  return { diff: diff };
})();
