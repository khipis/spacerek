/**
 * Leaflet map: init, tile layer, user and place markers.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var haversine = Sp.haversine;
  var getStyleIcons = Sp.getStyleIcons;
  var getStoredCharacter = Sp.getStoredCharacter;
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

    var style = state.mapStyle || 'adventure';
    var char = (style === 'adventure' || style === 'cute') && getStoredCharacter && getStoredCharacter(style);
    var userIconChar = (char && char.emoji) ? char.emoji : getStyleIcons(style).user;
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

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  /** Returns up to `count` unique names (no repeats), shuffled. */
  function getUniqueNames(type, lang, count) {
    var names = (window.Spacerek && window.Spacerek.decorationNames) || {};
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var list = type === 'monster' ? (names.monsters && names.monsters[langKey]) : (names.animals && names.animals[langKey]);
    if (!list || !list.length) return [];
    return shuffleArray(list).slice(0, Math.min(count, list.length));
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
    var monsterCount = icons.filter(function (item) { return (item.type || 'monster') === 'monster'; }).length;
    var animalCount = icons.filter(function (item) { return (item.type || '') === 'animal'; }).length;
    var monsterNames = getUniqueNames('monster', lang, monsterCount);
    var animalNames = getUniqueNames('animal', lang, animalCount);
    var monsterIdx = 0;
    var animalIdx = 0;
    icons.forEach(function (item, i) {
      var char = item.char || item;
      var type = item.type || 'monster';
      var name;
      if (type === 'carrot') {
        name = t('carrot_name');
      } else if (type === 'monster') {
        name = monsterNames[monsterIdx++] || '?';
      } else if (type === 'chest') {
        name = t('chest_tooltip');
      } else {
        name = animalNames[animalIdx++] || '…';
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
      marker.on('click', function () {
        state.selectedDecorationIndex = i;
        state.decorationMarkers.forEach(function (m, j) {
          var el = m.getElement && m.getElement();
          if (el) el.classList.toggle('decoration-marker-selected', j === i);
        });
      });
      state.decorationMarkers.push(marker);
    });
  }

  function updateDecorationSelectionVisual() {
    if (!state.decorationMarkers) return;
    state.decorationMarkers.forEach(function (m, j) {
      var el = m.getElement && m.getElement();
      if (el) el.classList.toggle('decoration-marker-selected', j === state.selectedDecorationIndex);
    });
  }

  function clearDecorationSelection() {
    state.selectedDecorationIndex = null;
    updateDecorationSelectionVisual();
  }

  function getNearestUnmetDecoration() {
    if (!state.decorationMarkers || !state.decorationMarkers.length || !state.userPosition) return null;
    var best = null;
    var bestDist = Infinity;
    state.decorationMarkers.forEach(function (m, i) {
      if (state.metDecorationIndices[i]) return;
      var pos = m.getLatLng && m.getLatLng();
      if (!pos) return;
      var d = haversine(state.userPosition.lat, state.userPosition.lng, pos.lat, pos.lng);
      if (d < bestDist) {
        bestDist = d;
        best = { marker: m, index: i };
      }
    });
    return best;
  }

  function goToDecoration(index) {
    if (!state.decorationMarkers || !state.decorationMarkers[index]) return;
    if (state.metDecorationIndices[index]) return;
    var m = state.decorationMarkers[index];
    var pos = m.getLatLng && m.getLatLng();
    if (!pos) return;
    function onReached() {
      checkDecorationProximity(pos.lat, pos.lng);
      state.selectedDecorationIndex = null;
      updateDecorationSelectionVisual();
    }
    if (typeof Sp.animateWalkToPoint === 'function' && state.userPosition) {
      Sp.animateWalkToPoint(pos.lat, pos.lng, onReached);
    } else {
      state.userPosition = { lat: pos.lat, lng: pos.lng };
      if (state.userMarker) state.userMarker.setLatLng([pos.lat, pos.lng]);
      if (state.map) state.map.panTo([pos.lat, pos.lng]);
      onReached();
    }
  }

  function showChestResultToast(outcome, data) {
    if (!Sp.showToast) return;
    if (outcome === 'artifact') {
      Sp.showToast('🏺 ' + t('chest_result_artifact_title') + ' ' + (data || t('chest_artifact_unknown')));
    } else if (outcome === 'xp') {
      var xp = data != null ? data : 15;
      Sp.showToast('✨ ' + t('chest_result_xp_title') + ' +' + xp + ' XP');
    } else {
      Sp.showToast('🩹 ' + t('chest_result_wound_title'), 'wound');
    }
  }

  function resolveChest() {
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var roll = 1 + Math.floor(Math.random() * 3);
    var saveDecorationEntry = Sp.saveDecorationEntry;
    if (roll === 1) {
      var names = (window.Spacerek && window.Spacerek.decorationNames) || {};
      var list = names.artifacts && names.artifacts[langKey];
      var artifactName = (list && list.length) ? list[Math.floor(Math.random() * list.length)] : t('chest_artifact_unknown');
      state.artifactsFound.push(artifactName);
      if (saveDecorationEntry) saveDecorationEntry('artifact', artifactName, 15);
      showChestResultToast('artifact', artifactName);
    } else if (roll === 2) {
      var xp = 15;
      if (saveDecorationEntry) saveDecorationEntry('chest_xp', t('chest_xp_label'), xp);
      showChestResultToast('xp', xp);
    } else {
      state.wounds += 1;
      if (saveDecorationEntry) saveDecorationEntry('wound', t('chest_wound_label'), 0);
      showChestResultToast('wound');
    }
    if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
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
      if (type === 'chest') {
        resolveChest();
        if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
        return;
      }
      if (type === 'monster') {
        state.stats.monstersMet += 1;
        state.metMonsterNames.push(name);
      } else if (type === 'carrot') {
        state.stats.carrotsCollected += 1;
        state.metCarrotNames.push(name);
        var spoiledChance = (config && config.CARROT_SPOILED_CHANCE) != null ? config.CARROT_SPOILED_CHANCE : 0.12;
        var spoiledXp = (config && config.CARROT_SPOILED_XP) != null ? config.CARROT_SPOILED_XP : -3;
        if (Math.random() < spoiledChance) {
          if (saveDecorationEntry) saveDecorationEntry('spoiled_carrot', name, spoiledXp);
          if (Sp.showToast) Sp.showToast('🥕 ' + (name || t('carrot_spoiled_label')) + ' ' + spoiledXp + ' XP', 'wound');
        } else {
          if (saveDecorationEntry) saveDecorationEntry(type, name);
          if (Sp.showToast) Sp.showToast('🥕 ' + (name || t('carrot_name')) + ' +5 XP');
        }
        if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
        return;
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
    state.selectedDecorationIndex = null;
    state.stats = { monstersMet: 0, carrotsCollected: 0, animalsMet: 0 };
    state.metDecorationIndices = {};
    state.metMonsterNames = [];
    state.metAnimalNames = [];
    state.metCarrotNames = [];
    state.artifactsFound = [];
    state.wounds = 0;

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
  Sp.getNearestUnmetDecoration = getNearestUnmetDecoration;
  Sp.goToDecoration = goToDecoration;
  Sp.clearDecorationSelection = clearDecorationSelection;
  Sp.updateDecorationSelectionVisual = updateDecorationSelectionVisual;
})();
