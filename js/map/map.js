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

  var DIRECTION_KEYS = ['npc_dir_north', 'npc_dir_northeast', 'npc_dir_east', 'npc_dir_southeast', 'npc_dir_south', 'npc_dir_southwest', 'npc_dir_west', 'npc_dir_northwest'];

  function bearingDegrees(lat1, lng1, lat2, lng2) {
    var dLon = (lng2 - lng1) * Math.PI / 180;
    var y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    var x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    var br = Math.atan2(y, x) * 180 / Math.PI;
    return (br + 360) % 360;
  }

  function bearingToDirectionIndex(lat1, lng1, lat2, lng2) {
    var bearing = bearingDegrees(lat1, lng1, lat2, lng2);
    var index = Math.floor((bearing + 22.5) / 45) % 8;
    return index;
  }

  function getNearestMonsterFrom(npcLat, npcLng) {
    if (!state.decorationMarkers || !state.decorationMarkers.length || !state.map) return null;
    var nearest = null;
    var minDist = Infinity;
    for (var i = 0; i < state.decorationMarkers.length; i++) {
      var m = state.decorationMarkers[i];
      if ((m._decorationType || '') !== 'monster') continue;
      if (!state.map.hasLayer(m)) continue;
      var pos = m.getLatLng && m.getLatLng();
      if (!pos) continue;
      var dist = haversine(npcLat, npcLng, pos.lat, pos.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = { marker: m, lat: pos.lat, lng: pos.lng, distance: dist, directionIndex: bearingToDirectionIndex(npcLat, npcLng, pos.lat, pos.lng) };
      }
    }
    return nearest;
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
    var list = type === 'monster' ? (names.monsters && names.monsters[langKey]) : (type === 'npc' ? (names.npcs && names.npcs[langKey]) : (names.animals && names.animals[langKey]));
    if (!list || !list.length) return [];
    return shuffleArray(list).slice(0, Math.min(count, list.length));
  }

  function randomPointOnPathOrInBounds(bounds, places, userPos) {
    var south = bounds.getSouth();
    var north = bounds.getNorth();
    var west = bounds.getWest();
    var east = bounds.getEast();
    var usePath = (places && places.length && userPos && Math.random() < 0.65);
    if (usePath) {
      var from = userPos;
      var to = places[Math.floor(Math.random() * places.length)];
      if (from && to && (from.lat !== to.lat || from.lng !== to.lng)) {
        var t = 0.15 + Math.random() * 0.7;
        var lat = from.lat + t * (to.lat - from.lat);
        var lng = from.lng + t * (to.lng - from.lng);
        lat = Math.max(south, Math.min(north, lat));
        lng = Math.max(west, Math.min(east, lng));
        return { lat: lat, lng: lng };
      }
      if (places.length >= 2 && Math.random() < 0.5) {
        var a = places[Math.floor(Math.random() * places.length)];
        var b = places[Math.floor(Math.random() * places.length)];
        if (a !== b) {
          var t2 = 0.2 + Math.random() * 0.6;
          lat = a.lat + t2 * (b.lat - a.lat);
          lng = a.lng + t2 * (b.lng - a.lng);
          lat = Math.max(south, Math.min(north, lat));
          lng = Math.max(west, Math.min(east, lng));
          return { lat: lat, lng: lng };
        }
      }
    }
    return {
      lat: south + Math.random() * (north - south),
      lng: west + Math.random() * (east - west)
    };
  }

  function addDecorationMarkers(style, bounds) {
    var icons = getDecorationIcons(style);
    if (!icons.length || !state.map || !bounds) return;
    var L = window.L;
    var south = bounds.getSouth();
    var north = bounds.getNorth();
    var west = bounds.getWest();
    var east = bounds.getEast();
    var places = state.targetPlaces || [];
    var userPos = state.userPosition || null;
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    state.decorationMarkers = [];
    var monsterCount = icons.filter(function (item) { return (item.type || 'monster') === 'monster'; }).length;
    var animalCount = icons.filter(function (item) { return (item.type || '') === 'animal'; }).length;
    var npcCount = icons.filter(function (item) { return (item.type || '') === 'npc'; }).length;
    var monsterNames = getUniqueNames('monster', lang, monsterCount);
    var animalNames = getUniqueNames('animal', lang, animalCount);
    var npcNames = getUniqueNames('npc', lang, npcCount);
    var monsterIdx = 0;
    var animalIdx = 0;
    var npcIdx = 0;
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
      } else if (type === 'npc') {
        name = npcNames[npcIdx++] || '…';
      } else {
        name = animalNames[animalIdx++] || '…';
      }
      var pt = randomPointOnPathOrInBounds(bounds, places, userPos);
      var lat = pt.lat;
      var lng = pt.lng;
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
      if (type === 'monster') {
        var playerLevel = 1;
        if (state.mapStyle === 'adventure' && typeof Sp.getExperience === 'function' && typeof Sp.totalXpFromExperience === 'function' && typeof Sp.levelFromXp === 'function') {
          var expList = Sp.getExperience(Sp.getCurrentMode());
          var totalXp = Sp.totalXpFromExperience(expList);
          playerLevel = Math.max(1, Math.min(5, Sp.levelFromXp(totalXp)));
        }
        var levelScale = Math.max(0, playerLevel - 1);
        var scaleCap = Math.min(2, levelScale);
        var powerRoll = Math.floor(Math.random() * 100);
        var baseLevel = powerRoll < 25 ? 1 + Math.floor(Math.random() * 2) : powerRoll < 70 ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 2);
        var baseStr = powerRoll < 25 ? 2 + Math.floor(Math.random() * 4) : powerRoll < 70 ? 4 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 4);
        var baseDex = powerRoll < 25 ? 2 + Math.floor(Math.random() * 4) : powerRoll < 70 ? 4 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 4);
        var baseInt = 2 + Math.floor(Math.random() * 6);
        marker._monsterLevel = Math.min(5, baseLevel + scaleCap);
        marker._monsterStr = Math.min(14, baseStr + scaleCap * 2);
        marker._monsterDex = Math.min(14, baseDex + scaleCap * 2);
        marker._monsterInt = Math.min(14, baseInt + scaleCap);
        marker._monsterXp = 8 + marker._monsterLevel * 4 + levelScale * 2;
      }
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

  function showMonsterEncounter(index, marker) {
    state.pendingMonsterIndex = index;
    state.pendingMonsterMarker = marker;
    var name = marker._decorationName || '?';
    var level = marker._monsterLevel != null ? marker._monsterLevel : 1;
    var str = marker._monsterStr != null ? marker._monsterStr : 5;
    var dex = marker._monsterDex != null ? marker._monsterDex : 5;
    var int_ = marker._monsterInt != null ? marker._monsterInt : 5;
    var xp = marker._monsterXp != null ? marker._monsterXp : 10;
    var elName = document.getElementById('monster-encounter-name');
    var elLevel = document.getElementById('monster-encounter-level');
    var elStr = document.getElementById('monster-encounter-str');
    var elDex = document.getElementById('monster-encounter-dex');
    var elInt = document.getElementById('monster-encounter-int');
    var elXp = document.getElementById('monster-encounter-xp');
    var elPStr = document.getElementById('monster-encounter-player-str');
    var elPDex = document.getElementById('monster-encounter-player-dex');
    var elPInt = document.getElementById('monster-encounter-player-int');
    var overlay = document.getElementById('monster-encounter-overlay');
    if (elName) elName.textContent = name;
    if (elLevel) elLevel.textContent = level;
    if (elStr) elStr.textContent = str;
    if (elDex) elDex.textContent = dex;
    if (elInt) elInt.textContent = int_;
    if (elXp) elXp.textContent = '+' + xp;
    var char = typeof Sp.getStoredCharacter === 'function' ? Sp.getStoredCharacter('adventure') : null;
    var stats = (char && char.stats) ? char.stats : {};
    if (elPStr) elPStr.textContent = stats.strength != null ? stats.strength : '—';
    if (elPDex) elPDex.textContent = stats.dexterity != null ? stats.dexterity : '—';
    if (elPInt) elPInt.textContent = stats.intelligence != null ? stats.intelligence : '—';
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.zIndex = '100001';
    }
  }

  function finishMonsterEncounter(choice) {
    var index = state.pendingMonsterIndex;
    var marker = state.pendingMonsterMarker;
    state.pendingMonsterIndex = null;
    state.pendingMonsterMarker = null;
    var overlay = document.getElementById('monster-encounter-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
    if (index == null || !marker) return;
    if (state.map && state.map.hasLayer(marker)) state.map.removeLayer(marker);
    var name = marker._decorationName || '?';
    var xp = marker._monsterXp != null ? marker._monsterXp : 10;
    if (choice === 'fight') {
      state.monstersKilled = (state.monstersKilled || 0) + 1;
      state.metMonsterNames.push(name);
      var monsterIcon = marker._decorationChar || '\u{1F479}';
      var monsterStats = {
        str: marker._monsterStr != null ? marker._monsterStr : 5,
        dex: marker._monsterDex != null ? marker._monsterDex : 5,
        int: marker._monsterInt != null ? marker._monsterInt : 5
      };
      if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('monster', name, xp, { icon: monsterIcon, stats: monsterStats });
      if (Sp.showToast) Sp.showToast(t('monster_fight_won', { xp: xp }));
      if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
    } else if (choice === 'lose') {
      var loseXp = (config && config.MONSTER_DEFEAT_XP_LOSS) != null ? config.MONSTER_DEFEAT_XP_LOSS : 8;
      if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('monster_defeat', name, -loseXp);
      if (Sp.showToast) Sp.showToast(t('monster_fight_lost') + ' −' + loseXp + ' XP');
      if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
    }
  }

  function showNpcEncounter(index, marker) {
    state.pendingEncounterType = 'npc';
    state.pendingNpcIndex = index;
    state.pendingNpcMarker = marker;
    var name = marker._decorationName || '?';
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var dialoguesSource = (Sp.npcDialogues && Sp.npcDialogues[lang]) ? Sp.npcDialogues[lang] : (lang === 'en' ? ['Hello, traveller. Have a nice walk!'] : ['Witaj, wędrowcze. Miłego spaceru!']);
    var dialogue = dialoguesSource[Math.floor(Math.random() * dialoguesSource.length)];
    var npcPos = marker.getLatLng && marker.getLatLng();
    if (npcPos) {
      var nearest = getNearestMonsterFrom(npcPos.lat, npcPos.lng);
      if (nearest) {
        var dirKey = DIRECTION_KEYS[nearest.directionIndex];
        var dirName = t(dirKey);
        var hintKey = 'npc_monster_hint_' + (1 + Math.floor(Math.random() * 5));
        var hint = t(hintKey, { direction: dirName });
        dialogue = dialogue + ' ' + hint;
      }
    }
    showEncounterOverlay(name, dialogue, false);
  }

  function showAnimalEncounter(index, marker, dialogue) {
    state.pendingEncounterType = 'animal';
    state.pendingNpcIndex = index;
    state.pendingNpcMarker = marker;
    var name = marker._decorationName || '?';
    showEncounterOverlay(name, dialogue || (t('npc_dialogue')), true);
  }

  function showEncounterOverlay(name, dialogue, isAnimal) {
    var overlay = document.getElementById('npc-encounter-overlay');
    var elTitle = document.getElementById('npc-encounter-title');
    var elAvatar = document.getElementById('npc-encounter-avatar');
    var elConv = document.getElementById('npc-conversation');
    var elPlayerStats = document.getElementById('npc-player-stats');
    var elMonstersHint = document.getElementById('npc-monsters-hint');
    var elCarrotsHint = document.getElementById('npc-carrots-hint');
    var elInput = document.getElementById('npc-chat-input');
    state.encounterMessages = [{ who: 'them', text: dialogue }];
    state.carrotGivenInEncounter = false;
    state.encounterMessageCount = 0;
    if (elTitle) elTitle.textContent = name;
    if (elAvatar) {
      var marker = state.pendingNpcMarker;
      var char = (marker && marker._decorationChar) ? marker._decorationChar : (isAnimal ? '\u{1F43F}' : '\u{1F464}');
      elAvatar.textContent = char;
      elAvatar.classList.remove('hidden');
    }
    if (elConv) {
      elConv.innerHTML = '';
      state.encounterMessages.forEach(function (msg) {
        var wrap = document.createElement('div');
        wrap.className = 'npc-msg-wrap';
        var div = document.createElement('div');
        div.className = 'npc-msg npc-msg-' + msg.who;
        div.textContent = msg.text;
        wrap.appendChild(div);
        elConv.appendChild(wrap);
      });
      elConv.scrollTop = elConv.scrollHeight;
    }
    if (elPlayerStats) {
      var carrotsCount = (state.stats && state.stats.carrotsCollected != null) ? state.stats.carrotsCollected : 0;
      var monstersKilled = state.monstersKilled || 0;
      var monsterNames = state.metMonsterNames || [];
      if (isAnimal) {
        if (elMonstersHint) { elMonstersHint.classList.add('hidden'); }
        if (elCarrotsHint) {
          elCarrotsHint.textContent = '\u{1F955} ' + (window.t ? window.t('npc_carrots_hint', { count: carrotsCount }) : 'Masz ' + carrotsCount + ' marchewek').replace('{count}', carrotsCount);
          elCarrotsHint.classList.remove('hidden');
        }
        elPlayerStats.classList.remove('hidden');
      } else {
        if (elMonstersHint) {
          if (monstersKilled > 0) {
            var namesStr = monsterNames.length ? ' (' + monsterNames.slice(0, 5).join(', ') + (monsterNames.length > 5 ? '…' : '') + ')' : '';
            elMonstersHint.textContent = '\u{1F479} ' + (window.t ? window.t('npc_monsters_hint') : 'Pokonane potwory:') + ' ' + monstersKilled + namesStr;
            elMonstersHint.classList.remove('hidden');
          } else {
            elMonstersHint.textContent = '\u{1F479} ' + (window.t ? window.t('npc_monsters_hint') : 'Pokonane potwory:') + ' 0';
            elMonstersHint.classList.remove('hidden');
          }
        }
        if (elCarrotsHint) elCarrotsHint.classList.add('hidden');
        elPlayerStats.classList.remove('hidden');
      }
    }
    if (elInput) {
      elInput.value = '';
      elInput.placeholder = window.t ? window.t('npc_chat_placeholder') : 'Napisz coś…';
      elInput.title = window.t ? window.t('npc_chat_word_limit') : 'Max 10 words';
      elInput.focus();
    }
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.zIndex = '100001';
    }
  }

  function isGivingCarrot(text, lang) {
    if (!text || typeof text !== 'string') return false;
    var raw = text.trim().toLowerCase();
    if (!raw.length) return false;
    var replies = window.Spacerek && window.Spacerek.conversationReplies;
    if (!replies || !replies.giveCarrotKeywords) return false;
    var keywords = replies.giveCarrotKeywords[lang === 'en' ? 'en' : 'pl'] || replies.giveCarrotKeywords.pl;
    for (var i = 0; i < keywords.length; i++) {
      if (raw.indexOf(keywords[i]) !== -1) return true;
    }
    return false;
  }

  function isOffensive(text, lang) {
    if (!text || typeof text !== 'string') return false;
    var raw = text.trim().toLowerCase();
    if (!raw.length) return false;
    var replies = window.Spacerek && window.Spacerek.conversationReplies;
    if (!replies || !replies.offensiveKeywords) return false;
    var keywords = replies.offensiveKeywords[lang === 'en' ? 'en' : 'pl'] || replies.offensiveKeywords.pl;
    for (var i = 0; i < keywords.length; i++) {
      if (raw.indexOf(keywords[i]) !== -1) return true;
    }
    return false;
  }

  var npcAutoCloseTimeout = null;

  function scheduleNpcEndConversation() {
    if (npcAutoCloseTimeout) clearTimeout(npcAutoCloseTimeout);
    var input = document.getElementById('npc-chat-input');
    var sendBtn = document.getElementById('btn-npc-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    npcAutoCloseTimeout = setTimeout(function () {
      npcAutoCloseTimeout = null;
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (typeof Sp.finishEncounter === 'function') Sp.finishEncounter();
    }, 2200);
  }

  function getRandomReply(list) {
    if (!list || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function appendEncounterMessage(who, text) {
    state.encounterMessages = state.encounterMessages || [];
    state.encounterMessages.push({ who: who, text: text });
    var elConv = document.getElementById('npc-conversation');
    if (elConv) {
      var wrap = document.createElement('div');
      wrap.className = 'npc-msg-wrap';
      var div = document.createElement('div');
      div.className = 'npc-msg npc-msg-' + who;
      div.textContent = text;
      wrap.appendChild(div);
      if (who === 'them') {
        var badge = document.createElement('span');
        badge.className = 'npc-msg-badge npc-msg-template-badge';
        badge.setAttribute('title', window.t ? window.t('npc_badge_template_title') : 'Template reply');
        badge.textContent = '\u{1F4CB}'; /* 📋 */
        wrap.appendChild(badge);
      }
      elConv.appendChild(wrap);
      elConv.scrollTop = elConv.scrollHeight;
    }
  }

  var MAX_PLAYER_WORDS = 10;

  function trimToWordLimit(str, limit) {
    if (!str || limit < 1) return '';
    var parts = str.trim().split(/\s+/);
    return parts.slice(0, limit).join(' ');
  }

  function handleEncounterSend() {
    var elInput = document.getElementById('npc-chat-input');
    if (!elInput) return;
    var raw = (elInput.value || '').trim();
    if (!raw.length) return;
    var text = trimToWordLimit(raw, MAX_PLAYER_WORDS);
    elInput.value = '';
    var encounterType = state.pendingEncounterType;
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var langKey = lang === 'en' ? 'en' : 'pl';
    var replies = window.Spacerek && window.Spacerek.conversationReplies;
    var carrotXp = (config && config.CARROT_GIFT_XP) != null ? config.CARROT_GIFT_XP : 25;

    appendEncounterMessage('player', text);

    if (encounterType === 'animal' && replies) {
      var givingCarrot = isGivingCarrot(text, lang);
      var hasCarrots = state.stats && state.stats.carrotsCollected != null && state.stats.carrotsCollected > 0;
      if (givingCarrot && hasCarrots && !state.carrotGivenInEncounter) {
        state.stats.carrotsCollected -= 1;
        state.carrotGivenInEncounter = true;
        var happyList = replies.animalHappy && replies.animalHappy[langKey];
        var reply = getRandomReply(happyList) || (langKey === 'pl' ? 'Dziękuję! Jestem wniebowzięta!' : 'Thank you! I\'m over the moon!');
        appendEncounterMessage('them', reply, false);
        if (Sp.showToast) Sp.showToast('🥕 ' + (window.t ? window.t('npc_gave_carrot_toast', { xp: carrotXp }) : 'Dałeś marchewkę! +' + carrotXp + ' XP').replace('{xp}', carrotXp));
        if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
        var hint = document.getElementById('npc-carrots-hint');
        if (hint && state.stats.carrotsCollected != null) hint.textContent = (window.t ? window.t('npc_carrots_hint', { count: state.stats.carrotsCollected }) : 'Masz ' + state.stats.carrotsCollected + ' marchewek').replace('{count}', state.stats.carrotsCollected);
        return;
      }
      if (givingCarrot && !hasCarrots) {
        var noCarrotsMsg = (replies.animalNoCarrots && replies.animalNoCarrots[langKey]) || (langKey === 'pl' ? 'Nie masz teraz marchewki.' : 'You don\'t have a carrot.');
        appendEncounterMessage('them', noCarrotsMsg, false);
        return;
      }
      var animalName = state.pendingNpcMarker && state.pendingNpcMarker._decorationName;
      var messagesForReply = state.encounterMessages.slice(0, -1).concat([{ who: 'player', text: text }]);
      (async function () {
        var reply = null;
        if (typeof window.generateAnimalReplyFromContext === 'function') {
          reply = await (window.generateAnimalReplyFromContext(animalName || 'Animal', langKey, messagesForReply) || Promise.resolve(null));
        }
        if (!reply && replies && replies.animalGeneric && replies.animalGeneric[langKey]) reply = getRandomReply(replies.animalGeneric[langKey]);
        if (!reply) reply = langKey === 'pl' ? 'Hmm, miło pogadać!' : 'Nice to chat!';
        appendEncounterMessage('them', reply.trim ? reply.trim() : reply, false);
      })();
      return;
    }

    if (encounterType === 'npc') {
      state.encounterMessageCount = (state.encounterMessageCount || 0) + 1;
      var offended = isOffensive(text, lang);
      var bored = state.encounterMessageCount >= 5;
      if (offended && replies && replies.npcOffended && replies.npcOffended[langKey]) {
        appendEncounterMessage('them', getRandomReply(replies.npcOffended[langKey]), false);
        scheduleNpcEndConversation();
        return;
      }
      if (bored && replies && replies.npcBored && replies.npcBored[langKey]) {
        appendEncounterMessage('them', getRandomReply(replies.npcBored[langKey]), false);
        scheduleNpcEndConversation();
        return;
      }
      var npcName = state.pendingNpcMarker && state.pendingNpcMarker._decorationName;
      var playerContext = {
        monstersKilled: state.monstersKilled || 0,
        monsterNames: state.metMonsterNames || [],
        carrots: (state.stats && state.stats.carrotsCollected != null) ? state.stats.carrotsCollected : 0
      };
      var messagesForReply = state.encounterMessages.slice(0, -1).concat([{ who: 'player', text: text }]);
      (async function () {
        var reply = null;
        if (typeof window.generateNpcReplyFromContext === 'function') {
          reply = await (window.generateNpcReplyFromContext(npcName || 'NPC', langKey, messagesForReply, playerContext) || Promise.resolve(null));
        }
        if (!reply && replies && replies.npcGeneric && replies.npcGeneric[langKey]) reply = getRandomReply(replies.npcGeneric[langKey]);
        if (!reply) reply = langKey === 'pl' ? 'Rozumiem. Miłego spaceru!' : 'I see. Have a nice walk!';
        appendEncounterMessage('them', reply.trim ? reply.trim() : reply, false);
      })();
      return;
    }
    appendEncounterMessage('them', langKey === 'pl' ? 'Rozumiem. Miłego spaceru!' : 'I see. Have a nice walk!', false);
  }

  function finishEncounter() {
    if (npcAutoCloseTimeout) {
      clearTimeout(npcAutoCloseTimeout);
      npcAutoCloseTimeout = null;
    }
    var input = document.getElementById('npc-chat-input');
    var sendBtn = document.getElementById('btn-npc-send');
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    var index = state.pendingNpcIndex;
    var marker = state.pendingNpcMarker;
    var encounterType = state.pendingEncounterType;
    var carrotGiven = state.carrotGivenInEncounter;
    state.pendingNpcIndex = null;
    state.pendingNpcMarker = null;
    state.pendingEncounterType = null;
    state.encounterMessages = [];
    state.carrotGivenInEncounter = false;
    state.encounterMessageCount = 0;
    var overlay = document.getElementById('npc-encounter-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
    if (index == null || !marker) return;
    var name = marker._decorationName || '?';
    if (encounterType === 'animal') {
      if (carrotGiven) {
        if (state.map && state.map.hasLayer(marker)) state.map.removeLayer(marker);
        state.metAnimalNames.push(name);
        var xp = (config && config.CARROT_GIFT_XP) != null ? config.CARROT_GIFT_XP : 25;
        if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('animal', name, xp);
      } else {
        state.metDecorationIndices[index] = false;
      }
    } else if (encounterType === 'npc') {
      var isAdventure = state.mapStyle === 'adventure';
      var currentModeKey = typeof Sp.getCurrentMode === 'function' ? Sp.getCurrentMode() : 'przygoda';
      var monsterKillCount = typeof Sp.getMonsterKillCountFromExperience === 'function' ? Sp.getMonsterKillCountFromExperience(currentModeKey) : 0;
      var lastNpcArtifactKills = typeof Sp.getLastNpcArtifactKillCount === 'function' ? Sp.getLastNpcArtifactKillCount('adventure') : 0;
      var canReceiveNpcArtifact = isAdventure && monsterKillCount > lastNpcArtifactKills;
      if (isAdventure && canReceiveNpcArtifact) {
        if (state.map && state.map.hasLayer(marker)) state.map.removeLayer(marker);
        state.metNpcNames.push(name);
        var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
        var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
        var names = (window.Spacerek && window.Spacerek.decorationNames) || {};
        var isLegendary = names.artifactsUltralegendary && names.artifactsUltralegendary[langKey] && names.artifactsUltralegendary[langKey].length && Math.random() < 0.5;
        var npcRank = isLegendary ? 'legendary' : 'epic';
        var list = isLegendary ? (names.artifactsUltralegendary && names.artifactsUltralegendary[langKey]) : (names.artifacts && names.artifacts[langKey]);
        var artifactName = (list && list.length) ? list[Math.floor(Math.random() * list.length)] : (window.t ? window.t('chest_artifact_unknown') : 'Artefakt');
        var artifactXp = ARTIFACT_RANK_XP[npcRank] != null ? ARTIFACT_RANK_XP[npcRank] : 28;
        state.artifactsFound.push(artifactName);
        var npcStatDelta = null;
        if (typeof Sp.getStoredCharacter === 'function' && typeof Sp.setStoredCharacter === 'function') {
          var char = Sp.getStoredCharacter('adventure');
          if (char) {
            var out = applyArtifactStatBonus(Object.assign({}, char), npcRank);
            Sp.setStoredCharacter('adventure', out.character);
            npcStatDelta = out.statDelta;
          }
        }
        if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('npc_reward_artifact', artifactName, artifactXp, { icon: '\u{1F4F0}', statDelta: npcStatDelta });
        if (typeof Sp.setLastNpcArtifactKillCount === 'function') Sp.setLastNpcArtifactKillCount('adventure', monsterKillCount);
        if (Sp.showToast) Sp.showToast((isLegendary ? '🌟 ' : '🏺 ') + (window.t ? window.t('npc_artifact_reward') : 'NPC dał ci artefakt') + ': ' + artifactName + ' +' + artifactXp + ' XP');
      } else if (isAdventure && !canReceiveNpcArtifact) {
        state.metDecorationIndices[index] = false;
      } else {
        if (state.map && state.map.hasLayer(marker)) state.map.removeLayer(marker);
        state.metNpcNames.push(name);
        if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('npc', name, 5);
      }
    }
    if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
  }

  /** Artifact rank: common, rare, epic, legendary, ultralegendary. XP and stat bonus scale by rank. */
  var ARTIFACT_RANK_XP = { common: 12, rare: 18, epic: 28, legendary: 38, ultralegendary: 50 };

  /** Apply artifact stat bonus to adventure character by rank. Returns { character, statDelta }. statDelta may be negative for cursed. */
  function applyArtifactStatBonus(character, rank) {
    if (!character || state.mapStyle !== 'adventure') return { character: character, statDelta: {} };
    var stats = Object.assign({}, character.stats || { strength: 5, dexterity: 5, intelligence: 5 });
    var before = { strength: stats.strength || 5, dexterity: stats.dexterity || 5, intelligence: stats.intelligence || 5 };
    var keys = ['strength', 'dexterity', 'intelligence'];
    var cap = 18;
    var cursed = rank === 'common' && Math.random() < 0.15;
    function addToRandom(amount) {
      var k = keys[Math.floor(Math.random() * keys.length)];
      stats[k] = Math.min(cap, Math.max(1, (stats[k] || 5) + amount));
    }
    function subFromRandom(amount) {
      var k = keys[Math.floor(Math.random() * keys.length)];
      stats[k] = Math.max(1, (stats[k] || 5) - amount);
    }
    function addOne() {
      addToRandom(1);
    }
    if (cursed) {
      subFromRandom(1);
    } else if (rank === 'ultralegendary') {
      addToRandom(2);
      addToRandom(2);
    } else if (rank === 'legendary') {
      addToRandom(2);
      addOne();
    } else if (rank === 'epic') {
      addToRandom(2);
    } else if (rank === 'rare') {
      addOne();
      addOne();
    } else {
      addOne();
    }
    character.stats = stats;
    var statDelta = {
      strength: (stats.strength || 5) - before.strength,
      dexterity: (stats.dexterity || 5) - before.dexterity,
      intelligence: (stats.intelligence || 5) - before.intelligence
    };
    return { character: character, statDelta: statDelta };
  }

  var WOUND_DESCRIPTIONS = {
    pl: [
      'Skaleczyłeś się o zardzewiałą krawędź skrzyni.',
      'Ostre drzazgi ze skrzyni wbiły się w palec.',
      'Przy otwieraniu skrzyni przytrzasnąłeś sobie dłoń.',
      'Zakurzona skrzynia wywołała kichnięcie – potknąłeś się i obtarłeś kolano.',
      'Ukryty kolec w skrzyni zadrasnął cię w ramię.',
      'Stary zamek odskoczył i uderzył cię w nos.',
      'Zapadła się pokrywa – skręciłeś nadgarstek.',
      'W środku był tylko kurz i pajęczyny – wpadły ci do oka.'
    ],
    en: [
      'You cut yourself on the rusty edge of the chest.',
      'Sharp splinters from the chest stuck into your finger.',
      'You pinched your hand while opening the chest.',
      'The dusty chest made you sneeze – you tripped and scraped your knee.',
      'A hidden spike in the chest scratched your arm.',
      'The old lock sprang back and hit you on the nose.',
      'The lid gave way – you twisted your wrist.',
      'Inside was only dust and cobwebs – they got in your eye.'
    ]
  };

  function getRandomWoundDescription(langKey) {
    var list = WOUND_DESCRIPTIONS[langKey] || WOUND_DESCRIPTIONS.pl;
    var text = (Array.isArray(list) && list.length) ? list[Math.floor(Math.random() * list.length)] : (langKey === 'en' ? 'You got hurt opening the chest.' : 'Otrzymałeś ranę przy skrzyni.');
    return { name: t('chest_wound_label'), text: text };
  }

  function showChestResultToast(outcome, data, ultralegendary) {
    if (!Sp.showToast) return;
    if (outcome === 'artifact') {
      var prefix = ultralegendary ? '🌟 ' + t('chest_artifact_ultralegendary') + ' ' : '🏺 ' + t('chest_result_artifact_title') + ' ';
      Sp.showToast(prefix + (data || t('chest_artifact_unknown')));
    } else if (outcome === 'xp') {
      var xp = data != null ? data : 15;
      Sp.showToast('✨ ' + t('chest_result_xp_title') + ' +' + xp + ' XP');
    } else {
      var woundText = (data && typeof data === 'string') ? data : t('chest_result_wound_title');
      Sp.showToast('🩹 ' + woundText, 'wound');
    }
  }

  function resolveChest() {
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var langKey = (lang === 'en' || lang === 'pl') ? lang : 'pl';
    var roll = 1 + Math.floor(Math.random() * 3);
    var saveDecorationEntry = Sp.saveDecorationEntry;
    if (roll === 1) {
      var names = (window.Spacerek && window.Spacerek.decorationNames) || {};
      var ulChance = (config && config.ARTIFACT_ULTRALEGENDARY_CHANCE) != null ? config.ARTIFACT_ULTRALEGENDARY_CHANCE : 0.08;
      var isUltralegendary = names.artifactsUltralegendary && names.artifactsUltralegendary[langKey] && names.artifactsUltralegendary[langKey].length && Math.random() < ulChance;
      var rank = isUltralegendary ? 'ultralegendary' : (Math.random() < 0.5 ? 'common' : 'rare');
      var list = isUltralegendary ? (names.artifactsUltralegendary && names.artifactsUltralegendary[langKey]) : (names.artifacts && names.artifacts[langKey]);
      var artifactName = (list && list.length) ? list[Math.floor(Math.random() * list.length)] : t('chest_artifact_unknown');
      var xp = ARTIFACT_RANK_XP[rank] != null ? ARTIFACT_RANK_XP[rank] : 18;
      state.artifactsFound.push(artifactName);
      var chestStatDelta = null;
      if (typeof Sp.getStoredCharacter === 'function' && typeof Sp.setStoredCharacter === 'function') {
        var char = Sp.getStoredCharacter('adventure');
        if (char) {
          var out = applyArtifactStatBonus(Object.assign({}, char), rank);
          Sp.setStoredCharacter('adventure', out.character);
          chestStatDelta = out.statDelta;
        }
      }
      if (saveDecorationEntry) saveDecorationEntry('artifact', artifactName, xp, { icon: '\u{1F4F0}', statDelta: chestStatDelta });
      showChestResultToast('artifact', artifactName, isUltralegendary);
    } else if (roll === 2) {
      var xp = 18;
      if (saveDecorationEntry) saveDecorationEntry('chest_xp', t('chest_xp_label'), xp);
      showChestResultToast('xp', xp);
    } else {
      state.wounds += 1;
      var woundDesc = getRandomWoundDescription(langKey);
      if (saveDecorationEntry) saveDecorationEntry('wound', woundDesc.name, 0, { description: woundDesc.text });
      showChestResultToast('wound', woundDesc.text);
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
        state.metDecorationIndices[i] = true;
        state.stats.monstersMet += 1;
        showMonsterEncounter(i, m);
        return;
      }
      if (type === 'npc') {
        state.metDecorationIndices[i] = true;
        state.stats.npcsMet += 1;
        showNpcEncounter(i, m);
        return;
      }
      if (type === 'carrot') {
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
        state.metDecorationIndices[i] = true;
        state.stats.animalsMet += 1;
        var langKey = (typeof window.getStoredLang === 'function' && window.getStoredLang()) === 'en' ? 'en' : 'pl';
        var fallbackDialogue = langKey === 'pl' ? 'Cześć!' : 'Hi!';
        if (typeof window.generateAnimalQuest === 'function') {
          window.generateAnimalQuest(name || '', langKey).then(function (questText) {
            showAnimalEncounter(i, m, questText || fallbackDialogue);
          }).catch(function () {
            showAnimalEncounter(i, m, fallbackDialogue);
          });
        } else {
          showAnimalEncounter(i, m, fallbackDialogue);
        }
        return;
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
    state.stats = { monstersMet: 0, carrotsCollected: 0, animalsMet: 0, npcsMet: 0 };
    state.monstersKilled = 0;
    state.metDecorationIndices = {};
    state.metMonsterNames = [];
    state.metAnimalNames = [];
    state.metCarrotNames = [];
    state.metNpcNames = [];
    state.artifactsFound = [];
    state.wounds = 0;
    state.pendingMonsterIndex = null;
    state.pendingMonsterMarker = null;
    state.pendingNpcIndex = null;
    state.pendingNpcMarker = null;
    state.pendingEncounterType = null;

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
  Sp.finishMonsterEncounter = finishMonsterEncounter;
  Sp.finishEncounter = finishEncounter;
  Sp.handleEncounterSend = handleEncounterSend;
  Sp.applyArtifactStatBonus = applyArtifactStatBonus;
  Sp.ARTIFACT_RANK_XP = ARTIFACT_RANK_XP;
})();
