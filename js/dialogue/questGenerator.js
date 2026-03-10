/**
 * Procedural quest / greeting generator using templates.
 * Used for animal first line and optional quest_request responses.
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};

  var ANIMAL_GREETING_PL = [
    'Jestem bardzo głodna, zjadłabym marcheweczkę!',
    'Szukam marchewki… masz może?',
    'O, cześć! Marchewka by mi nie zaszkodziła.',
    'Pssst! Gdzie tu można dostać marchewkę?',
    'Marcheweczka to mój przysmak. Masz?',
    'Brzuszek mi burczy… marchewka by pomogła!',
    'Hej! Nie widziałeś tu marchewki?',
    'Dzień dobry! Pięknie dziś, prawda?',
    'O, ktoś przyszedł! Cieszę się.',
    'Nie bój się, nie gryzę. Chyba że masz marchewkę…',
    'Cześć! Masz może coś do przegryzienia?',
    'Szukam przyjaciół. Zostawisz mi marcheweczkę?',
    'Fajnie że rozmawiasz. Lubię towarzystwo.',
    'Marchewka to mój ulubiony przysmak. Serio!',
    'Dzień dobry! Idziesz na spacer? Ja też.'
  ];

  var ANIMAL_GREETING_EN = [
    "I'm so hungry, I could eat a carrot!",
    "Looking for a carrot... have you got one?",
    "Hi! A carrot would be nice.",
    "Where can I find a carrot around here?",
    "Carrots are my favourite. Got any?",
    "Good day! Lovely weather, isn't it?",
    "Oh, someone came! I'm glad.",
    "Don't be scared, I don't bite. Unless you have a carrot…",
    "Hi! Got anything to snack on?",
    "I'm looking for friends. Will you leave me a carrot?",
    "I love it here. Something always smells good.",
    "Nice that you're talking. I like company.",
    "Carrot is my favourite treat. Really!",
    "Good day! Out for a walk? Me too.",
    "My tummy's rumbling. A carrot would help!"
  ];

  function getAnimalGreeting(langKey) {
    var list = langKey === 'pl' ? ANIMAL_GREETING_PL : ANIMAL_GREETING_EN;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Generate first-line quest/greeting for an animal. Optional name prefix.
   */
  function generateAnimalQuest(animalName, lang) {
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var line = getAnimalGreeting(langKey);
    var name = (animalName || '').trim();
    if (name) {
      line = (langKey === 'pl' ? name + ' mówi: ' : name + ' says: ') + line;
    }
    return Promise.resolve(line);
  }

  window.Spacerek = window.Spacerek || {};
  window.Spacerek.generateAnimalQuest = generateAnimalQuest;
})();
