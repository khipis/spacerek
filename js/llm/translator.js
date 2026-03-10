/**
 * Translator for NPC dialogue: when UI is PL → input PL→EN, LLM replies in EN, response EN→PL.
 * When UI is EN → no translation. Uses Opus-MT (Transformers.js); on load failure falls back to pass-through.
 */
(function () {
  'use strict';

  var TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
  var MODEL_PL_EN = 'Xenova/opus-mt-pl-en';
  var MODEL_EN_PL = 'Xenova/opus-mt-en-pl';
  var MODEL_EN_PL_FALLBACK = 'Helsinki-NLP/opus-mt-en-pl';
  var DEBUG_PREFIX = '[Spacerek]';

  var plEnPipe = null;
  var enPlPipe = null;
  var plEnLoadPromise = null;
  var enPlLoadPromise = null;
  var passThrough = true;

  function log() {
    if (typeof console !== 'undefined' && console.log) {
      var args = [].slice.call(arguments);
      args[0] = DEBUG_PREFIX + ' ' + (args[0] || '');
      console.log.apply(console, args);
    }
  }

  function loadPlEn() {
    if (plEnLoadPromise) return plEnLoadPromise;
    plEnLoadPromise = import(/* webpackIgnore: true */ TRANSFORMERS_CDN)
      .then(function (mod) {
        var pipeline = mod.pipeline || (mod.default && mod.default.pipeline);
        if (!pipeline) throw new Error('pipeline not found');
        return pipeline('translation', MODEL_PL_EN, { progress_callback: null });
      })
      .then(function (pipe) {
        plEnPipe = pipe;
        log('Translator PL→EN załadowany (Opus-MT)');
        return pipe;
      })
      .catch(function (err) {
        log('Translator PL→EN load failed (używam pass-through)', err);
        plEnLoadPromise = null;
        return null;
      });
    return plEnLoadPromise;
  }

  function loadEnPl() {
    if (enPlLoadPromise) return enPlLoadPromise;
    enPlLoadPromise = import(/* webpackIgnore: true */ TRANSFORMERS_CDN)
      .then(function (mod) {
        var pipeline = mod.pipeline || (mod.default && mod.default.pipeline);
        if (!pipeline) throw new Error('pipeline not found');
        return pipeline('translation', MODEL_EN_PL, { progress_callback: null });
      })
      .then(function (pipe) {
        enPlPipe = pipe;
        return pipe;
      })
      .catch(function (err) {
        log('Translator EN→PL (' + MODEL_EN_PL + ') failed, trying ' + MODEL_EN_PL_FALLBACK, err);
        return import(/* webpackIgnore: true */ TRANSFORMERS_CDN).then(function (mod) {
          var pipeline = mod.pipeline || (mod.default && mod.default.pipeline);
          if (!pipeline) throw new Error('pipeline not found');
          return pipeline('translation', MODEL_EN_PL_FALLBACK, { progress_callback: null });
        });
      })
      .then(function (pipe) {
        if (pipe) {
          enPlPipe = pipe;
          log('Translator EN→PL załadowany');
        }
        return pipe || null;
      })
      .catch(function (err) {
        log('Translator EN→PL load failed (używam pass-through)', err);
        enPlLoadPromise = null;
        return null;
      });
    return enPlLoadPromise;
  }

  async function translateToEnglish(text) {
    if (!text || typeof text !== 'string') return '';
    var t = text.trim();
    if (!t.length) return '';
    try {
      var pipe = await loadPlEn();
      if (!pipe) {
        log('PL→EN (pass-through): "' + t + '"');
        return t;
      }
      var out = await pipe(t, { max_length: 150 });
      var result = (out && Array.isArray(out) && out[0] && out[0].translation_text) ? out[0].translation_text : (typeof out === 'string' ? out : t);
      log('PL→EN: "' + t + '" → "' + result + '"');
      return result;
    } catch (e) {
      log('PL→EN error (pass-through)', e);
      return t;
    }
  }

  async function translateToPolish(text) {
    if (!text || typeof text !== 'string') return '';
    var t = text.trim();
    if (!t.length) return '';
    try {
      var pipe = await loadEnPl();
      if (!pipe) {
        log('EN→PL (pass-through): "' + t + '"');
        return t;
      }
      var out = await pipe(t, { max_length: 150 });
      var result = (out && Array.isArray(out) && out[0] && out[0].translation_text) ? out[0].translation_text : (typeof out === 'string' ? out : t);
      log('EN→PL: "' + t + '" → "' + result + '"');
      return result;
    } catch (e) {
      log('EN→PL error (pass-through)', e);
      return t;
    }
  }

  function updatePassThrough() {
    passThrough = !plEnPipe || !enPlPipe;
    if (typeof window !== 'undefined' && window.Spacerek) {
      window.Spacerek.translatorIsPassThrough = passThrough;
    }
  }

  function detectPlayerInputLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';
    if (/[ąęćłńóśźżĄĘĆŁŃÓŚŹŻ]/.test(text.trim())) return 'pl';
    return 'en';
  }

  if (typeof window !== 'undefined') {
    window.Spacerek = window.Spacerek || {};
    window.Spacerek.translatorIsPassThrough = true;
    window.Spacerek.detectPlayerInputLanguage = detectPlayerInputLanguage;
    window.Spacerek.translateToEnglish = function (text) {
      return translateToEnglish(text).then(function (r) {
        updatePassThrough();
        return r;
      });
    };
    window.Spacerek.translateToPolish = function (text) {
      return translateToPolish(text).then(function (r) {
        updatePassThrough();
        return r;
      });
    };
  }
})();
