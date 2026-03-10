/**
 * Lightweight intent classifier for NPC/animal dialogue.
 * Uses keyword and rule matching; no ML. Detects: greeting, quest_request, location_question, trade, help, goodbye, unknown.
 * Optionally extracts simple entities (enemy, item, location).
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  var Sp = window.Spacerek;

  var INTENTS = ['greeting', 'quest_request', 'location_question', 'trade', 'help', 'goodbye', 'unknown'];

  var KEYWORDS = {
    pl: {
      greeting: ['cześć', 'czesc', 'hej', 'dzień dobry', 'dzien dobry', 'witaj', 'siema', 'hello', 'hi', 'halo', 'dobry dzień', 'dobry dzien'],
      quest_request: ['quest', 'zadanie', 'misja', 'pomóż', 'pomoz', 'pomoc', 'co robić', 'co robic', 'co mogę', 'co moge', 'praca', 'zlecenie', 'czy masz zadanie', 'czy mogę pomóc', 'pomagam', 'szukam pracy'],
      location_question: ['gdzie', 'gdzie jest', 'droga', 'kierunek', 'jak dojść', 'jak dojsc', 'gdzie iść', 'gdzie isc', 'która droga', 'ktora droga', 'mapa', 'gdzie tu', 'skąd', 'skad', 'dokąd', 'dokad'],
      trade: ['kupić', 'kupic', 'sprzedać', 'sprzedac', 'wymiana', 'handel', 'co sprzedajesz', 'cena', 'załóż', 'zaloz', 'sklep', 'kupuję', 'kupuje'],
      help: ['pomoc', 'pomóż', 'pomoz', 'ratunek', 'pomocy', 'hełp', 'help', 'nie wiem', 'jak', 'co dalej', 'wskazówka', 'wskazowka'],
      goodbye: ['żegnaj', 'zegnaj', 'pa', 'do widzenia', 'na razie', 'cześć', 'nara', 'koniec', 'wychodzę', 'wychodze', 'idę', 'ide', 'muszę iść', 'musze isc', 'bye', 'goodbye']
    },
    en: {
      greeting: ['hi', 'hello', 'hey', 'good morning', 'good day', 'howdy', 'greetings', 'sup', 'yo'],
      quest_request: ['quest', 'task', 'mission', 'help me', 'what to do', 'job', 'need a quest', 'got a job', 'anything to do', 'can i help', 'work'],
      location_question: ['where', 'where is', 'road', 'direction', 'how to get', 'which way', 'path', 'map', 'where to go', 'from here'],
      trade: ['buy', 'sell', 'trade', 'shop', 'price', 'exchange', 'what do you sell', 'purchase'],
      help: ['help', 'assist', 'don\'t know', 'how', 'what next', 'hint', 'stuck'],
      goodbye: ['bye', 'goodbye', 'see you', 'later', 'gotta go', 'leaving', 'so long', 'farewell']
    }
  };

  function normalize(text) {
    if (typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function matchKeywords(text, langKey) {
    var normalized = normalize(text);
    if (!normalized) return 'unknown';
    var keys = KEYWORDS[langKey] || KEYWORDS.en;
    for (var i = 0; i < INTENTS.length - 1; i++) {
      var intent = INTENTS[i];
      var list = keys[intent];
      if (!list) continue;
      for (var j = 0; j < list.length; j++) {
        if (normalized.indexOf(list[j]) !== -1) return intent;
      }
    }
    return 'unknown';
  }

  /**
   * Extract simple entities from text (optional).
   * Returns { enemy: string|null, item: string|null, location: string|null }.
   */
  function extractEntities(text, langKey) {
    var normalized = normalize(text);
    var out = { enemy: null, item: null, location: null };
    var enemyWords = langKey === 'pl' ? ['potwór', 'potwor', 'monster', 'stwór', 'stwor', 'bestia', 'wilk', 'smok'] : ['monster', 'beast', 'creature', 'enemy', 'dragon', 'wolf'];
    var itemWords = langKey === 'pl' ? ['marchewk', 'marchew', 'artefakt', 'skarb', 'broń', 'bron', 'miecz'] : ['carrot', 'artifact', 'treasure', 'sword', 'weapon'];
    var locationWords = langKey === 'pl' ? ['ruiny', 'jaskinia', 'las', 'wioska', 'droga', 'góry', 'gory'] : ['ruins', 'cave', 'forest', 'village', 'road', 'mountain'];
    for (var i = 0; i < enemyWords.length; i++) {
      if (normalized.indexOf(enemyWords[i]) !== -1) { out.enemy = enemyWords[i]; break; }
    }
    for (var k = 0; k < itemWords.length; k++) {
      if (normalized.indexOf(itemWords[k]) !== -1) { out.item = itemWords[k]; break; }
    }
    for (var m = 0; m < locationWords.length; m++) {
      if (normalized.indexOf(locationWords[m]) !== -1) { out.location = locationWords[m]; break; }
    }
    return out;
  }

  /**
   * Classify player input. Returns { intent: string, entities: object }.
   */
  function classify(text, langKey) {
    var intent = matchKeywords(text, langKey);
    var entities = extractEntities(text, langKey);
    return { intent: intent, entities: entities };
  }

  Sp.INTENTS = INTENTS;
  Sp.classifyIntent = classify;
  Sp.extractEntities = extractEntities;
})();
