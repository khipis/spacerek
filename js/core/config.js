/**
 * App configuration constants.
 * NodeList.forEach polyfill for older Safari.
 */
(function () {
  'use strict';
  if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.config = {
    OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
    ARRIVAL_METERS: 50,
    DECORATION_PROXIMITY_METERS: 65,
    STORAGE_KEY: 'spacerek_experience',
    STORAGE_KEY_THEME: 'spacerek_theme',
    STORAGE_KEY_CHARACTERS: 'spacerek_characters',
    VALID_STYLES: ['adventure', 'stroll', 'cute'],
    WIKI_API: 'https://pl.wikipedia.org/w/api.php',
    WIKI_MAX_DIST_M: 120,
    SIMULATE_WALK_MS: 300,
    CARROT_SPOILED_CHANCE: 0.10,
    CARROT_SPOILED_XP: -2,
    CARROT_GIFT_XP: 18,
    ARTIFACT_ULTRALEGENDARY_CHANCE: 0.08,
    ARTIFACT_ULTRALEGENDARY_XP: 38,
    MONSTER_DEFEAT_XP_LOSS: 8
  };
})();
