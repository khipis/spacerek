/**
 * Persistence: theme (mode) and experience per mode.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var config = Sp.config;
  var getCurrentMode = Sp.getCurrentMode;

  function getStoredTheme() {
    try {
      var s = localStorage.getItem(config.STORAGE_KEY_THEME);
      if (s === 'noir') return 'adventure';
      if (s === 'vaporwave') return 'cute';
      return config.VALID_STYLES.indexOf(s) >= 0 ? s : 'adventure';
    } catch (e) { return 'adventure'; }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(config.STORAGE_KEY_THEME, theme);
    } catch (e) {}
  }

  function getStoredCharactersRaw() {
    try {
      var raw = localStorage.getItem(config.STORAGE_KEY_CHARACTERS);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function getStoredCharacter(mode) {
    var data = getStoredCharactersRaw();
    return data[mode] || null;
  }

  function setStoredCharacter(mode, character) {
    try {
      var data = getStoredCharactersRaw();
      data[mode] = character;
      localStorage.setItem(config.STORAGE_KEY_CHARACTERS, JSON.stringify(data));
    } catch (e) {}
  }

  function getExperienceRaw() {
    try {
      var raw = localStorage.getItem(config.STORAGE_KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return { spacerek: data, przygoda: [] };
      }
      return data;
    } catch (e) {
      return {};
    }
  }

  function getExperience(mode) {
    var data = getExperienceRaw();
    var m = mode || getCurrentMode();
    return Array.isArray(data[m]) ? data[m] : [];
  }

  var DECORATION_XP = { carrot: 5, monster: 10, animal: 10, artifact: 15, chest_xp: 15, wound: 0, npc: 5 };

  function saveExperienceEntry(place, tier, xpConfig) {
    var data = getExperienceRaw();
    var m = getCurrentMode();
    if (!Array.isArray(data[m])) data[m] = [];
    var cfg = xpConfig || { xp: 10 };
    data[m].push({
      name: place.name,
      desc: place.desc || '',
      lat: place.lat,
      lng: place.lng,
      tier: tier,
      xp: cfg.xp,
      collectedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function saveDecorationEntry(type, name, xp) {
    var data = getExperienceRaw();
    var m = getCurrentMode();
    if (!Array.isArray(data[m])) data[m] = [];
    data[m].push({
      type: type,
      name: name,
      xp: xp != null ? xp : (DECORATION_XP[type] || 5),
      collectedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clearStorage(renderExperiencePanel) {
    try {
      var data = getExperienceRaw();
      var m = getCurrentMode();
      data[m] = [];
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(data));
      if (typeof renderExperiencePanel === 'function') renderExperiencePanel();
    } catch (e) {}
  }

  Sp.getStoredTheme = getStoredTheme;
  Sp.setStoredTheme = setStoredTheme;
  Sp.getStoredCharactersRaw = getStoredCharactersRaw;
  Sp.getStoredCharacter = getStoredCharacter;
  Sp.setStoredCharacter = setStoredCharacter;
  Sp.getExperienceRaw = getExperienceRaw;
  Sp.getExperience = getExperience;
  Sp.saveExperienceEntry = saveExperienceEntry;
  Sp.saveDecorationEntry = saveDecorationEntry;
  Sp.clearStorage = clearStorage;
})();
