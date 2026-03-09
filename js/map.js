/**
 * Leaflet map: init, tile layer, user and place markers.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var haversine = Sp.haversine;
  var getStyleIcons = Sp.getStyleIcons;
  var applyMapStyle = Sp.applyMapStyle;
  var getTierFromDistanceMeters = Sp.getTierFromDistanceMeters;
  var getDecorationIcons = Sp.getDecorationIcons;
  var config = Sp.config;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  function loadLeaflet() {
    return new Promise(function (resolve, reject) {
      if (window.L) {
        resolve();
        return;
      }
      var timeout = 12e3;
      var deadline = Date.now() + timeout;
      var check = setInterval(function () {
        if (window.L) {
          clearInterval(check);
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          clearInterval(check);
          reject(new Error('MAP_LOAD_TIMEOUT'));
        }
      }, 80);
    });
  }

  function initMap() {
    var center = state.userPosition;
    if (!center) return;

    var L = window.L;
    if (state.map) {
      try {
        state.map.remove();
      } catch (e) {}
      state.map = null;
      state.userMarker = null;
    }
    state.map = L.map('map-container').setView([center.lat, center.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(state.map);

    applyMapStyle();
    var styleSelect = document.getElementById('map-style-select');
    if (styleSelect) {
      styleSelect.value = state.mapStyle || 'adventure';
    }

    var userIconChar = getStyleIcons(state.mapStyle || 'adventure').user;
    var userTitle = t('tooltip_you_short').replace(/"/g, '&quot;');
    var userIcon = L.divIcon({
      className: 'user-marker',
      html: '<span class="user-marker-fun" title="' + userTitle + '">' + userIconChar + '</span>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    state.userMarker = L.marker([center.lat, center.lng], { icon: userIcon }).addTo(state.map);
    state.userMarker.bindTooltip(t('tooltip_you'), { permanent: false });
  }

  function clearDecorationMarkers() {
    if (!state.decorationMarkers) return;
    state.decorationMarkers.forEach(function (m) {
      if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.decorationMarkers = [];
  }

  function pickRandomName(type, lang) {
    var names = (window.Spacerek && window.Spacerek.decorationNames) || {};
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var list = type === 'monster' ? (names.monsters && names.monsters[langKey]) : (names.animals && names.animals[langKey]);
    if (!list || !list.length) return type === 'monster' ? '?' : '…';
    return list[Math.floor(Math.random() * list.length)];
  }

  function addDecorationMarkers(style, bounds) {
    var icons = getDecorationIcons(style);
    if (!icons.length || !state.map || !bounds) return;
    var L = window.L;
    var south = bounds.getSouth();
    var north = bounds.getNorth();
    var west = bounds.getWest();
    var east = bounds.getEast();
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    state.decorationMarkers = [];
    icons.forEach(function (item, i) {
      var char = item.char || item;
      var type = item.type || 'monster';
      var name;
      if (type === 'carrot') {
        name = t('carrot_name');
      } else if (type === 'monster') {
        name = pickRandomName('monster', lang);
      } else {
        name = pickRandomName('animal', lang);
      }
      var lat = south + Math.random() * (north - south);
      var lng = west + Math.random() * (east - west);
      var icon = L.divIcon({
        className: 'decoration-marker',
        html: '<span class="decoration-marker-pin">' + char + '</span>',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
      var marker = L.marker([lat, lng], { icon: icon }).addTo(state.map);
      marker._decorationChar = char;
      marker._decorationIndex = i;
      marker._decorationType = type;
      marker._decorationName = name;
      marker.bindTooltip(name, { permanent: false });
      state.decorationMarkers.push(marker);
    });
  }

  function checkDecorationProximity(lat, lng) {
    if (!state.decorationMarkers || !state.decorationMarkers.length) return;
    var radius = (config && config.DECORATION_PROXIMITY_METERS) || 35;
    var saveDecorationEntry = Sp.saveDecorationEntry;
    state.decorationMarkers.forEach(function (m, i) {
      if (state.metDecorationIndices[i]) return;
      var pos = m.getLatLng && m.getLatLng();
      if (!pos) return;
      var dist = haversine(lat, lng, pos.lat, pos.lng);
      if (dist > radius) return;
      state.metDecorationIndices[i] = true;
      var type = m._decorationType || 'monster';
      var name = m._decorationName || (type === 'carrot' ? t('carrot_name') : '?');
      if (type === 'monster') {
        state.stats.monstersMet += 1;
        state.metMonsterNames.push(name);
      } else if (type === 'carrot') {
        state.stats.carrotsCollected += 1;
        state.metCarrotNames.push(name);
      } else if (type === 'animal') {
        state.stats.animalsMet += 1;
        state.metAnimalNames.push(name);
      }
      if (saveDecorationEntry) saveDecorationEntry(type, name);
      if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
    });
  }

  function addAllTargetMarkers() {
    if (!state.map || !state.targetPlaces.length) return;
    var L = window.L;
    state.targetMarkers.forEach(function (m) {
      if (state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.targetMarkers = [];
    state.collectedIndices = {};
    state.visitedMarkers.forEach(function (m) {
      if (state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.visitedMarkers = [];
    clearDecorationMarkers();
    state.stats = { monstersMet: 0, carrotsCollected: 0, animalsMet: 0 };
    state.metDecorationIndices = {};
    state.metMonsterNames = [];
    state.metAnimalNames = [];
    state.metCarrotNames = [];

    var style = state.mapStyle || 'adventure';
    var attractionChar = getStyleIcons(style).attraction || '?';
    state.targetPlaces.forEach(function (place, i) {
      var num = i + 1;
      var distM = state.userPosition ? haversine(state.userPosition.lat, state.userPosition.lng, place.lat, place.lng) : 0;
      var tier = getTierFromDistanceMeters(distM);
      var icon = L.divIcon({
        className: 'attraction-marker',
        html: '<span class="attraction-marker-pin" data-num="' + num + '">' + attractionChar + '</span>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      var marker = L.marker([place.lat, place.lng], { icon: icon }).addTo(state.map);
      marker._placeIndex = i;
      marker._tier = tier;
      marker.bindTooltip(t('tier_' + tier), { permanent: false });
      state.targetMarkers.push(marker);
    });

    var bounds = L.latLngBounds(
      [state.userPosition.lat, state.userPosition.lng],
      state.targetPlaces[0] ? [state.targetPlaces[0].lat, state.targetPlaces[0].lng] : [state.userPosition.lat, state.userPosition.lng]
    );
    state.targetPlaces.forEach(function (p) {
      bounds.extend([p.lat, p.lng]);
    });
    state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    addDecorationMarkers(style, bounds);
  }

  function removeTargetMarkerAt(index) {
    var m = state.targetMarkers[index];
    if (m && state.map && state.map.hasLayer(m)) {
      state.map.removeLayer(m);
    }
  }

  function addVisitedMarker(place) {
    if (!state.map || !place) return;
    var L = window.L;
    var visitedChar = getStyleIcons(state.mapStyle || 'adventure').visited;
    var icon = L.divIcon({
      className: 'visited-marker',
      html: '<span class="visited-marker-pin">' + visitedChar + '</span>',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
    var marker = L.marker([place.lat, place.lng], { icon: icon }).addTo(state.map);
    marker._placeName = place.name;
    marker.bindTooltip(place.name + t('tooltip_visited'), { permanent: false });
    state.visitedMarkers.push(marker);
  }

  Sp.loadLeaflet = loadLeaflet;
  Sp.initMap = initMap;
  Sp.addAllTargetMarkers = addAllTargetMarkers;
  Sp.removeTargetMarkerAt = removeTargetMarkerAt;
  Sp.addVisitedMarker = addVisitedMarker;
  Sp.clearDecorationMarkers = clearDecorationMarkers;
  Sp.checkDecorationProximity = checkDecorationProximity;
})();
