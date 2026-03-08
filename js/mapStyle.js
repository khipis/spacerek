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
    stroll: 'hue-rotate(-75deg) saturate(1.6) contrast(1.05) brightness(1.02)'
  };

  var MAP_STYLE_ICONS = {
    adventure: { user: '🧝‍♂️', attraction: '?', visited: '✔' },
    stroll: { user: '🐰', attraction: '❤️', visited: '💜' }
  };

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
      el.textContent = icons.attraction;
    });
    container.querySelectorAll('.visited-marker-pin').forEach(function (el) {
      el.textContent = icons.visited;
    });
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
  Sp.getStyleIcons = getStyleIcons;
  Sp.updateMarkerIcons = updateMarkerIcons;
  Sp.applyTheme = applyTheme;
  Sp.applyMapStyle = applyMapStyle;
})();
