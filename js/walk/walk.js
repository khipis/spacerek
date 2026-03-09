/**
 * Walk: geolocation, distance tracking, arrival, place reveal, Wikipedia.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var config = Sp.config;
  var $ = Sp.$;
  var show = Sp.show;
  var showScreen = Sp.showScreen;
  var haversine = Sp.haversine;
  var escapeHtml = Sp.escapeHtml;
  var fetchPlacesFromOverpass = Sp.fetchPlacesFromOverpass;
  var shuffleArray = Sp.shuffleArray;
  var loadLeaflet = Sp.loadLeaflet;
  var initMap = Sp.initMap;
  var addAllTargetMarkers = Sp.addAllTargetMarkers;
  var removeTargetMarkerAt = Sp.removeTargetMarkerAt;
  var addVisitedMarker = Sp.addVisitedMarker;
  var getTierFromDistanceMeters = Sp.getTierFromDistanceMeters;
  var XP_TIERS = Sp.XP_TIERS;
  var saveExperienceEntry = Sp.saveExperienceEntry;
  var fetchWikipediaCiekawostki = Sp.fetchWikipediaCiekawostki;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  function isInsecureContext() {
    if (typeof location === 'undefined') return false;
    if (location.protocol === 'file:') return true;
    if (location.protocol === 'http:' &&
      location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return true;
    return false;
  }

  function isIOS() {
    return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  }

  function setStatus(text, distanceText) {
    var st = $('status-text');
    var dt = $('distance-text');
    if (st) st.textContent = text;
    if (dt) dt.textContent = distanceText || '';
  }

  function updateDistanceHint() {
    var hint = $('hint-attraction-num');
    var distHint = $('hint-distance');
    if (!state.targetPlaces.length) return;
    var collected = Object.keys(state.collectedIndices).length;
    if (hint) hint.textContent = t('walk_hint_collected', { count: collected, total: state.targetPlaces.length });
    if (distHint && state.userPosition) {
      var nearest = Infinity;
      for (var i = 0; i < state.targetPlaces.length; i++) {
        if (state.collectedIndices[i]) continue;
        var d = haversine(state.userPosition.lat, state.userPosition.lng, state.targetPlaces[i].lat, state.targetPlaces[i].lng);
        if (d < nearest) nearest = d;
      }
      distHint.textContent = nearest === Infinity ? t('walk_hint_all_collected') : t('walk_hint_distance_to_goal', { m: Math.round(nearest) });
    }
  }

  function updateDebugPanel() {
    var panel = $('debug-panel-body');
    var summary = $('debug-summary');
    if (!panel || !summary) return;
    if (state.debugFoundPlaces.length === 0) {
      summary.textContent = t('debug_summary_empty');
      panel.innerHTML = '';
      return;
    }
    var n = state.targetPlaces.length;
    var collected = Object.keys(state.collectedIndices).length;
    summary.textContent = t('debug_summary_found', { n: state.debugFoundPlaces.length, m: n, c: collected });
    panel.innerHTML = '';
    var currentTarget = state.targetPlace;
    state.debugFoundPlaces.forEach(function (place, i) {
      var isCurrent = currentTarget && place.lat === currentTarget.lat && place.lon === currentTarget.lng;
      var row = document.createElement('div');
      row.className = 'debug-row' + (isCurrent ? ' debug-chosen' : '');
      row.innerHTML = '<span class="debug-num">' + (i + 1) + '.</span> ' +
        '<strong>' + escapeHtml(place.name) + '</strong> ' +
        '<span class="debug-type">(' + escapeHtml(place.type) + ')</span> ' +
        '<span class="debug-coords">' + place.lat.toFixed(5) + ', ' + place.lon.toFixed(5) + '</span>';
      panel.appendChild(row);
    });
  }

  function startWatching() {
    if (state.watchId != null) return;

    function checkDistances() {
      if (!state.userPosition || !state.targetPlaces.length) return;
      for (var i = 0; i < state.targetPlaces.length; i++) {
        if (state.collectedIndices[i]) continue;
        var place = state.targetPlaces[i];
        var dist = haversine(
          state.userPosition.lat,
          state.userPosition.lng,
          place.lat,
          place.lng
        );
        if (dist < config.ARRIVAL_METERS) {
          state.targetPlace = place;
          state.targetPlaceIndex = i;
          state.collectedIndices[i] = true;
          removeTargetMarkerAt(i);
          addVisitedMarker(place);
          navigator.geolocation.clearWatch(state.watchId);
          state.watchId = null;
          revealPlace();
          return;
        }
      }
      updateDistanceHint();
    }

    state.watchId = navigator.geolocation.watchPosition(
      function (pos) {
        state.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (state.userMarker) {
          state.userMarker.setLatLng([state.userPosition.lat, state.userPosition.lng]);
        }
        if (Sp.checkDecorationProximity) Sp.checkDecorationProximity(state.userPosition.lat, state.userPosition.lng);
        checkDistances();
      },
      function () {
        setStatus(t('status_position_error'), '');
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    updateDistanceHint();
  }

  function searchAndPickPlace() {
    show($('loading-place'), true);
    show($('walking-info'), false);
    setStatus(t('status_searching'), '');

    var radiusMeters = Math.round(state.selectedKm * 1000);
    var lat = state.userPosition.lat;
    var lng = state.userPosition.lng;
    var wanted = Math.min(state.numAttractions, 10);

    fetchPlacesFromOverpass(lat, lng, radiusMeters)
      .then(function (data) {
        var elements = data.elements || [];
        var withCoords = elements.filter(function (el) {
          return el.lat != null && el.lon != null && el.tags && el.tags.name;
        });
        if (withCoords.length === 0) {
          state.debugFoundPlaces = [];
          state.debugChosenIndex = -1;
          state.targetPlaces = [];
          updateDebugPanel();
          show($('loading-place'), false);
          setStatus(t('status_no_places'), '');
          return;
        }
        state.debugFoundPlaces = withCoords.map(function (el) {
          var tag = el.tags || {};
          return {
            name: tag.name || '(bez nazwy)',
            lat: el.lat,
            lon: el.lon,
            type: [tag.tourism, tag.amenity, tag.leisure, tag.historic].filter(Boolean).join(', ') || '–'
          };
        });
        var shuffled = shuffleArray(withCoords);
        var take = Math.min(wanted, shuffled.length);
        state.targetPlaces = shuffled.slice(0, take).map(function (el) {
          var tags = el.tags || {};
          return {
            lat: el.lat,
            lng: el.lon,
            name: tags.name || 'Miejsce',
            desc: [tags.tourism, tags.amenity, tags.leisure, tags.historic].filter(Boolean).join(' • ') || tags.addr_street || 'OpenStreetMap'
          };
        });
        state.targetPlaceIndex = 0;
        state.targetPlace = null;
        state.debugChosenIndex = withCoords.indexOf(shuffled[0]);
        updateDebugPanel();
        addAllTargetMarkers();
        updateDistanceHint();
        show($('loading-place'), false);
        show($('walking-info'), true);
        show($('map-style-bar'), true);
        show($('map-fab-buttons'), true);
        if (state.mapStyle === 'adventure' || state.mapStyle === 'cute') {
          show($('btn-go-to-decoration'), true);
        } else {
          show($('btn-go-to-decoration'), false);
        }
        setStatus(t('status_all_on_map'), '');
        show($('btn-experience-map'), true);
        startWatching();
      })
      .catch(function () {
        state.debugFoundPlaces = [];
        state.debugChosenIndex = -1;
        state.targetPlaces = [];
        updateDebugPanel();
        show($('loading-place'), false);
        setStatus(t('status_search_error'), '');
      });
  }

  function updateRevealButton() {
    var btn = $('btn-reveal-action');
    if (!btn) return;
    var total = (state.targetPlaces && state.targetPlaces.length) || 0;
    var collected = (state.collectedIndices && Object.keys(state.collectedIndices).length) || 0;
    if (total === 0 || collected < total) {
      btn.textContent = t('reveal_btn_back');
    } else {
      btn.textContent = t('reveal_btn_end');
    }
  }

  function backToMap() {
    var ro = document.getElementById('reveal-overlay');
    if (ro) {
      ro.classList.add('hidden');
      ro.style.display = 'none';
      ro.style.visibility = 'hidden';
    }
    state.targetPlace = null;
    updateDebugPanel();
    updateDistanceHint();
    show($('walking-info'), true);
    show($('map-style-bar'), true);
    show($('map-fab-buttons'), true);
    if (state.mapStyle === 'adventure' || state.mapStyle === 'cute') show($('btn-go-to-decoration'), true);
    setStatus(t('status_go_to_next'), '');
    startWatching();
  }

  function revealPlace() {
    if (!state.targetPlace) return;
    show($('map-fab-buttons'), false);
    show($('map-style-bar'), false);
    if (state.map && state.map.panTo) {
      try {
        state.map.panTo([state.targetPlace.lat, state.targetPlace.lng]);
      } catch (e) { console.error('revealPlace panTo', e); }
    }

    var arrivalEl = document.getElementById('arrival-overlay');
    var revealEl = document.getElementById('reveal-overlay');
    if (revealEl) {
      revealEl.classList.add('hidden');
      revealEl.style.display = 'none';
      revealEl.style.visibility = 'hidden';
    }
    if (arrivalEl) {
      arrivalEl.classList.remove('hidden');
      arrivalEl.style.display = 'flex';
      arrivalEl.style.visibility = 'visible';
      arrivalEl.style.zIndex = '99999';
    }

    var nameEl = document.getElementById('reveal-name');
    var descEl = document.getElementById('reveal-desc');
    var photoEl = document.getElementById('reveal-photo');
    var ciekawostkiEl = document.getElementById('reveal-ciekawostki');
    var funfactEl = document.getElementById('reveal-funfact');
    if (nameEl) nameEl.textContent = state.targetPlace.name || '';
    if (descEl) descEl.textContent = state.targetPlace.desc || t('reveal_desc_placeholder');
    if (photoEl) {
      photoEl.innerHTML = '';
      photoEl.classList.add('no-photo');
    }
    if (ciekawostkiEl) { ciekawostkiEl.classList.add('hidden'); }

    updateRevealButton();

    try {
      var distanceM = state.userPosition ? haversine(state.userPosition.lat, state.userPosition.lng, state.targetPlace.lat, state.targetPlace.lng) : 0;
      var tier = (typeof getTierFromDistanceMeters === 'function') ? getTierFromDistanceMeters(distanceM) : 'casual';
      var xpConfig = (XP_TIERS && XP_TIERS[tier]) ? XP_TIERS[tier] : (XP_TIERS && XP_TIERS.casual) || { xp: 10 };
      if (typeof saveExperienceEntry === 'function') saveExperienceEntry(state.targetPlace, tier, xpConfig);
    } catch (e) { console.error('revealPlace save XP', e); }

    function showCiekawostki(extract, imgUrl) {
      if (imgUrl && photoEl) {
        photoEl.classList.remove('no-photo');
        photoEl.innerHTML = '<img src="' + String(imgUrl).replace(/^http:/, 'https:') + '" alt="" loading="lazy" />';
      }
      if (extract && funfactEl && ciekawostkiEl) {
        funfactEl.textContent = extract;
        ciekawostkiEl.classList.remove('hidden');
      }
    }

    if (typeof fetchWikipediaCiekawostki === 'function') {
      try {
        fetchWikipediaCiekawostki(state.targetPlace.lat, state.targetPlace.lng, state.targetPlace.name, showCiekawostki);
      } catch (e) { console.error('revealPlace wiki', e); }
    }

    setTimeout(function () {
      var a = document.getElementById('arrival-overlay');
      var r = document.getElementById('reveal-overlay');
      if (a) {
        a.classList.add('hidden');
        a.style.display = 'none';
        a.style.visibility = 'hidden';
      }
      if (r) {
        r.classList.remove('hidden');
        r.style.display = 'flex';
        r.style.visibility = 'visible';
        r.style.zIndex = '100000';
        r.style.pointerEvents = 'auto';
      }
    }, 1400);
  }

  function resetWalk() {
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    state.targetPlace = null;
    state.targetPlaces = [];
    state.targetPlaceIndex = 0;
    state.collectedIndices = {};
    state.userPosition = null;
    state.targetMarkers.forEach(function (m) {
      if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.targetMarkers = [];
    state.visitedMarkers.forEach(function (m) {
      if (state.map && state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.visitedMarkers = [];
    if (Sp.clearDecorationMarkers) Sp.clearDecorationMarkers();
    if (state.map) {
      try {
        state.map.remove();
      } catch (e) {}
      state.map = null;
      state.userMarker = null;
    }
    state.targetMarkers = [];
    state.visitedMarkers = [];
    state.decorationMarkers = [];
    var ro = document.getElementById('reveal-overlay');
    var ao = document.getElementById('arrival-overlay');
    var mo = document.getElementById('monster-encounter-overlay');
    var no = document.getElementById('npc-encounter-overlay');
    if (ro) { ro.classList.add('hidden'); ro.style.display = 'none'; ro.style.visibility = 'hidden'; }
    if (ao) { ao.classList.add('hidden'); ao.style.display = 'none'; ao.style.visibility = 'hidden'; }
    if (mo) { mo.classList.add('hidden'); mo.style.display = 'none'; }
    if (no) { no.classList.add('hidden'); no.style.display = 'none'; }
    show($('loading-place'), false);
    show($('walking-info'), false);
    show($('map-style-bar'), false);
    show($('map-fab-buttons'), false);
    show($('btn-experience-map'), false);
    state.debugFoundPlaces = [];
    state.debugChosenIndex = -1;
    updateDebugPanel();
    showScreen('screen-start');
    setStatus('', '');
    document.querySelectorAll('.btn-distance').forEach(function (b) {
      b.classList.remove('selected');
      if (parseFloat(b.getAttribute('data-km')) === 1.9) b.classList.add('selected');
    });
    var numInput = document.getElementById('num-attractions');
    var numValue = document.getElementById('num-attractions-value');
    if (numInput && numValue) {
      numInput.value = state.numAttractions;
      numValue.textContent = state.numAttractions;
    }
    $('btn-start').disabled = false;
    state.selectedKm = 1.9;
  }

  function startWalk() {
    var selectedStyleBtn = document.querySelector('.btn-map-style.selected');
    if (selectedStyleBtn) {
      state.mapStyle = selectedStyleBtn.getAttribute('data-style') || state.mapStyle;
      if (typeof Sp.setStoredTheme === 'function') Sp.setStoredTheme(state.mapStyle);
    }
    if (!navigator.geolocation) {
      setStatus(t('status_no_geolocation'), '');
      return;
    }
    if (isInsecureContext() && isIOS()) {
      setStatus(t('ios_https_hint'), '');
      return;
    }

    var onIOS = isIOS();
    setStatus(t(onIOS ? 'status_getting_location_ios' : 'status_getting_location'), '');
    var timeoutMs = (onIOS ? 25 : 10) * 1000;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        state.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        showScreen('screen-walk');
        initMapAndSearch();
      },
      function (err) {
        var msg;
        if (isInsecureContext() && onIOS) {
          msg = t('ios_https_hint');
        } else if (onIOS && err && err.code === 1) {
          msg = t('ios_location_denied');
        } else if (onIOS && err && err.code === 3) {
          msg = t('ios_location_timeout');
        } else {
          msg = (err && err.code === 1) ? t('status_location_denied') : t('status_location_error');
        }
        setStatus(msg, '');
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  }

  function initMapAndSearch() {
    loadLeaflet()
      .then(function () {
        initMap();
        searchAndPickPlace();
      })
      .catch(function (err) {
        var msg = err && err.message === 'MAP_LOAD_TIMEOUT'
          ? t('safari_use_server')
          : (t('status_map_load_error') || err.message);
        setStatus(msg, '');
      });
  }

  function safeEscapeHtml(s) {
    if (s == null) return '';
    if (typeof escapeHtml === 'function') return escapeHtml(String(s));
    var div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function showWalkStats() {
    var listEl = document.getElementById('stats-list');
    var overlay = document.getElementById('stats-overlay');
    if (!listEl || !overlay) return;
    var ro = document.getElementById('reveal-overlay');
    var ao = document.getElementById('arrival-overlay');
    if (ro) {
      ro.classList.add('hidden');
      ro.style.display = 'none';
      ro.style.visibility = 'hidden';
    }
    if (ao) {
      ao.classList.add('hidden');
      ao.style.display = 'none';
      ao.style.visibility = 'hidden';
    }
    var placesCount = state.visitedMarkers ? state.visitedMarkers.length : 0;
    var stats = state.stats || {};
    var monstersMet = stats.monstersMet != null ? stats.monstersMet : (state.metMonsterNames || []).length;
    var carrotsCollected = stats.carrotsCollected != null ? stats.carrotsCollected : (state.metCarrotNames || []).length;
    var animalsMet = stats.animalsMet != null ? stats.animalsMet : (state.metAnimalNames || []).length;
    var style = state.mapStyle || 'adventure';
    listEl.innerHTML = '';
    function addStatRow(icon, label, value) {
      var li = document.createElement('li');
      li.className = 'stats-row';
      li.innerHTML = '<span class="stats-row-icon">' + icon + '</span><span class="stats-label">' + label + '</span><span class="stats-value">' + value + '</span>';
      listEl.appendChild(li);
    }
    var summaryTitle = document.createElement('h3');
    summaryTitle.className = 'stats-section-title';
    summaryTitle.textContent = t('stats_summary');
    listEl.appendChild(summaryTitle);
    function addNamesList(names, className) {
      if (!names || !names.length) return;
      var ul = document.createElement('ul');
      ul.className = className || 'stats-names-list';
      names.forEach(function (name) {
        var item = document.createElement('li');
        item.className = 'stats-name-item';
        item.textContent = name;
        ul.appendChild(item);
      });
      listEl.appendChild(ul);
    }
    addStatRow('📍', t('stats_places'), placesCount);
    if (style === 'adventure') {
      addStatRow('👹', t('stats_monsters'), monstersMet);
      addNamesList(state.metMonsterNames || [], 'stats-names-list');
      var npcsMet = (state.stats && state.stats.npcsMet != null) ? state.stats.npcsMet : (state.metNpcNames || []).length;
      addStatRow('👤', t('stats_npcs'), npcsMet);
      addNamesList(state.metNpcNames || [], 'stats-names-list');
      addStatRow('🏺', t('stats_artifacts'), (state.artifactsFound && state.artifactsFound.length) || 0);
      addNamesList(state.artifactsFound || [], 'stats-names-list');
      addStatRow('🩹', t('stats_wounds'), state.wounds || 0);
    }
    if (style === 'cute') {
      addStatRow('🥕', t('stats_carrots'), carrotsCollected);
      addStatRow('🐾', t('stats_animals'), animalsMet);
      addNamesList(state.metAnimalNames || [], 'stats-names-list');
    }
    if (state.visitedMarkers && state.visitedMarkers.length > 0) {
      var listTitle = document.createElement('h3');
      listTitle.className = 'stats-section-title stats-section-title-list';
      listTitle.textContent = t('stats_discovered_list');
      listEl.appendChild(listTitle);
      var placesList = document.createElement('ul');
      placesList.className = 'stats-places-list';
      state.visitedMarkers.forEach(function (m) {
        var name = (m._placeName != null) ? m._placeName : '';
        if (!name) return;
        var item = document.createElement('li');
        item.className = 'stats-place-item';
        item.innerHTML = '<span class="stats-place-icon">✨</span><span class="stats-place-name">' + safeEscapeHtml(name) + '</span>';
        placesList.appendChild(item);
      });
      listEl.appendChild(placesList);
    }
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.zIndex = '100000';
    overlay.style.pointerEvents = 'auto';
  }

  Sp.setStatus = setStatus;
  Sp.updateDistanceHint = updateDistanceHint;
  Sp.updateDebugPanel = updateDebugPanel;
  Sp.updateRevealButton = updateRevealButton;
  Sp.backToMap = backToMap;
  Sp.revealPlace = revealPlace;
  Sp.resetWalk = resetWalk;
  Sp.showWalkStats = showWalkStats;
  Sp.startWalk = startWalk;
  Sp.initMapAndSearch = initMapAndSearch;
})();
