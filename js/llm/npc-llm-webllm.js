/**
 * NPC dialogue engine using WebLLM (@mlc-ai/web-llm).
 * Runs entirely in the browser via WebGPU; no backend or API calls.
 * Models: TinyLlama 1.1B or SmolLM2 1.7B (4-bit quant). Replies in 1–2 sentences; PL/EN.
 * Load as type="module" so dynamic import() works. Conversation context kept locally.
 */
var WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm@0.2.81';
var MODEL_ID = 'SmolLM2-1.7B-Instruct-q4f16_1-MLC';
// Alternative (smaller, more mobile-friendly): 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC'
var MAX_TOKENS = 56;
var MAX_REPLY_CHARS = 120;
var TEMPERATURE = 0.6;

var engine = null;
var loadPromise = null;

var GREETING_PL = [
  'Cześć! Fajnie że jesteś. Masz coś na ząb?', 'O, ktoś przyszedł! Cieszę się.', 'Dzień dobry! Pięknie dziś, prawda?',
  'Hej! Nie bój się, jestem przyjazna.', 'Szukam marchewki… masz może?', 'Miło kogoś spotkać.'
];
var GREETING_EN = [
  'Hi! Nice to meet you. Got a snack?', 'Oh, someone came! I\'m glad.', 'Good day! Lovely weather, right?',
  'Hey! Don\'t be scared, I\'m friendly.', 'Looking for a carrot… have you got one?', 'Nice to meet someone.'
];

var GARBAGE_PHRASES = [
  'in the form of', 'the letter ', 'the other two', 'the other one', 'part of the alphabet',
  'odpowiedz jednym krótkim zdaniem', 'reply in one short sentence'
];

function looksLikeGarbage(s) {
  var lower = (s || '').toLowerCase();
  for (var i = 0; i < GARBAGE_PHRASES.length; i++) {
    if (lower.indexOf(GARBAGE_PHRASES[i]) !== -1) return true;
  }
  return false;
}

function cleanAndTrimReply(content, rejectIfEquals) {
  if (!content || typeof content !== 'string') return '';
  var t = content.trim();
  if (!t) return '';
  if (/^\d+$/.test(t)) return '';
  t = t.replace(/^[\w\s]+:\s*/i, '');
  t = t.replace(/^(I reply|I say|I answer|I respond),?\s*/gi, '');
  t = t.replace(/^[\w\s]+ (says|replies|responds|answers):\s*/gi, '');
  t = t.replace(/reply in one short sentence in (english|spanish|polish)\.?\s*/gi, '');
  t = t.replace(/odpowiedz jednym krótkim zdaniem po polsku\.?\s*/gi, '');
  t = t.replace(/^#+\s*(\d+\.?)?\s*/gm, '');
  t = t.replace(/^\s*\d+\.\s*/gm, '');
  t = t.replace(/^\s*[-*]\s*/gm, '');
  if (/^["']/.test(t)) t = t.replace(/^["']+/, '');
  if (/["']$/.test(t)) t = t.replace(/["']+$/, '');
  t = t.trim();
  var firstLine = t.split(/\n/)[0].trim();
  var firstSentence = firstLine.split(/[.!?]/)[0].trim();
  if (firstSentence) {
    var end = firstLine.match(/[.!?]/);
    firstLine = firstSentence + (end ? end[0] : '');
  }
  if (firstLine.length > MAX_REPLY_CHARS) firstLine = firstLine.slice(0, MAX_REPLY_CHARS - 3) + '...';
  if (!firstLine || /^\d+$/.test(firstLine) || /^[#*.\s\-]+$/i.test(firstLine)) return '';
  if (looksLikeGarbage(firstLine)) return '';
  if (rejectIfEquals && firstLine.toLowerCase().trim() === String(rejectIfEquals).toLowerCase().trim()) return '';
  return firstLine;
}

function getSystemPrompt(name, lang, isAnimal) {
  var role = isAnimal ? 'A friendly animal named ' + name + '.' : 'A character named ' + name + '.';
  var langRule = lang === 'pl'
    ? ' Reply in one short sentence in Polish only.'
    : ' Reply in one short sentence in English only.';
  return role + ' Answer only as ' + name + ', briefly. Output only the reply text: no "I reply", no "I say", no "' + name + ' says/replies", no quotation marks around the reply.' + langRule;
}

function loadWebLLM(progressCb) {
  if (loadPromise) return loadPromise;
  if (typeof document === 'undefined' || document.location.protocol === 'file:') {
    loadPromise = Promise.resolve(null);
    return loadPromise;
  }
  var callback = progressCb || function () {};
  loadPromise = import(/* webpackIgnore: true */ WEBLLM_CDN)
    .then(function (mod) {
      var CreateMLCEngine = mod.CreateMLCEngine || mod.default && mod.default.CreateMLCEngine;
      if (!CreateMLCEngine) return Promise.reject(new Error('CreateMLCEngine not found'));
      return CreateMLCEngine(MODEL_ID, {
        initProgressCallback: function (prog) {
          callback(prog);
          if (prog && prog.progress !== undefined && typeof console !== 'undefined' && console.log) {
            console.log('WebLLM:', prog.text || prog.step || prog.progress);
          }
        }
      });
    })
    .then(function (eng) {
      engine = eng;
      if (typeof window !== 'undefined') {
        window.Spacerek = window.Spacerek || {};
        window.Spacerek.llmModuleLoaded = true;
        window.Spacerek.llmAvailable = true;
      }
      return engine;
    })
    .catch(function (err) {
      console.warn('WebLLM load failed', err);
      loadPromise = null;
      engine = null;
      if (typeof window !== 'undefined' && window.Spacerek) {
        window.Spacerek.llmAvailable = false;
      }
      return null;
    });
  return loadPromise;
}

function chatCompletion(messages, options) {
  return loadWebLLM().then(function (eng) {
    if (!eng) return null;
    var opts = Object.assign({
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      stream: false
    }, options || {});
    return eng.chat.completions.create({
      messages: messages,
      temperature: opts.temperature,
      max_tokens: opts.max_tokens,
      stream: false
    }).then(function (response) {
      var choice = response && response.choices && response.choices[0];
      var msg = choice && choice.message;
      var content = msg && msg.content;
      return typeof content === 'string' ? content.trim() : '';
    }).catch(function () { return ''; });
  });
}

function generateAnimalQuest(animalName, lang) {
  var name = animalName || 'Animal';
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var list = langKey === 'pl' ? GREETING_PL : GREETING_EN;
  var line = list[Math.floor(Math.random() * list.length)];
  return Promise.resolve((langKey === 'pl' ? name + ' mówi: ' : name + ' says: ') + line);
}

function generateAnimalReplyFromContext(animalName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = animalName || 'Animal';
  var last = messages[messages.length - 1];
  var playerSaid = (last && last.who === 'player' ? last.text : '').trim().slice(0, 120).replace(/"/g, "'");
  if (!playerSaid) return Promise.resolve(null);
  var system = getSystemPrompt(name, langKey, true);
  var chatMessages = [
    { role: 'system', content: system },
    { role: 'user', content: 'Player said: "' + playerSaid + '". What does ' + name + ' reply?' }
  ];
  return chatCompletion(chatMessages).then(function (raw) {
    return cleanAndTrimReply(raw, playerSaid) || null;
  });
}

function generateNpcReplyFromContext(npcName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = npcName || 'NPC';
  var last = messages[messages.length - 1];
  var playerSaid = (last && last.who === 'player' ? last.text : '').trim().slice(0, 120).replace(/"/g, "'");
  if (!playerSaid) return Promise.resolve(null);
  var system = getSystemPrompt(name, langKey, false);
  var chatMessages = [
    { role: 'system', content: system },
    { role: 'user', content: 'Traveler said: "' + playerSaid + '". What does ' + name + ' reply?' }
  ];
  return chatCompletion(chatMessages).then(function (raw) {
    return cleanAndTrimReply(raw, playerSaid) || null;
  });
}

if (typeof window !== 'undefined') {
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.llmModuleLoaded = true;
  window.Spacerek.preloadWebLLM = function (progressCb) {
    if (document.location.protocol === 'file:') return Promise.resolve(null);
    return loadWebLLM(progressCb);
  };
  window.generateAnimalQuest = generateAnimalQuest;
  window.generateAnimalReplyFromContext = generateAnimalReplyFromContext;
  window.generateNpcReplyFromContext = generateNpcReplyFromContext;
}
