/**
 * Picks a random response for the given intent and language from dialogueData.
 * Used by dialogueManager.
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  var Sp = window.Spacerek;

  function getResponse(intent, langKey, isAnimal) {
    var data = Sp.dialogueData;
    if (!data) return null;
    var branch = isAnimal ? data.animal : data.npc;
    var lang = branch[langKey] || branch.en;
    var list = lang[intent];
    if (!Array.isArray(list) || !list.length) list = lang.unknown;
    if (!list || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  Sp.getResponseForIntent = getResponse;
})();
