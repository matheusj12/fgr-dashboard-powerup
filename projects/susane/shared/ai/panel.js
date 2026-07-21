/*
 * FGRAgentPanel — UI do Agente: botao flutuante, painel lateral, chat, resumo executivo,
 * memoria de sessao e notificacao de eventos. Nao fala com OpenAI diretamente (isso e
 * FGRAgent/FGROpenAiClient) nem calcula indicadores (isso e FGRCalc/FGRContextBuilder) -
 * so orquestra a experiencia.
 *
 * getContext: funcao sincrona fornecida por quem chama init(), que devolve sempre o
 * snapshot mais recente { model, boardName, history, burndown }.
 */
var FGRAgentPanel = (function () {
  var getContext = null;
  var isOpen = false;
  var hasGreeted = false;
  var greetingInFlight = false;
  var messages = []; // { role: 'user' | 'agent', content }
  var queuedDiffs = [];
  var els = {};

  function currentContext() {
    var ctx = getContext();
    return FGRContextBuilder.build(ctx.model, ctx.boardName, ctx.history, ctx.burndown);
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function mount() {
    var fab = el('button', 'fgr-agent-fab', '<span class="fgr-agent-fab-icon">🤖</span><span class="fgr-agent-fab-label">Agente de IA</span>');
    fab.title = 'Analisar empreendimento';
    var badge = el('span', 'fgr-agent-badge'); badge.hidden = true;
    fab.appendChild(badge);

    var toast = el('div', 'fgr-agent-toast'); toast.hidden = true;

    var panel = el('div', 'fgr-agent-panel');
    panel.innerHTML =
      '<div class="fgr-agent-header">' +
      '<div class="fgr-agent-header-top"><span>🤖 Agente de IA</span><button class="icon-btn" id="fgr-agent-close">✕</button></div>' +
      '<div class="fgr-agent-status"><span class="dot"></span>Online — Monitorando empreendimento...</div>' +
      '<div class="fgr-agent-lastanalysis" id="fgr-agent-lastanalysis">Última análise: —</div>' +
      '</div>' +
      '<div class="fgr-agent-keysetup" id="fgr-agent-keysetup" hidden>' +
      '<div class="fgr-agent-summary-title">Configurar Agente</div>' +
      '<p>Cole sua chave da API da OpenAI para ativar o Agente. Ela fica salva apenas neste navegador (localStorage), nunca no código do projeto.</p>' +
      '<div class="settings-form"><input type="password" id="fgr-agent-keyinput" placeholder="sk-..." style="flex:1"><button class="btn" id="fgr-agent-keysave">Salvar</button></div>' +
      '</div>' +
      '<div class="fgr-agent-summary" id="fgr-agent-summary"></div>' +
      '<div class="fgr-agent-messages" id="fgr-agent-messages"></div>' +
      '<div class="fgr-agent-input-row">' +
      '<input type="text" id="fgr-agent-input" placeholder="Pergunte ao Agente…">' +
      '<button class="btn" id="fgr-agent-send">Enviar</button>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(toast);
    document.body.appendChild(panel);

    els = {
      fab: fab, badge: badge, toast: toast, panel: panel,
      close: panel.querySelector('#fgr-agent-close'),
      lastAnalysis: panel.querySelector('#fgr-agent-lastanalysis'),
      keysetup: panel.querySelector('#fgr-agent-keysetup'),
      keyinput: panel.querySelector('#fgr-agent-keyinput'),
      keysave: panel.querySelector('#fgr-agent-keysave'),
      summary: panel.querySelector('#fgr-agent-summary'),
      messagesEl: panel.querySelector('#fgr-agent-messages'),
      input: panel.querySelector('#fgr-agent-input'),
      send: panel.querySelector('#fgr-agent-send')
    };

    fab.onclick = togglePanel;
    els.close.onclick = togglePanel;
    els.send.onclick = handleAsk;
    els.input.onkeydown = function (e) { if (e.key === 'Enter') handleAsk(); };
    toast.onclick = function () { hideToast(); if (!isOpen) togglePanel(); };
    els.keysave.onclick = function () {
      var v = els.keyinput.value.trim();
      if (!v) return;
      FGRAiConfig.setKey(v);
      hideKeySetup();
      runInitialAnalysis();
    };

    document.addEventListener('fgr:chart-click', function (e) { handleExplainChart(e.detail); });
  }

  function showKeySetup() { els.keysetup.hidden = false; }
  function hideKeySetup() { els.keysetup.hidden = true; }

  function togglePanel() {
    isOpen = !isOpen;
    els.panel.classList.toggle('open', isOpen);
    hideBadge();
    hideToast();
    if (isOpen) {
      if (queuedDiffs.length) flushQueuedDiffs();
      if (!hasGreeted && !greetingInFlight) runInitialAnalysis();
      renderMessages();
      els.input.focus();
    }
  }

  function showToast(text) { els.toast.textContent = text; els.toast.hidden = false; }
  function hideToast() { els.toast.hidden = true; }
  function showBadge() { els.badge.hidden = false; }
  function hideBadge() { els.badge.hidden = true; }

  function setLastAnalysis() {
    els.lastAnalysis.textContent = 'Última análise: agora';
  }

  function appendMessage(role, content) { messages.push({ role: role, content: content }); }

  function renderMessages() {
    els.messagesEl.innerHTML = messages.map(function (m) {
      return '<div class="fgr-agent-msg fgr-agent-msg-' + m.role + '">' + FGRUtils.esc(m.content).replace(/\n/g, '<br>') + '</div>';
    }).join('');
    els.messagesEl.scrollTop = els.messagesEl.scrollHeight;
  }

  function showTyping() {
    els.messagesEl.insertAdjacentHTML('beforeend', '<div class="fgr-agent-msg fgr-agent-msg-agent fgr-agent-typing" id="fgr-agent-typing">Analisando…</div>');
    els.messagesEl.scrollTop = els.messagesEl.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById('fgr-agent-typing');
    if (t) t.remove();
  }

  function topRecommendation(ctx) {
    var open = ctx.entregas_mais_pesadas_em_aberto;
    if (!open || !open.length) return 'Nenhuma entrega em aberto no momento — empreendimento com progresso pleno.';
    var top = open[0];
    return 'Priorizar "' + top.nome + '" (' + top.disciplina + ', ' + top.peso + ' pts) — é a maior entrega em aberto e a que mais avança o percentual geral quando concluída.';
  }

  function renderSummary(ctx) {
    var b = ctx.gargalos.map(function (g) { return g.disciplina; }).join(', ') || 'nenhuma no momento';
    var aprov = ctx.aguardando_terceiros || 0;
    var bloq = ctx.bloqueados || 0;
    var evo = ctx.evolucao_recente;
    var delta = evo.length >= 2 ? FGRUtils.fmtNum(evo[evo.length - 1].pct - evo[0].pct) + ' p.p. nos últimos ' + evo.length + ' registros' : 'histórico ainda em construção';

    els.summary.innerHTML =
      '<div class="fgr-agent-summary-title">Resumo Executivo</div>' +
      '<ul>' +
      '<li><b>Progresso geral:</b> ' + FGRUtils.fmtNum(ctx.progresso_ponderado_pct) + '%</li>' +
      '<li><b>Saúde do empreendimento:</b> ' + ctx.saude.label + '</li>' +
      '<li><b>Disciplinas críticas:</b> ' + b + '</li>' +
      '<li><b>Aprovações pendentes:</b> ' + aprov + '</li>' +
      '<li><b>Bloqueios:</b> ' + bloq + '</li>' +
      '<li><b>Evolução recente:</b> ' + delta + '</li>' +
      '<li><b>Principal recomendação:</b> ' + topRecommendation(ctx) + '</li>' +
      '</ul>';
  }

  function runInitialAnalysis() {
    var ctx = currentContext();
    renderSummary(ctx);

    if (!FGRAiConfig.hasKey()) {
      if (isOpen) showKeySetup();
      else { showBadge(); showToast('Configure o Agente para começar. Clique aqui.'); }
      return;
    }
    hideKeySetup();

    greetingInFlight = true;
    if (isOpen) { renderMessages(); showTyping(); }
    FGRAgent.analyze(ctx).then(function (text) {
      hasGreeted = true;
      greetingInFlight = false;
      appendMessage('agent', text);
      setLastAnalysis();
      if (isOpen) { hideTyping(); renderMessages(); }
      else { showBadge(); showToast('Nova análise disponível. Clique para visualizar.'); }
    }).catch(function (err) {
      greetingInFlight = false;
      appendMessage('agent', 'Não consegui concluir a análise agora (' + err.message + '). Clique em "Enviar" com uma pergunta para tentar de novo.');
      if (isOpen) { hideTyping(); renderMessages(); }
    });
  }

  function recentOpenAiHistory() {
    return messages.slice(-10).map(function (m) { return { role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }; });
  }

  function handleAsk() {
    var q = els.input.value.trim();
    if (!q) return;
    if (!FGRAiConfig.hasKey()) { showKeySetup(); return; }
    els.input.value = '';
    appendMessage('user', q);
    renderMessages();
    showTyping();
    var history = recentOpenAiHistory().slice(0, -1); // exclui a pergunta atual, ja vai embutida no ask()
    FGRAgent.ask(q, currentContext(), history).then(function (answer) {
      hideTyping();
      appendMessage('agent', answer);
      renderMessages();
    }).catch(function (err) {
      hideTyping();
      appendMessage('agent', 'Não consegui responder agora (' + err.message + ').');
      renderMessages();
    });
  }

  function handleExplainChart(detail) {
    if (!isOpen) togglePanel();
    appendMessage('user', 'Explique o gráfico "' + detail.title + '".');
    renderMessages();
    showTyping();
    FGRAgent.explainChart(detail.title, currentContext()).then(function (text) {
      hideTyping();
      appendMessage('agent', text);
      renderMessages();
    }).catch(function (err) {
      hideTyping();
      appendMessage('agent', 'Não consegui explicar este gráfico agora (' + err.message + ').');
      renderMessages();
    });
  }

  function flushQueuedDiffs() {
    var diffs = queuedDiffs; queuedDiffs = [];
    showTyping();
    FGRAgent.describeChanges(diffs.map(function (d) { return d.text; }), currentContext()).then(function (text) {
      hideTyping();
      appendMessage('agent', text);
      renderMessages();
      setLastAnalysis();
    }).catch(function () { hideTyping(); });
  }

  // Chamado pelo bootstrap sempre que o polling detectar mudancas reais no board.
  function notifyChanges(diffs) {
    if (!diffs || !diffs.length) return;
    if (isOpen) {
      queuedDiffs = diffs;
      flushQueuedDiffs();
    } else {
      queuedDiffs = queuedDiffs.concat(diffs);
      showBadge();
      showToast(diffs.length === 1 ? 'Nova atualização detectada. Clique para visualizar.' : diffs.length + ' novas atualizações detectadas. Clique para visualizar.');
    }
  }

  function init(getContextFn) {
    getContext = getContextFn;
    mount();
    setTimeout(runInitialAnalysis, 2000);
  }

  return { init: init, notifyChanges: notifyChanges };
})();
