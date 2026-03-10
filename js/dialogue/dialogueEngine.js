/**
 * Intent-based dialogue engine – single entry point for NPC/animal dialogue.
 * Replaces LLM-based system. Runs fully offline; uses intentClassifier, dialogueManager, responseGenerator, questGenerator.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  if (!Sp || !Sp.getNpcReply || !Sp.getAnimalReply || !Sp.generateAnimalQuest) {
    return;
  }

  function getLastPlayerText(messages) {
    if (!Array.isArray(messages) || !messages.length) return '';
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i] && messages[i].who === 'player' && messages[i].text) {
        return String(messages[i].text).trim();
      }
    }
    return '';
  }

  function generateAnimalReplyFromContext(animalName, lang, messages) {
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var text = getLastPlayerText(messages);
    if (!text) return Promise.resolve(null);
    var reply = Sp.getAnimalReply(animalName, langKey, text);
    return Promise.resolve(reply || null);
  }

  function generateNpcReplyFromContext(npcName, lang, messages, playerContext) {
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var text = getLastPlayerText(messages);
    if (!text) return Promise.resolve(null);
    var reply = Sp.getNpcReply(npcName, langKey, text, playerContext);
    return Promise.resolve(reply || null);
  }

  window.generateAnimalQuest = Sp.generateAnimalQuest;
  window.generateAnimalReplyFromContext = generateAnimalReplyFromContext;
  window.generateNpcReplyFromContext = generateNpcReplyFromContext;
  window.Spacerek.llmModuleLoaded = false;
  window.Spacerek.llmAvailable = false;
})();
