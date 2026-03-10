/**
 * NPC dialogue engine using llama.cpp WASM (wllama) + GGUF model.
 * Runs entirely client-side; no backend. Model ~105MB (SmolLM-135M Q4_K_M).
 * Replies in 1–2 sentences; detects player language (PL/EN) and replies in that language.
 * Load as type="module" so dynamic import() works.
 */
var WLLAMA_CDN = 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/index.min.js';
var WASM_SINGLE = 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm';
var WASM_MULTI = 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm';
var MODEL_URL = 'https://huggingface.co/QuantFactory/SmolLM-135M-GGUF/resolve/main/SmolLM-135M.Q4_K_M.gguf';
var N_PREDICT = 48;
var MAX_REPLY_CHARS = 120;

var wllamaInstance = null;
var loadPromise = null;

function getLangInstruction(lang) {
  return lang === 'pl' ? ' Odpowiedz jednym krótkim zdaniem po polsku.' : ' Reply in one short sentence in English.';
}

/** Strip prompt from completion output and clean echoes (Player:, instruction text, numbers). */
function cleanAndTrimReply(continuation, rejectIfEquals) {
  if (!continuation || typeof continuation !== 'string') return '';
  var t = continuation.trim();
  if (!t) return '';
  if (/^\d+$/.test(t)) return '';
  if (/^player:\s*/i.test(t)) t = t.replace(/^player:\s*/i, '');
  if (/^traveler:\s*/i.test(t)) t = t.replace(/^traveler:\s*/i, '');
  t = t.replace(/^reply in one short sentence in (english|spanish|polish)\.?\s*/i, '');
  t = t.replace(/^odpowiedz jednym krótkim zdaniem po polsku\.?\s*/i, '');
  t = t.trim();
  var firstLine = t.split(/\n/)[0].trim();
  var firstSentence = firstLine.split(/[.!?]/)[0].trim();
  if (firstSentence) firstLine = firstSentence + (firstLine.indexOf('.') !== -1 ? '.' : '');
  if (firstLine.length > MAX_REPLY_CHARS) firstLine = firstLine.slice(0, MAX_REPLY_CHARS - 3) + '...';
  if (!firstLine || /^\d+$/.test(firstLine)) return '';
  if (rejectIfEquals && firstLine.toLowerCase().trim() === String(rejectIfEquals).toLowerCase().trim()) return '';
  return firstLine;
}

function loadWllama() {
  if (loadPromise) return loadPromise;
  if (typeof document === 'undefined' || document.location.protocol === 'file:') {
    loadPromise = Promise.resolve(null);
    return loadPromise;
  }
  loadPromise = import(/* webpackIgnore: true */ WLLAMA_CDN)
    .then(function (mod) {
      var Wllama = mod.Wllama;
      var LoggerWithoutDebug = mod.LoggerWithoutDebug || (function () { return { debug: function () {}, log: function () {}, warn: function () {}, error: function () {} }; });
      var config = {
        'single-thread/wllama.wasm': WASM_SINGLE,
        'multi-thread/wllama.wasm': WASM_MULTI
      };
      var wllama = new Wllama(config, { logger: LoggerWithoutDebug });
      return wllama.loadModelFromUrl(MODEL_URL, { progressCallback: function () {} }).then(function () {
        wllamaInstance = wllama;
        if (typeof window !== 'undefined') {
          window.Spacerek = window.Spacerek || {};
          window.Spacerek.llmModuleLoaded = true;
          window.Spacerek.llmAvailable = true;
        }
        return wllama;
      });
    })
    .catch(function (err) {
      console.warn('NPC GGUF (wllama) load failed', err);
      loadPromise = null;
      return null;
    });
  return loadPromise;
}

function generateWithPrompt(prompt, lang, rejectIfEquals) {
  return loadWllama().then(function (w) {
    if (!w) return null;
    var fullPrompt = prompt + getLangInstruction(lang);
    return w.createCompletion(fullPrompt, {
      nPredict: N_PREDICT,
      sampling: { temp: 0.6, top_k: 40, top_p: 0.9 }
    }).then(function (out) {
      var text = typeof out === 'string' ? out : (out && out.text);
      if (!text) return null;
      var continuation = (text.indexOf(fullPrompt) === 0) ? text.slice(fullPrompt.length) : text;
      return cleanAndTrimReply(continuation, rejectIfEquals);
    }).catch(function () { return null; });
  });
}

function generateAnimalQuest(animalName, lang) {
  var name = animalName || 'Animal';
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var prompt = (langKey === 'pl'
    ? 'Zwierzę ' + name + ' mówi jedno krótkie powitanie. '
    : 'The animal ' + name + ' says one short greeting. ') + name + ': ';
  return generateWithPrompt(prompt, langKey).then(function (line) {
    if (line && line.length > 0) return (langKey === 'pl' ? name + ' mówi: ' : name + ' says: ') + line;
    return null;
  });
}

function generateAnimalReplyFromContext(animalName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = animalName || 'Animal';
  var last = messages[messages.length - 1];
  var playerSaid = last && last.who === 'player' ? last.text : '';
  var context = messages.slice(0, -1).map(function (m) {
    return m.who === 'them' ? name + ': ' + m.text : 'Player: ' + m.text;
  }).join('\n');
  var prompt = (context ? context + '\n' : '') + 'Player said: "' + (playerSaid || '').slice(0, 100).replace(/"/g, "'") + '"\nOutput only ' + name + '\'s reply, nothing else. ' + name + ': ';
  return generateWithPrompt(prompt, langKey, playerSaid);
}

function generateNpcReplyFromContext(npcName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = npcName || 'NPC';
  var last = messages[messages.length - 1];
  var playerSaid = last && last.who === 'player' ? last.text : '';
  var context = messages.slice(0, -1).map(function (m) {
    return m.who === 'them' ? name + ': ' + m.text : 'Traveler: ' + m.text;
  }).join('\n');
  var prompt = (context ? context + '\n' : '') + 'Traveler said: "' + (playerSaid || '').slice(0, 100).replace(/"/g, "'") + '"\nOutput only ' + name + '\'s reply, nothing else. ' + name + ': ';
  return generateWithPrompt(prompt, langKey, playerSaid);
}

if (typeof window !== 'undefined') {
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.llmModuleLoaded = true;
  window.generateAnimalQuest = generateAnimalQuest;
  window.generateAnimalReplyFromContext = generateAnimalReplyFromContext;
  window.generateNpcReplyFromContext = generateNpcReplyFromContext;
  setTimeout(function () { loadWllama().catch(function () {}); }, 1500);
}
