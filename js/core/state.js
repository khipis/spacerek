/**
 * App state and DOM/geo helper functions.
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.state = {
    selectedKm: 1.9,
    numAttractions: 5,
    userPosition: null,
    targetPlace: null,
    targetPlaces: [],
    targetPlaceIndex: 0,
    targetMarkers: [],
    visitedMarkers: [],
    decorationMarkers: [],
    collectedIndices: {},
    map: null,
    userMarker: null,
    watchId: null,
    debugFoundPlaces: [],
    debugChosenIndex: -1,
    mapStyle: 'adventure',
    stats: { monstersMet: 0, carrotsCollected: 0, animalsMet: 0, npcsMet: 0 },
    metDecorationIndices: {},
    metMonsterNames: [],
    metAnimalNames: [],
    metCarrotNames: [],
    metNpcNames: [],
    selectedDecorationIndex: null,
    artifactsFound: [],
    wounds: 0,
    pendingMonsterIndex: null,
    pendingMonsterMarker: null,
    pendingNpcIndex: null,
    pendingNpcMarker: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function show(el, visible) {
    if (!el) return;
    if (visible) {
      el.classList.remove('hidden');
      var d = el.getAttribute('data-display');
      el.style.display = d ? d : (el.tagName === 'SECTION' ? 'flex' : '');
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.remove('active');
    });
    var el = $(screenId);
    if (el) el.classList.add('active');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function getCurrentMode() {
    var state = window.Spacerek.state;
    var style = state.mapStyle || 'adventure';
    if (style === 'adventure') return 'przygoda';
    if (style === 'cute') return 'cute';
    return 'spacerek';
  }

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container || !message) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'wound' ? ' toast-wound' : '');
    el.setAttribute('role', 'status');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 300);
    }, 3200);
  }

  window.Spacerek.$ = $;
  window.Spacerek.show = show;
  window.Spacerek.showScreen = showScreen;
  window.Spacerek.escapeHtml = escapeHtml;
  window.Spacerek.haversine = haversine;
  window.Spacerek.getCurrentMode = getCurrentMode;
  window.Spacerek.showToast = showToast;
})();
