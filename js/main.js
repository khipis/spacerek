/**
 * App entry point: init, event binding, label refresh.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  if (!Sp || !Sp.state || !Sp.$) {
    var tip = 'Nie załadowano wszystkich plików. Otwórz aplikację przez serwer (w folderze projektu: python3 -m http.server 8000, potem http://localhost:8000).';
    if (typeof document !== 'undefined' && document.body) {
      var div = document.createElement('div');
      div.style.cssText = 'position:fixed;inset:0;background:#1a1a2e;color:#e8e4de;padding:2rem;font-family:sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;z-index:99999;';
      div.textContent = tip;
      document.body.appendChild(div);
    } else {
      alert(tip);
    }
    return;
  }
  var state = Sp.state;
  var $ = Sp.$;
  var getStoredTheme = Sp.getStoredTheme;
  var setStoredTheme = Sp.setStoredTheme;
  var getStoredCharacter = Sp.getStoredCharacter;
  var setStoredCharacter = Sp.setStoredCharacter;
  var clearStorage = Sp.clearStorage;
  var applyLocale = Sp.applyLocale;
  var updateDistanceInstruction = Sp.updateDistanceInstruction;
  var applyTheme = Sp.applyTheme;
  var applyMapStyle = Sp.applyMapStyle;
  var renderExperiencePanel = Sp.renderExperiencePanel;
  var openExperiencePanel = Sp.openExperiencePanel;
  var closeExperiencePanel = Sp.closeExperiencePanel;
  var updateDistanceHint = Sp.updateDistanceHint;
  var updateDebugPanel = Sp.updateDebugPanel;
  var updateRevealButton = Sp.updateRevealButton;
  var backToMap = Sp.backToMap;
  var resetWalk = Sp.resetWalk;
  var showWalkStats = Sp.showWalkStats;
  var startWalk = Sp.startWalk;
  var simulateArrival = Sp.simulateArrival;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  function rollAdventureStats() {
    function roll(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }
    return {
      level: 1,
      strength: roll(3, 12),
      dexterity: roll(3, 12),
      intelligence: roll(3, 12)
    };
  }

  function ensureCharacter(mode) {
    if (mode !== 'adventure' && mode !== 'cute') return null;
    var cur = getStoredCharacter(mode);
    if (cur && cur.name && cur.emoji) {
      if (mode === 'adventure' && cur.stats && (cur.stats.strength == null || cur.stats.dexterity == null || cur.stats.intelligence == null)) {
        cur.stats = rollAdventureStats();
        setStoredCharacter(mode, cur);
      }
      return cur;
    }
    var data = window.Spacerek.characterData && window.Spacerek.characterData[mode];
    if (!data) return null;
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var names = data.names && data.names[lang];
    var emojis = data.emojis || [];
    var name = (names && names.length) ? names[Math.floor(Math.random() * names.length)] : (mode === 'adventure' ? 'Bohater' : 'Przyjaciel');
    var emoji = emojis.length ? emojis[Math.floor(Math.random() * emojis.length)] : (mode === 'adventure' ? '🧙' : '🐰');
    var stats = mode === 'adventure' ? rollAdventureStats() : { level: 1 };
    var character = { name: name, emoji: emoji, stats: stats };
    setStoredCharacter(mode, character);
    return character;
  }

  function renderCharacterCard(mode) {
    var card = $('character-card');
    var emojiEl = $('character-emoji');
    var nameEl = $('character-name');
    var statsEl = $('character-stats');
    var inputEl = $('character-name-input');
    if (!card) return;
    if (mode !== 'adventure' && mode !== 'cute') {
      card.classList.add('hidden');
      return;
    }
    card.classList.remove('hidden');
    var char = ensureCharacter(mode);
    if (char) {
      if (emojiEl) emojiEl.textContent = char.emoji;
      if (nameEl) nameEl.textContent = char.name;
      if (statsEl) {
        var s = char.stats || {};
        var level = s.level || 1;
        if (mode === 'adventure' && (s.strength != null || s.dexterity != null || s.intelligence != null)) {
          var str = s.strength != null ? s.strength : '?';
          var dex = s.dexterity != null ? s.dexterity : '?';
          var int_ = s.intelligence != null ? s.intelligence : '?';
          statsEl.textContent = t('character_level', { level: level }) + ' · ' +
            t('character_strength') + ' ' + str + ' ' +
            t('character_dexterity') + ' ' + dex + ' ' +
            t('character_intelligence') + ' ' + int_;
        } else {
          statsEl.textContent = t('character_level', { level: level });
        }
      }
      if (inputEl) {
        inputEl.value = char.name;
        inputEl.classList.add('hidden');
      }
    }
  }

  function randomizeCharacter(mode) {
    if (mode !== 'adventure' && mode !== 'cute') return;
    var data = window.Spacerek.characterData && window.Spacerek.characterData[mode];
    if (!data) return;
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var names = data.names && data.names[lang];
    var emojis = data.emojis || [];
    var name = (names && names.length) ? names[Math.floor(Math.random() * names.length)] : (mode === 'adventure' ? 'Bohater' : 'Przyjaciel');
    var emoji = emojis.length ? emojis[Math.floor(Math.random() * emojis.length)] : (mode === 'adventure' ? '🧙' : '🐰');
    var cur = getStoredCharacter(mode) || {};
    var stats = mode === 'adventure' ? rollAdventureStats() : (cur.stats || { level: 1 });
    var character = { name: name, emoji: emoji, stats: stats };
    setStoredCharacter(mode, character);
    renderCharacterCard(mode);
    if (typeof applyMapStyle === 'function') applyMapStyle();
  }

  function saveCharacterName(mode, name) {
    if (mode !== 'adventure' && mode !== 'cute') return;
    var trimmed = (name || '').trim();
    if (!trimmed) return;
    var cur = getStoredCharacter(mode) || {};
    var character = { name: trimmed, emoji: cur.emoji || (mode === 'adventure' ? '🧙' : '🐰'), stats: cur.stats || { level: 1 } };
    setStoredCharacter(mode, character);
    renderCharacterCard(mode);
  }

  function refreshDynamicLabels() {
    var userEl = document.querySelector('.user-marker-fun');
    if (userEl) userEl.title = t('tooltip_you_short');
    if (state.userMarker) {
      var userTip = state.userMarker.getTooltip && state.userMarker.getTooltip();
      if (userTip) userTip.setContent(t('tooltip_you'));
    }
    if (state.targetMarkers && state.targetMarkers.length) {
      state.targetMarkers.forEach(function (m) {
        var tip = m.getTooltip && m.getTooltip();
        var tierKey = m._tier ? 'tier_' + m._tier : 'tier_epic';
        if (tip) tip.setContent(t(tierKey));
      });
    }
    if (state.visitedMarkers && state.visitedMarkers.length) {
      state.visitedMarkers.forEach(function (m) {
        var tip = m.getTooltip && m.getTooltip();
        if (tip && m._placeName) tip.setContent(m._placeName + t('tooltip_visited'));
      });
    }
    updateDistanceHint();
    updateDebugPanel();
    updateRevealButton();
    renderExperiencePanel();
    try {
      if (typeof renderCharacterCard === 'function') renderCharacterCard(state.mapStyle);
    } catch (e) { console.error('renderCharacterCard:', e); }
  }

  function initStartScreen() {
    var btnStart = $('btn-start');
    var buttons = document.querySelectorAll('.btn-distance');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        state.selectedKm = parseFloat(btn.getAttribute('data-km'));
        btnStart.disabled = false;
      });
    });
    var defaultKmBtn = document.querySelector('.btn-distance[data-km="1.9"]');
    if (defaultKmBtn) {
      buttons.forEach(function (b) { b.classList.remove('selected'); });
      defaultKmBtn.classList.add('selected');
      state.selectedKm = 1.9;
      btnStart.disabled = false;
    } else if (state.selectedKm == null) {
      state.selectedKm = 1.9;
    }

    var styleButtons = document.querySelectorAll('.btn-map-style');
    function updateMapStyleSelection() {
      styleButtons.forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-style') === state.mapStyle);
      });
    }
    styleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mapStyle = btn.getAttribute('data-style') || 'adventure';
        setStoredTheme(state.mapStyle);
        updateMapStyleSelection();
        applyTheme();
        updateDistanceInstruction();
        ensureCharacter(state.mapStyle);
        renderCharacterCard(state.mapStyle);
      });
    });
    updateMapStyleSelection();

    var numInput = document.getElementById('num-attractions');
    var numValue = document.getElementById('num-attractions-value');
    if (numInput && numValue) {
      numInput.value = state.numAttractions;
      numValue.textContent = state.numAttractions;
      numInput.addEventListener('input', function () {
        state.numAttractions = Math.min(10, Math.max(1, parseInt(numInput.value, 10) || 5));
        numInput.value = state.numAttractions;
        numValue.textContent = state.numAttractions;
      });
    }

    btnStart.addEventListener('click', function () {
      if (state.selectedKm == null) state.selectedKm = 1.9;
      startWalk();
    });

    try {
      ensureCharacter('adventure');
      ensureCharacter('cute');
      renderCharacterCard(state.mapStyle);
    } catch (e) {
      console.error('Character init:', e);
    }

    var btnReroll = $('btn-character-reroll');
    var btnRename = $('btn-character-rename');
    var nameSpan = $('character-name');
    var nameInput = $('character-name-input');
    if (btnReroll) {
      btnReroll.addEventListener('click', function () {
        randomizeCharacter(state.mapStyle);
      });
    }
    if (btnRename && nameSpan && nameInput) {
      btnRename.addEventListener('click', function () {
        if (nameInput.classList.contains('hidden')) {
          nameInput.value = (getStoredCharacter(state.mapStyle) || {}).name || '';
          nameInput.classList.remove('hidden');
          nameSpan.classList.add('hidden');
          nameInput.focus();
        } else {
          nameInput.classList.add('hidden');
          nameSpan.classList.remove('hidden');
          saveCharacterName(state.mapStyle, nameInput.value);
        }
      });
      nameInput.addEventListener('blur', function () {
        if (!nameInput.classList.contains('hidden')) {
          nameInput.classList.add('hidden');
          nameSpan.classList.remove('hidden');
          saveCharacterName(state.mapStyle, nameInput.value);
        }
      });
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          nameInput.blur();
        }
      });
    }
  }

  function init() {
    state.mapStyle = getStoredTheme();
    applyLocale(refreshDynamicLabels);
    applyTheme();

    document.querySelectorAll('.btn-lang').forEach(function (b) {
      b.classList.toggle('selected', b.getAttribute('data-lang') === (window.CURRENT_LOCALE || 'pl'));
    });
    document.querySelectorAll('.btn-lang').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = this.getAttribute('data-lang');
        if (!lang || !window.LOCALES || !window.LOCALES[lang]) return;
        window.CURRENT_LOCALE = lang;
        if (window.setStoredLang) window.setStoredLang(lang);
        applyLocale(refreshDynamicLabels);
        document.querySelectorAll('.btn-lang').forEach(function (b) {
          b.classList.toggle('selected', b.getAttribute('data-lang') === lang);
        });
      });
    });

    var btnReveal = $('btn-reveal-action');
    if (btnReveal) {
      btnReveal.addEventListener('click', function () {
        var collected = Object.keys(state.collectedIndices).length;
        if (collected < state.targetPlaces.length) {
          backToMap();
        } else {
          showWalkStats();
        }
      });
    }

    function closeStatsAndReset() {
      var overlay = document.getElementById('stats-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
      }
      resetWalk();
    }
    var btnStatsClose = $('btn-stats-close');
    var btnStatsFinish = $('btn-stats-finish');
    if (btnStatsClose) btnStatsClose.addEventListener('click', closeStatsAndReset);
    if (btnStatsFinish) btnStatsFinish.addEventListener('click', closeStatsAndReset);

    var btnDebug = $('btn-debug-toggle');
    if (btnDebug) {
      btnDebug.addEventListener('click', function () {
        var panel = $('debug-panel');
        if (panel) panel.classList.toggle('debug-open');
      });
    }

    var btnSimulate = $('btn-simulate-arrival');
    if (btnSimulate) btnSimulate.addEventListener('click', simulateArrival);

    var btnGoToDecoration = $('btn-go-to-decoration');
    if (btnGoToDecoration) {
      btnGoToDecoration.addEventListener('click', function () {
        var idx = state.selectedDecorationIndex;
        if (idx != null && !state.metDecorationIndices[idx]) {
          Sp.goToDecoration(idx);
        } else {
          var nearest = Sp.getNearestUnmetDecoration && Sp.getNearestUnmetDecoration();
          if (nearest) {
            Sp.goToDecoration(nearest.index);
          } else {
            if (Sp.setStatus) Sp.setStatus(t('walk_go_to_decoration_none'), '');
          }
        }
      });
    }

    var styleSelect = document.getElementById('map-style-select');
    if (styleSelect) {
      styleSelect.addEventListener('change', function () {
        state.mapStyle = styleSelect.value || 'adventure';
        setStoredTheme(state.mapStyle);
        applyMapStyle();
      });
    }

    initStartScreen();

    var isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    var insecure = typeof location !== 'undefined' && (
      location.protocol === 'file:' ||
      (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')
    );
    if (isIOS && insecure) {
      var banner = document.createElement('div');
      banner.id = 'ios-unsafe-banner';
      banner.className = 'ios-unsafe-banner';
      banner.setAttribute('role', 'alert');
      banner.setAttribute('data-i18n', 'ios_banner');
      banner.textContent = window.t ? window.t('ios_banner') : 'Na iPhonie aplikacja działa tylko przez HTTPS. Na komputerze: python3 -m http.server 8000. Na telefonie otwórz adres https z tunelu (ngrok) lub wdróż na serwer z SSL.';
      var startContent = document.querySelector('#screen-start .start-content');
      if (startContent) startContent.insertBefore(banner, startContent.firstChild);
    }

    var btnExp = $('btn-experience');
    var btnExpMap = $('btn-experience-map');
    if (btnExp) btnExp.addEventListener('click', openExperiencePanel);
    if (btnExpMap) btnExpMap.addEventListener('click', openExperiencePanel);
    var btnExpClose = $('btn-experience-close');
    if (btnExpClose) btnExpClose.addEventListener('click', closeExperiencePanel);
    var btnClear = $('btn-clear-storage');
    if (btnClear) {
      btnClear.addEventListener('click', function () {
        clearStorage(renderExperiencePanel);
        closeExperiencePanel();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
