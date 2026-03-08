/**
 * Style mapy (Noir / Spacerek): filtry, ikony, motyw, markery.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  var MAP_STYLE_FILTERS = {
    adventure: 'grayscale(1) contrast(1.35) brightness(0.9)',
    stroll: 'contrast(1.08) brightness(1.02)',
    cute: 'hue-rotate(-75deg) saturate(1.6) contrast(1.05) brightness(1.02)'
  };

  var ADVENTURE_MONSTERS = ['👹', '👺', '🐉', '👾', '💀', '🦇', '🐲', '🧌', '🐍', '🕷️'];
  var CUTE_DECORATIONS = ['🥕', '🥕', '🥕', '🥕', '🥕', '🥕', '🥕', '🐰', '🐹', '🐿️'];

  var MAP_STYLE_ICONS = {
    adventure: { user: '🧝‍♂️', attraction: '?', visited: '✔' },
    stroll: { user: '🚶', attraction: '⭐', visited: '✓' },
    cute: { user: '🐰', attraction: '❤️', visited: '✅' }
  };

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Zwraca tablicę ikon do rozrzucenia na mapie (potwory / marchewki+zwierzątka). Puste dla Walk. */
  function getDecorationIcons(style) {
    if (style === 'adventure') {
      var monsters = shuffleArray(ADVENTURE_MONSTERS.slice());
      var n = 5 + Math.floor(Math.random() * 6);
      return monsters.slice(0, n);
    }
    if (style === 'cute') {
      var pool = shuffleArray(CUTE_DECORATIONS.slice());
      return pool;
    }
    return [];
  }

  function getStyleIcons(style) {
    return MAP_STYLE_ICONS[style] || MAP_STYLE_ICONS.adventure;
  }

  function updateMarkerIcons() {
    var style = state.mapStyle || 'adventure';
    var icons = getStyleIcons(style);
    var container = document.getElementById('map-container');
    if (!container) return;
    var userEl = container.querySelector('.user-marker-fun');
    if (userEl) userEl.textContent = icons.user;
    container.querySelectorAll('.attraction-marker-pin').forEach(function (el) {
      el.textContent = icons.attraction || '?';
    });
    container.querySelectorAll('.visited-marker-pin').forEach(function (el) {
      el.textContent = icons.visited;
    });
    if (state.decorationMarkers && state.decorationMarkers.length) {
      state.decorationMarkers.forEach(function (m) {
        var el = m.getElement && m.getElement();
        if (el && m._decorationChar) {
          var pin = el.querySelector('.decoration-marker-pin');
          if (pin) pin.textContent = m._decorationChar;
        }
      });
    }
  }

  function applyTheme() {
    var style = state.mapStyle || 'adventure';
    if (document.body) document.body.setAttribute('data-theme', style);
  }

  function applyMapStyle() {
    var style = state.mapStyle || 'adventure';
    applyTheme();
    var filter = MAP_STYLE_FILTERS[style] || MAP_STYLE_FILTERS.adventure;
    var container = document.getElementById('map-container');
    if (container) {
      container.className = 'map-container map-style-' + style;
    }
    if (state.map && state.map.getPanes) {
      var tilePane = state.map.getPanes().tilePane;
      if (tilePane) {
        tilePane.style.transition = 'filter 0.35s ease';
        tilePane.style.filter = filter;
      }
    }
    updateMarkerIcons();
    var sel = document.getElementById('map-style-select');
    if (sel) sel.value = style;
  }

  Sp.MAP_STYLE_FILTERS = MAP_STYLE_FILTERS;
  Sp.MAP_STYLE_ICONS = MAP_STYLE_ICONS;
  Sp.getDecorationIcons = getDecorationIcons;
  Sp.getStyleIcons = getStyleIcons;
  Sp.updateMarkerIcons = updateMarkerIcons;
  Sp.applyTheme = applyTheme;
  Sp.applyMapStyle = applyMapStyle;
})();
