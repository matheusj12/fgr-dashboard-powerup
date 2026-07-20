/*
 * FGROpenAiClient — chamada crua ao endpoint de chat completions.
 * Nao sabe nada de Trello, de contexto de projeto ou de persona — so envia mensagens
 * e devolve o texto de resposta. Quando migrar para backend, so este arquivo muda
 * (o "endpoint" passa a ser a sua API própria, sem Authorization: Bearer no browser).
 */
var FGROpenAiClient = (function () {
  function chat(messages, opts) {
    opts = opts || {};
    if (!FGRAiConfig.hasKey()) return Promise.reject(new Error('Chave da OpenAI não configurada neste navegador.'));
    return fetch(FGRAiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + FGRAiConfig.getKey()
      },
      body: JSON.stringify({
        model: opts.model || FGRAiConfig.model,
        messages: messages,
        max_tokens: opts.maxTokens || FGRAiConfig.maxTokens,
        temperature: opts.temperature != null ? opts.temperature : 0.6
      })
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          var msg = (body.error && body.error.message) || ('OpenAI API ' + r.status);
          throw new Error(msg);
        });
      }
      return r.json();
    }).then(function (data) {
      var choice = data.choices && data.choices[0];
      return choice ? choice.message.content.trim() : '';
    });
  }

  return { chat: chat };
})();
