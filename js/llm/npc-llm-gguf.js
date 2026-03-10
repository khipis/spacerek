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
var N_PREDICT = 32;
var MAX_REPLY_CHARS = 100;

var wllamaInstance = null;
var loadPromise = null;

var GREETING_PL = [
  'Cześć! Fajnie że jesteś. Masz coś na ząb?', 'O, ktoś przyszedł! Cieszę się.', 'Dzień dobry! Pięknie dziś, prawda?',
  'Hej! Nie bój się, jestem przyjazna.', 'Szukam marchewki… masz może?', 'Miło kogoś spotkać.'
];
var GREETING_EN = [
  'Hi! Nice to meet you. Got a snack?', 'Oh, someone came! I\'m glad.', 'Good day! Lovely weather, right?',
  'Hey! Don\'t be scared, I\'m friendly.', 'Looking for a carrot… have you got one?', 'Nice to meet someone.'
];

function getLangInstruction(lang) {
  return lang === 'pl' ? ' Odpowiedz jednym krótkim zdaniem po polsku.' : ' Reply in one short sentence in English.';
}

var GARBAGE_PHRASES = [
  'in the form of', 'the letter ', 'the other two', 'the other one', 'part of the alphabet',
  'odpowiedz jednym krótkim zdaniem', 'reply in one short sentence'
];

function looksLikeGarbage(s) {
  var lower = s.toLowerCase();
  for (var i = 0; i < GARBAGE_PHRASES.length; i++) {
    if (lower.indexOf(GARBAGE_PHRASES[i]) !== -1) return true;
  }
  return false;
}

/** Strip prompt from completion output and clean echoes (instruction, markdown, name echo). */
function cleanAndTrimReply(continuation, rejectIfEquals) {
  if (!continuation || typeof continuation !== 'string') return '';
  var t = continuation.trim();
  if (!t) return '';
  if (/^\d+$/.test(t)) return '';
  t = t.replace(/^[\w\s]+:\s*/i, '');
  t = t.replace(/^player:\s*/i, '');
  t = t.replace(/^traveler:\s*/i, '');
  t = t.replace(/reply in one short sentence in (english|spanish|polish)\.?\s*/gi, '');
  t = t.replace(/odpowiedz jednym krótkim zdaniem po polsku\.?\s*/gi, '');
  t = t.replace(/^[\w\s]+:\s*reply to[\w\s]+(?:and[\w\s]+::?\s*)*/gi, '');
  t = t.replace(/^[\w\s]+:\s*$/i, '');
  t = t.replace(/^#+\s*(\d+\.?)?\s*/gm, '');
  t = t.replace(/^\s*\d+\.\s*/gm, '');
  t = t.replace(/^\s*[-*]\s*/gm, '');
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
  var list = langKey === 'pl' ? GREETING_PL : GREETING_EN;
  var line = list[Math.floor(Math.random() * list.length)];
  return Promise.resolve((langKey === 'pl' ? name + ' mówi: ' : name + ' says: ') + line);
}

function generateAnimalReplyFromContext(animalName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = animalName || 'Animal';
  var last = messages[messages.length - 1];
  var playerSaid = (last && last.who === 'player' ? last.text : '').trim().slice(0, 80).replace(/"/g, "'");
  if (!playerSaid) return Promise.resolve(null);
  var prompt = 'User said: "' + playerSaid + '". ' + name + ' replies in one short sentence. ' + name + ': ';
  return generateWithPrompt(prompt, langKey, playerSaid);
}

function generateNpcReplyFromContext(npcName, lang, messages) {
  if (!messages || !messages.length) return Promise.resolve(null);
  var langKey = lang === 'pl' ? 'pl' : 'en';
  var name = npcName || 'NPC';
  var last = messages[messages.length - 1];
  var playerSaid = (last && last.who === 'player' ? last.text : '').trim().slice(0, 80).replace(/"/g, "'");
  if (!playerSaid) return Promise.resolve(null);
  var prompt = 'User said: "' + playerSaid + '". ' + name + ' replies in one short sentence. ' + name + ': ';
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
