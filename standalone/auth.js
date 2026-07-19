/*
 * FGRAuth — autenticacao para o app standalone (fora do iframe do Trello).
 * Usa o fluxo classico de token do Trello (redirect + token na URL de retorno),
 * ja que aqui nao existe TrelloPowerUp.iframe() para pedir token via bridge.
 * Token fica no localStorage do navegador (por dispositivo, nao compartilhado com o board).
 */
var FGRAuth = (function () {
  var STORAGE_KEY = 'fgrToken';

  function getStoredToken() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function clearToken() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Le "#token=..." da URL de retorno (se o usuario acabou de autorizar), salva e limpa a URL.
  function captureTokenFromRedirect() {
    var m = location.hash.match(/token=([^&]+)/);
    if (m) {
      localStorage.setItem(STORAGE_KEY, m[1]);
      history.replaceState(null, '', location.pathname + location.search);
      return true;
    }
    return false;
  }

  function redirectToAuthorize(key, appName) {
    var returnUrl = location.href.split('#')[0];
    location.href = 'https://trello.com/1/authorize?expiration=30days&scope=read&response_type=token'
      + '&name=' + encodeURIComponent(appName)
      + '&key=' + key
      + '&return_url=' + encodeURIComponent(returnUrl);
  }

  // Resolve com o token, ou redireciona a pagina para o Trello (a Promise nunca resolve
  // nesse caso, pois a navegacao ja esta acontecendo).
  function ensureToken(key, appName) {
    captureTokenFromRedirect();
    var existing = getStoredToken();
    if (existing) return Promise.resolve(existing);
    redirectToAuthorize(key, appName);
    return new Promise(function () {});
  }

  return { ensureToken: ensureToken, clearToken: clearToken, getStoredToken: getStoredToken };
})();
