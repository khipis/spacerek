/**
 * Dialogue Manager: holds conversation state per NPC, persists in localStorage.
 * Decides response based on intent and NPC state (questGiven, questCompleted, metPlayer).
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  var Sp = window.Spacerek;

  var STORAGE_KEY = 'spacerek_npc_state';

  function getStorageKey(mode, npcName) {
    var m = (mode || 'adventure').replace(/[^a-z0-9]/gi, '');
    var n = String(npcName || 'npc').replace(/[^a-z0-9\u00C0-\u024F]/gi, '') || 'npc';
    return STORAGE_KEY + '_' + m + '_' + n;
  }

  function loadNpcState(mode, npcName) {
    try {
      var raw = localStorage.getItem(getStorageKey(mode, npcName));
      if (!raw) return { metPlayer: false, questGiven: false, questCompleted: false };
      var o = JSON.parse(raw);
      return {
        metPlayer: !!o.metPlayer,
        questGiven: !!o.questGiven,
        questCompleted: !!o.questCompleted
      };
    } catch (e) {
      return { metPlayer: false, questGiven: false, questCompleted: false };
    }
  }

  function saveNpcState(mode, npcName, state) {
    try {
      localStorage.setItem(getStorageKey(mode, npcName), JSON.stringify(state));
    } catch (e) {}
  }

  function markMet(mode, npcName) {
    var s = loadNpcState(mode, npcName);
    s.metPlayer = true;
    saveNpcState(mode, npcName, s);
  }

  function markQuestGiven(mode, npcName) {
    var s = loadNpcState(mode, npcName);
    s.questGiven = true;
    saveNpcState(mode, npcName, s);
  }

  function markQuestCompleted(mode, npcName) {
    var s = loadNpcState(mode, npcName);
    s.questCompleted = true;
    saveNpcState(mode, npcName, s);
  }

  /**
   * Get NPC reply for player text. Uses intentClassifier + responseGenerator.
   * Optional playerContext (monstersKilled, carrots) can influence response.
   */
  function getNpcReply(npcName, langKey, playerText, playerContext) {
    if (!playerText || !playerText.trim()) return null;
    var mode = (window.Spacerek && window.Spacerek.state && window.Spacerek.state.mapStyle) || 'adventure';
    markMet(mode, npcName);
    var classification = Sp.classifyIntent ? Sp.classifyIntent(playerText, langKey) : { intent: 'unknown' };
    var intent = classification.intent || 'unknown';
    var response = Sp.getResponseForIntent ? Sp.getResponseForIntent(intent, langKey, false) : null;
    if (intent === 'quest_request') {
      markQuestGiven(mode, npcName);
    }
    return response || (langKey === 'pl' ? 'Rozumiem. Miłego spaceru!' : 'I see. Have a nice walk!');
  }

  /**
   * Get animal reply for player text. Uses intentClassifier + responseGenerator.
   */
  function getAnimalReply(animalName, langKey, playerText) {
    if (!playerText || !playerText.trim()) return null;
    var classification = Sp.classifyIntent ? Sp.classifyIntent(playerText, langKey) : { intent: 'unknown' };
    var intent = classification.intent || 'unknown';
    var response = Sp.getResponseForIntent ? Sp.getResponseForIntent(intent, langKey, true) : null;
    return response || (langKey === 'pl' ? 'Hmm, miło pogadać!' : 'Nice to chat!');
  }

  Sp.loadNpcState = loadNpcState;
  Sp.saveNpcState = saveNpcState;
  Sp.markNpcMet = markMet;
  Sp.markQuestGiven = markQuestGiven;
  Sp.markQuestCompleted = markQuestCompleted;
  Sp.getNpcReply = getNpcReply;
  Sp.getAnimalReply = getAnimalReply;
})();
