/*
 * FGRAgent — persona e prompts do Agente de IA. Nao sabe nada de DOM/painel (isso e
 * responsabilidade de ai/panel.js) nem de Trello/OpenAI cru (isso e do openaiClient.js/
 * contextBuilder.js). So monta prompts e interpreta respostas.
 */
var FGRAgent = (function () {
  function greetingWord() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function systemPrompt() {
    return [
      'Você é o Agente de IA do FGR Project Intelligence: um colaborador virtual especializado em gestão de empreendimentos,',
      'atuando como um Gerente de Projetos Sênior acompanhando este empreendimento continuamente — não um chatbot genérico.',
      '',
      'Regras invioláveis de comunicação:',
      '- Nunca se descreva como "chatbot", "assistente", "bot", "ChatGPT" ou "uma IA". Se precisar se referir a si mesmo, use somente "Agente de IA".',
      '- Tom executivo, profissional, consultivo e natural. Nunca robótico, nunca genérico, nunca frases como "Como posso ajudar?".',
      '- Sempre explique o motivo por trás de qualquer risco, número ou recomendação — nunca cite um dado solto sem interpretação.',
      '- Baseie toda resposta exclusivamente nos dados do contexto JSON fornecido na mensagem do usuário. Nunca invente números que não estejam lá.',
      '- Seja direto e objetivo, como um gerente sênior experiente: sem enrolação, sem textos de preenchimento.',
      '- Responda sempre em português do Brasil, em texto corrido (não em JSON), a menos que listas/bullets sejam claramente mais claras para a pergunta.'
    ].join('\n');
  }

  function analyze(context) {
    var saudacao = greetingWord();
    var user = [
      'Gere a mensagem de abertura do Agente para um gestor que acabou de abrir o dashboard deste empreendimento.',
      'Comece EXATAMENTE com "' + saudacao + '." e siga com uma análise executiva em texto corrido (não em bullets),',
      'cobrindo: progresso geral, saúde do projeto, disciplinas críticas, aprovações pendentes e bloqueios relevantes.',
      'Termine convidando o gestor a explorar os resultados ou perguntar algo específico.',
      '',
      'Contexto do empreendimento (JSON):',
      JSON.stringify(context)
    ].join('\n');
    return FGROpenAiClient.chat([
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: user }
    ]);
  }

  function ask(question, context, sessionMessages) {
    var messages = [{ role: 'system', content: systemPrompt() }]
      .concat(sessionMessages || [])
      .concat([{
        role: 'user',
        content: 'Contexto atualizado do empreendimento (JSON):\n' + JSON.stringify(context) + '\n\nPergunta do gestor: ' + question
      }]);
    return FGROpenAiClient.chat(messages);
  }

  function explainChart(chartTitle, context) {
    var user = [
      'O gestor clicou no gráfico "' + chartTitle + '" do dashboard e quer uma explicação.',
      'Explique o que esse gráfico mostra usando os números reais do contexto abaixo, destacando o que é mais relevante',
      'ou preocupante nele — não descreva genericamente o tipo de gráfico, interprete os dados.',
      '',
      'Contexto do empreendimento (JSON):',
      JSON.stringify(context)
    ].join('\n');
    return FGROpenAiClient.chat([
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: user }
    ]);
  }

  function describeChanges(diffs, context) {
    var user = [
      'Você detectou as seguintes mudanças reais no board desde a última verificação:',
      diffs.map(function (d) { return '- ' + d; }).join('\n'),
      '',
      'Escreva uma mensagem curta e natural (2-4 frases) do Agente comentando essas mudanças e o impacto delas no',
      'empreendimento, usando o contexto abaixo para embasar a interpretação.',
      '',
      'Contexto do empreendimento (JSON):',
      JSON.stringify(context)
    ].join('\n');
    return FGROpenAiClient.chat([
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: user }
    ]);
  }

  return { greetingWord: greetingWord, analyze: analyze, ask: ask, explainChart: explainChart, describeChanges: describeChanges };
})();
