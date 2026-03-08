/**
 * Stałe konfiguracyjne aplikacji.
 * Polyfill forEach na NodeList dla starszego Safari.
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
    STORAGE_KEY: 'spacerek_experience',
    STORAGE_KEY_THEME: 'spacerek_theme',
    VALID_STYLES: ['adventure', 'stroll', 'cute'],
    WIKI_API: 'https://pl.wikipedia.org/w/api.php',
    WIKI_MAX_DIST_M: 120,
    SIMULATE_WALK_MS: 2500
  };
})();
