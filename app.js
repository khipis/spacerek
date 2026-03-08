(function () {
  'use strict';

  var OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  var ARRIVAL_METERS = 50;
  var STORAGE_KEY = 'spacerek_experience';
  var STORAGE_KEY_THEME = 'spacerek_theme';

  function getStoredTheme() {
    try {
      var s = localStorage.getItem(STORAGE_KEY_THEME);
      return (s === 'vaporwave' || s === 'noir') ? s : 'noir';
    } catch (e) { return 'noir'; }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {}
  }

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  function applyLocale() {
    var lang = window.CURRENT_LOCALE || 'pl';
    document.documentElement.lang = lang === 'en' ? 'en' : 'pl';
    if (document.title !== undefined) document.title = t('app_title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });
    refreshDynamicLabels();
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
    if (typeof updateDistanceHint === 'function') updateDistanceHint();
    if (typeof updateDebugPanel === 'function') updateDebugPanel();
    if (typeof updateRevealButton === 'function') updateRevealButton();
    if (typeof renderExperiencePanel === 'function') renderExperiencePanel();
  }

  var XP_TIERS = {
    casual: { xp: 10, label: 'Casual' },
    epic: { xp: 50, label: 'Epic' },
    legendary: { xp: 100, label: 'Legendary' }
  };

  /** Tier na podstawie wybranego zasięgu (np. do wyświetlania prognozy). */
  function getTierFromKm(km) {
    if (km <= 1) return 'casual';
    if (km <= 2) return 'epic';
    return 'legendary';
  }

  /** Tier na podstawie rzeczywistej odległości do miejsca (w metrach) – im dalej, tym wyższy tier. */
  function getTierFromDistanceMeters(meters) {
    var km = meters / 1000;
    if (km <= 0.6) return 'casual';
    if (km <= 1.5) return 'epic';
    return 'legendary';
  }

  function getExperience() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveExperienceEntry(place, tier) {
    var list = getExperience();
    var config = XP_TIERS[tier] || XP_TIERS.casual;
    list.push({
      name: place.name,
      desc: place.desc || '',
      lat: place.lat,
      lng: place.lng,
      tier: tier,
      xp: config.xp,
      collectedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      renderExperiencePanel();
    } catch (e) {}
  }

  function totalXpFromExperience(list) {
    return list.reduce(function (sum, e) { return sum + (e.xp || 0); }, 0);
  }

  function levelFromXp(xp) {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    return 5;
  }

  function renderExperiencePanel() {
    var list = getExperience();
    var totalXp = totalXpFromExperience(list);
    var level = levelFromXp(totalXp);
    var totalEl = $('experience-total-xp');
    var levelEl = $('experience-level-num');
    var listEl = $('experience-list');
    if (totalEl) totalEl.textContent = totalXp;
    if (levelEl) levelEl.textContent = level;
    if (!listEl) return;
    listEl.innerHTML = '';
    list.slice().reverse().forEach(function (entry) {
      var li = document.createElement('li');
      var tierClass = 'exp-tier-' + (entry.tier || 'casual');
      li.innerHTML =
        '<span class="exp-place-name">' + escapeHtml(entry.name) + '</span>' +
        '<span class="exp-tier ' + tierClass + '">' + t('tier_' + (entry.tier || 'casual')) + '</span>' +
        '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span>';
      listEl.appendChild(li);
    });
    if (list.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'exp-empty';
      empty.textContent = t('experience_empty');
      listEl.appendChild(empty);
    }
  }

  function openExperiencePanel() {
    renderExperiencePanel();
    show($('experience-overlay'), true);
  }

  function closeExperiencePanel() {
    show($('experience-overlay'), false);
  }

  var MAP_STYLE_FILTERS = {
    noir: 'grayscale(1) contrast(1.35) brightness(0.9)',
    vaporwave: 'hue-rotate(-75deg) saturate(1.6) contrast(1.05) brightness(1.02)'
  };

  var MAP_STYLE_ICONS = {
    noir: { user: '🦇', attraction: '?', visited: '✔' },
    vaporwave: { user: '🐰', attraction: '❤️', visited: '💜' }
  };

  var state = {
    selectedKm: 1.9,
    numAttractions: 5,
    userPosition: null,
    targetPlace: null,
    targetPlaces: [],
    targetPlaceIndex: 0,
    targetMarkers: [],
    visitedMarkers: [],
    collectedIndices: {},
    map: null,
    userMarker: null,
    watchId: null,
    debugFoundPlaces: [],
    debugChosenIndex: -1,
    mapStyle: getStoredTheme()
  };

  function $(id) {
    return document.getElementById(id);
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.remove('active');
    });
    var el = $(screenId);
    if (el) el.classList.add('active');
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

  function getStyleIcons(style) {
    return MAP_STYLE_ICONS[style] || MAP_STYLE_ICONS.noir;
  }

  function updateMarkerIcons() {
    var style = state.mapStyle || 'noir';
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
    var style = state.mapStyle || 'noir';
    if (document.body) document.body.setAttribute('data-theme', style);
  }

  function applyMapStyle() {
    var style = state.mapStyle || 'noir';
    applyTheme();
    var filter = MAP_STYLE_FILTERS[style] || MAP_STYLE_FILTERS.noir;
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

  function loadLeaflet() {
    return new Promise(function (resolve) {
      if (window.L) {
        resolve();
        return;
      }
      var check = setInterval(function () {
        if (window.L) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
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
      btnStart.disabled = false;
    }

    var styleButtons = document.querySelectorAll('.btn-map-style');
    function updateMapStyleSelection() {
      styleButtons.forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-style') === state.mapStyle);
      });
    }
    styleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mapStyle = btn.getAttribute('data-style') || 'noir';
        setStoredTheme(state.mapStyle);
        updateMapStyleSelection();
        applyTheme();
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
      if (state.selectedKm == null) return;
      startWalk();
    });
  }

  function setStatus(text, distanceText) {
    var st = $('status-text');
    var dt = $('distance-text');
    if (st) st.textContent = text;
    if (dt) dt.textContent = distanceText || '';
  }

  function startWalk() {
    setStatus(t('status_getting_location'), '');
    if (!navigator.geolocation) {
      setStatus(t('status_no_geolocation'), '');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        state.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        showScreen('screen-walk');
        initMapAndSearch();
      },
      function (err) {
        var msg = err.code === 1 ? t('status_location_denied') : t('status_location_error');
        setStatus(msg, '');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function initMapAndSearch() {
    loadLeaflet()
      .then(function () {
        initMap();
        searchAndPickPlace();
      })
      .catch(function (err) {
        setStatus(err.message || t('status_map_load_error'), '');
      });
  }

  function initMap() {
    var center = state.userPosition;
    if (!center) return;

    state.map = L.map('map-container').setView([center.lat, center.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(state.map);

    applyMapStyle();
    var styleSelect = document.getElementById('map-style-select');
    if (styleSelect) {
      styleSelect.value = state.mapStyle || 'noir';
    }

    var userIconChar = getStyleIcons(state.mapStyle || 'noir').user;
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

  function fetchPlacesFromOverpass(lat, lng, radiusMeters) {
    var radius = Math.min(Math.round(radiusMeters), 10000);
    var q = [
      '[out:json][timeout:20];',
      '(',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=museum][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=gallery][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=attraction][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=viewpoint][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=theme_park][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=zoo][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[historic][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=museum][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=arts_centre][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=theatre][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[leisure=park][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[leisure=nature_reserve][name];',
      ');',
      'out body;'
    ].join('');

    return fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q)
    }).then(function (response) {
      if (!response.ok) throw new Error('Overpass: ' + response.status);
      return response.json();
    });
  }

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
          var t = el.tags || {};
          return {
            name: t.name || '(bez nazwy)',
            lat: el.lat,
            lon: el.lon,
            type: [t.tourism, t.amenity, t.leisure, t.historic].filter(Boolean).join(', ') || '–'
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
        show($('btn-simulate-arrival'), true);
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

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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
        if (dist < ARRIVAL_METERS) {
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
        checkDistances();
      },
      function () {
        setStatus(t('status_position_error'), '');
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    updateDistanceHint();
  }

  function addAllTargetMarkers() {
    if (!state.map || !state.targetPlaces.length) return;
    state.targetMarkers.forEach(function (m) {
      if (state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.targetMarkers = [];
    state.collectedIndices = {};
    state.visitedMarkers.forEach(function (m) {
      if (state.map.hasLayer(m)) state.map.removeLayer(m);
    });
    state.visitedMarkers = [];

    var attractionChar = getStyleIcons(state.mapStyle || 'noir').attraction;
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
  }

  function removeTargetMarkerAt(index) {
    var m = state.targetMarkers[index];
    if (m && state.map && state.map.hasLayer(m)) {
      state.map.removeLayer(m);
    }
  }

  function addVisitedMarker(place) {
    if (!state.map || !place) return;
    var visitedChar = getStyleIcons(state.mapStyle || 'noir').visited;
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

  var WIKI_API = 'https://pl.wikipedia.org/w/api.php';
  var WIKI_MAX_DIST_M = 120;

  function fetchWikipediaCiekawostki(lat, lng, placeName, callback) {
    var params = function (obj) {
      return Object.keys(obj).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }).join('&');
    };
    var opts = { action: 'query', list: 'geosearch', gscoord: lat + '|' + lng, gsradius: WIKI_MAX_DIST_M, gslimit: 1, format: 'json', origin: '*' };
    fetch(WIKI_API + '?' + params(opts))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var list = data.query && data.query.geosearch;
        if (!list || list.length === 0) { callback(null, null); return null; }
        var hit = list[0];
        var distM = hit.dist != null ? hit.dist : 999;
        if (distM > WIKI_MAX_DIST_M) { callback(null, null); return null; }
        return { pageid: hit.pageid, title: hit.title };
      })
      .then(function (ref) {
        if (!ref) return;
        var q = { action: 'query', format: 'json', origin: '*', prop: 'extracts|pageimages', exintro: 1, explaintext: 1, exchars: 650, piprop: 'original', pageids: ref.pageid };
        fetch(WIKI_API + '?' + params(q))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var pages = data.query && data.query.pages;
            var page = pages && pages[Object.keys(pages)[0]];
            var extract = page && page.extract;
            var imgUrl = (page && page.original && page.original.source) || (page && page.thumbnail && page.thumbnail.source);
            callback(extract || null, imgUrl || null);
          })
          .catch(function () { callback(null, null); });
      })
      .catch(function () { callback(null, null); });
  }

  function updateRevealButton() {
    var btn = $('btn-reveal-action');
    if (!btn) return;
    var collected = Object.keys(state.collectedIndices).length;
    var total = state.targetPlaces.length;
    if (collected < total) {
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
    show($('btn-simulate-arrival'), true);
    setStatus(t('status_go_to_next'), '');
    startWatching();
  }

  function revealPlace() {
    show($('btn-simulate-arrival'), false);
    show($('map-style-bar'), false);
    state.map.panTo([state.targetPlace.lat, state.targetPlace.lng]);

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
    if (nameEl) nameEl.textContent = state.targetPlace.name;
    if (descEl) descEl.textContent = state.targetPlace.desc || t('reveal_desc_placeholder');
    if (photoEl) {
      photoEl.innerHTML = '';
      photoEl.classList.add('no-photo');
    }
    if (ciekawostkiEl) { ciekawostkiEl.classList.add('hidden'); }

    updateRevealButton();

    var distanceM = state.userPosition ? haversine(state.userPosition.lat, state.userPosition.lng, state.targetPlace.lat, state.targetPlace.lng) : 0;
    var tier = getTierFromDistanceMeters(distanceM);
    saveExperienceEntry(state.targetPlace, tier);

    fetchWikipediaCiekawostki(state.targetPlace.lat, state.targetPlace.lng, state.targetPlace.name, function (extract, imgUrl) {
      if (imgUrl && photoEl) {
        photoEl.classList.remove('no-photo');
        photoEl.innerHTML = '<img src="' + imgUrl.replace(/^http:/, 'https:') + '" alt="" loading="lazy" />';
      }
      if (extract && funfactEl && ciekawostkiEl) {
        funfactEl.textContent = extract;
        ciekawostkiEl.classList.remove('hidden');
      }
    });

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
        r.style.zIndex = '99998';
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
    var ro = document.getElementById('reveal-overlay');
    var ao = document.getElementById('arrival-overlay');
    if (ro) { ro.classList.add('hidden'); ro.style.display = 'none'; ro.style.visibility = 'hidden'; }
    if (ao) { ao.classList.add('hidden'); ao.style.display = 'none'; ao.style.visibility = 'hidden'; }
    show($('loading-place'), false);
    show($('walking-info'), false);
    show($('map-style-bar'), false);
    show($('btn-simulate-arrival'), false);
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

  var SIMULATE_WALK_MS = 2500;

  function animateWalkToTarget(doneCallback) {
    if (!state.map || !state.userMarker || !state.targetPlace) {
      if (doneCallback) doneCallback();
      return;
    }
    var startLat = state.userPosition.lat;
    var startLng = state.userPosition.lng;
    var endLat = state.targetPlace.lat;
    var endLng = state.targetPlace.lng;
    var startTime = performance.now();

    function tick(now) {
      var progress = (now - startTime) / SIMULATE_WALK_MS;
      if (progress >= 1) {
        state.userPosition = { lat: endLat, lng: endLng };
        state.userMarker.setLatLng([endLat, endLng]);
        state.map.panTo([endLat, endLng]);
        if (doneCallback) doneCallback();
        return;
      }
      var ease = progress * progress * (3 - 2 * progress);
      var lat = startLat + (endLat - startLat) * ease;
      var lng = startLng + (endLng - startLng) * ease;
      state.userPosition = { lat: lat, lng: lng };
      state.userMarker.setLatLng([lat, lng]);
      var dist = haversine(lat, lng, endLat, endLng);
      var hint = document.getElementById('hint-distance');
      if (hint) hint.textContent = t('simulate_distance', { m: Math.round(dist) });
      state.map.panTo([lat, lng]);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function simulateArrival() {
    var indices = [];
    for (var i = 0; i < state.targetPlaces.length; i++) {
      if (!state.collectedIndices[i]) indices.push(i);
    }
    if (indices.length === 0) {
      setStatus(t('status_all_collected'), '');
      return;
    }
    var idx = indices[Math.floor(Math.random() * indices.length)];
    state.targetPlace = state.targetPlaces[idx];
    state.targetPlaceIndex = idx;
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    function onReached() {
      state.collectedIndices[idx] = true;
      removeTargetMarkerAt(idx);
      addVisitedMarker(state.targetPlace);
      revealPlace();
    }
    animateWalkToTarget(onReached);
  }

  function init() {
    applyLocale();
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
        applyLocale();
        document.querySelectorAll('.btn-lang').forEach(function (b) {
          b.classList.toggle('selected', b.getAttribute('data-lang') === lang);
        });
      });
    });

    var btnReveal = $('btn-reveal-action');
    if (btnReveal) btnReveal.addEventListener('click', function () {
      var collected = Object.keys(state.collectedIndices).length;
      if (collected < state.targetPlaces.length) {
        backToMap();
      } else {
        resetWalk();
      }
    });
    var btnDebug = $('btn-debug-toggle');
    if (btnDebug) {
      btnDebug.addEventListener('click', function () {
        var panel = $('debug-panel');
        if (panel) panel.classList.toggle('debug-open');
      });
    }
    var btnSimulate = $('btn-simulate-arrival');
    if (btnSimulate) btnSimulate.addEventListener('click', simulateArrival);
    var styleSelect = document.getElementById('map-style-select');
    if (styleSelect) {
      styleSelect.addEventListener('change', function () {
        state.mapStyle = styleSelect.value || 'noir';
        setStoredTheme(state.mapStyle);
        applyMapStyle();
      });
    }
    initStartScreen();

    var btnExp = $('btn-experience');
    var btnExpMap = $('btn-experience-map');
    if (btnExp) btnExp.addEventListener('click', openExperiencePanel);
    if (btnExpMap) btnExpMap.addEventListener('click', openExperiencePanel);
    var btnExpClose = $('btn-experience-close');
    if (btnExpClose) btnExpClose.addEventListener('click', closeExperiencePanel);
    var btnClear = $('btn-clear-storage');
    if (btnClear) btnClear.addEventListener('click', function () {
      clearStorage();
      closeExperiencePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
