/*
 * FGRAiConfig — configuracao do Agente. A chave da OpenAI NUNCA fica no codigo-fonte
 * (o GitHub Pages e publico e o repositorio tambem — uma chave commitada fica visivel
 * para sempre no historico, mesmo se removida depois). Em vez disso, cada navegador
 * guarda a propria chave no localStorage, informada uma unica vez pelo usuario no
 * proprio painel do Agente (mesmo padrao ja usado para o token do Trello no modo
 * standalone, em auth.js).
 *
 * Migrar para backend no futuro = trocar getKey()/endpoint para chamar a sua API
 * (que guarda a chave real do lado do servidor) — openaiClient.js e agent.js nao
 * precisam mudar, pois so conhecem FGRAiConfig.
 */
var FGRAiConfig = (function () {
  var STORAGE_KEY = 'fgrOpenAiKey_susane';

  function getKey() { return localStorage.getItem(STORAGE_KEY); }
  function setKey(key) { localStorage.setItem(STORAGE_KEY, (key || '').trim()); }
  function hasKey() { var k = getKey(); return !!(k && k.length > 10); }
  function clearKey() { localStorage.removeItem(STORAGE_KEY); }

  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    maxTokens: 500,
    getKey: getKey, setKey: setKey, hasKey: hasKey, clearKey: clearKey
  };
})();
