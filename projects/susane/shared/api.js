/*
 * FGRApi — chamada crua a REST API do Trello.
 * Nao sabe se o token veio do bridge do Power-Up ou de OAuth standalone -
 * so recebe key+token e devolve JSON. E o unico modulo que fala com api.trello.com.
 */
var FGRApi = (function () {
  function get(path, token, key) {
    var sep = path.indexOf('?') > -1 ? '&' : '?';
    return fetch('https://api.trello.com/1' + path + sep + 'key=' + key + '&token=' + token)
      .then(function (r) {
        if (!r.ok) throw new Error('Trello API ' + r.status);
        return r.json();
      });
  }

  // Busca board + cards + lists + labels + members em paralelo - usado pelos dois apps.
  function fetchBoardData(boardId, token, key) {
    return Promise.all([
      get('/boards/' + boardId + '/cards?fields=name,idList,idLabels,idMembers,due,desc,badges', token, key),
      get('/boards/' + boardId + '/lists?fields=name', token, key),
      get('/boards/' + boardId + '/labels?fields=name', token, key),
      get('/boards/' + boardId + '/members?fields=fullName,username', token, key)
    ]).then(function (r) {
      return { cards: r[0], lists: r[1], labels: r[2], members: r[3] };
    });
  }

  return { get: get, fetchBoardData: fetchBoardData };
})();
