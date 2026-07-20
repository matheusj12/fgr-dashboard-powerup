/*
 * FGREventWatcher — compara os itens de dois polls consecutivos e descreve, em
 * linguagem natural, o que mudou de verdade no board (mudanca de lista, cartao novo,
 * bloqueio, prazo, responsavel, peso). Usado pelo painel do Agente para interromper
 * discretamente quando algo relevante acontece, sem esperar o usuario perguntar.
 */
var FGREventWatcher = (function () {
  var LABEL = { 'Backlog': 'Backlog', 'Em andamento': 'Em andamento', 'Bloqueado': 'Bloqueado', 'Em aprovacao externa': 'Aprovação externa', 'Concluido': 'Concluído' };

  function transitionText(item, fromList, toList) {
    if (toList === 'Concluido') return 'A disciplina ' + item.disciplina + ' concluiu a entrega "' + item.name + '".';
    if (toList === 'Bloqueado') return '"' + item.name + '" (' + item.disciplina + ') foi bloqueada.';
    if (toList === 'Em aprovacao externa') return '"' + item.name + '" (' + item.disciplina + ') entrou em aprovação externa.';
    return '"' + item.name + '" mudou de ' + (LABEL[fromList] || fromList) + ' para ' + (LABEL[toList] || toList) + '.';
  }

  // items: [{id, name, disciplina, list, peso, due, members}]
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
        var severity = item.list === 'Bloqueado' ? 'critical' : item.list === 'Concluido' ? 'good' : 'info';
        changes.push({ text: transitionText(item, prev.list, item.list), severity: severity });
      }
      if (prev.due !== item.due && item.due) {
        changes.push({ text: 'O prazo de "' + item.name + '" foi definido/alterado para ' + new Date(item.due).toLocaleDateString('pt-BR') + '.', severity: 'info' });
      }
      var prevMembers = (prev.members || []).join(',');
      var nextMembers = (item.members || []).join(',');
      if (prevMembers !== nextMembers) {
        changes.push({ text: 'O responsável por "' + item.name + '" foi atualizado.', severity: 'info' });
      }
      if (prev.peso !== item.peso) {
        changes.push({ text: 'O peso de "' + item.name + '" mudou de ' + prev.peso + ' para ' + item.peso + ' pontos.', severity: 'info' });
      }
    });
    return changes;
  }

  return { diff: diff };
})();
