/**
 * Mapa Leaflet: inicjalizacja, warstwa kafelków, markery użytkownika i miejsc.
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

  function addDecorationMarkers(style, bounds) {
    var icons = getDecorationIcons(style);
    if (!icons.length || !state.map || !bounds) return;
    var L = window.L;
    var south = bounds.getSouth();
    var north = bounds.getNorth();
    var west = bounds.getWest();
    var east = bounds.getEast();
    state.decorationMarkers = [];
    icons.forEach(function (char) {
      var lat = south + Math.random() * (north - south);
      var lng = west + Math.random() * (east - west);
      var icon = L.divIcon({
        className: 'decoration-marker',
        html: '<span class="decoration-marker-pin">' + char + '</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });
      var marker = L.marker([lat, lng], { icon: icon }).addTo(state.map);
      marker._decorationChar = char;
      state.decorationMarkers.push(marker);
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
})();
