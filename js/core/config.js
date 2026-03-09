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
    SIMULATE_WALK_MS: 900,
    CARROT_SPOILED_CHANCE: 0.12,
    CARROT_SPOILED_XP: -3
  };
})();
