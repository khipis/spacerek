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
    var list = type === 'monster' ? (names.monsters && names.monsters[langKey]) : (type === 'npc' ? (names.npcs && names.npcs[langKey]) : (names.animals && names.animals[langKey]));
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
      if (type === 'monster') {
        marker._monsterLevel = 1 + Math.floor(Math.random() * 3);
        marker._monsterStr = 2 + Math.floor(Math.random() * 7);
        marker._monsterDex = 2 + Math.floor(Math.random() * 7);
        marker._monsterXp = 5 + marker._monsterLevel * 5;
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
    var xp = marker._monsterXp != null ? marker._monsterXp : 10;
    var elName = document.getElementById('monster-encounter-name');
    var elLevel = document.getElementById('monster-encounter-level');
    var elStr = document.getElementById('monster-encounter-str');
    var elDex = document.getElementById('monster-encounter-dex');
    var elXp = document.getElementById('monster-encounter-xp');
    var overlay = document.getElementById('monster-encounter-overlay');
    if (elName) elName.textContent = name;
    if (elLevel) elLevel.textContent = level;
    if (elStr) elStr.textContent = str;
    if (elDex) elDex.textContent = dex;
    if (elXp) elXp.textContent = '+' + xp;
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
      state.metMonsterNames.push(name);
      if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('monster', name, xp);
      if (Sp.showToast) Sp.showToast(t('monster_fight_won', { xp: xp }));
      if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
    } else if (choice === 'lose' && Sp.showToast) {
      Sp.showToast(t('monster_fight_lost'));
    }
  }

  function showNpcEncounter(index, marker) {
    state.pendingEncounterType = 'npc';
    state.pendingNpcIndex = index;
    state.pendingNpcMarker = marker;
    var name = marker._decorationName || '?';
    var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
    var dialoguesSource = (Sp.npcDialogues && Sp.npcDialogues[lang]) ? Sp.npcDialogues[lang] : (lang === 'en' ? ['Hello, traveller. Have a nice walk!'] : ['Witaj, wędrowcze. Miłego spaceru!']);
    var dialogues = dialoguesSource;
    var dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
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
    var elConv = document.getElementById('npc-conversation');
    var elCarrotsHint = document.getElementById('npc-carrots-hint');
    var elInput = document.getElementById('npc-chat-input');
    var elLlmBadge = document.getElementById('npc-llm-badge');
    state.encounterMessages = [{ who: 'them', text: dialogue }];
    state.carrotGivenInEncounter = false;
    state.encounterMessageCount = 0;
    if (elTitle) elTitle.textContent = name;
    if (elLlmBadge) {
      var lang = (typeof window.getStoredLang === 'function' && window.getStoredLang()) || 'pl';
      var showLlm = lang === 'en' && window.Spacerek && window.Spacerek.llmAvailable === true;
      if (showLlm) {
        elLlmBadge.classList.remove('hidden');
        elLlmBadge.title = (window.t ? window.t('npc_llm_badge_title') : 'Generated with local AI');
      } else {
        elLlmBadge.classList.add('hidden');
      }
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
    var elAiHint = document.getElementById('npc-ai-hint');
    if (elAiHint) {
      if (document.location.protocol === 'file:') {
        elAiHint.textContent = window.t ? window.t('npc_ai_https_hint') : 'AI (🧠) works only via http/https (e.g. GitHub Pages). You see 📋 template now.';
        elAiHint.classList.remove('hidden');
      } else {
        elAiHint.classList.add('hidden');
      }
    }
    if (elCarrotsHint) {
      if (isAnimal && state.stats && state.stats.carrotsCollected != null) {
        var n = state.stats.carrotsCollected;
        elCarrotsHint.textContent = (window.t ? window.t('npc_carrots_hint', { count: n }) : 'Masz ' + n + ' marchewek').replace('{count}', n);
        elCarrotsHint.classList.remove('hidden');
      } else {
        elCarrotsHint.classList.add('hidden');
      }
    }
    if (elInput) {
      elInput.value = '';
      elInput.placeholder = window.t ? window.t('npc_chat_placeholder') : 'Napisz coś…';
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

  function showGeneratingPlaceholder() {
    var elConv = document.getElementById('npc-conversation');
    if (!elConv) return;
    var wrap = document.createElement('div');
    wrap.id = 'npc-msg-generating';
    wrap.className = 'npc-msg-wrap npc-msg-generating';
    var div = document.createElement('div');
    div.className = 'npc-msg npc-msg-them';
    div.textContent = window.t ? window.t('npc_loading_ai') : 'Loading AI…';
    wrap.appendChild(div);
    elConv.appendChild(wrap);
    elConv.scrollTop = elConv.scrollHeight;
  }

  function removeGeneratingPlaceholder() {
    var el = document.getElementById('npc-msg-generating');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function appendEncounterMessage(who, text, fromLLM) {
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
      if (who === 'them' && fromLLM !== undefined) {
        var badge = document.createElement('span');
        if (fromLLM) {
          badge.className = 'npc-msg-badge npc-msg-ai-badge';
          badge.setAttribute('title', window.t ? window.t('npc_llm_badge_title') : 'Generated by AI');
          badge.textContent = '\u{1F9E0}'; /* 🧠 */
        } else {
          badge.className = 'npc-msg-badge npc-msg-template-badge';
          badge.setAttribute('title', window.t ? window.t('npc_badge_template_title') : 'Template reply');
          badge.textContent = '\u{1F4CB}'; /* 📋 */
        }
        wrap.appendChild(badge);
      }
      elConv.appendChild(wrap);
      elConv.scrollTop = elConv.scrollHeight;
    }
  }

  function handleEncounterSend() {
    var elInput = document.getElementById('npc-chat-input');
    if (!elInput) return;
    var text = (elInput.value || '').trim();
    if (!text.length) return;
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
      if (typeof window.generateAnimalReplyFromContext === 'function') {
        var input = document.getElementById('npc-chat-input');
        var sendBtn = document.getElementById('btn-npc-send');
        if (input) input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        showGeneratingPlaceholder();
        window.generateAnimalReplyFromContext(animalName || 'Animal', 'en', state.encounterMessages).then(function (llmReply) {
          removeGeneratingPlaceholder();
          var reply = llmReply && llmReply.trim();
          var fromLLM = !!reply;
          if (!reply && replies && replies.animalGeneric && replies.animalGeneric.en) reply = getRandomReply(replies.animalGeneric.en);
          if (!reply) reply = 'Nice to chat!';
          if (!fromLLM && window.Spacerek && window.Spacerek.llmModuleLoaded && Sp.showToast) {
            Sp.showToast(window.t ? window.t('npc_model_failed_toast') : 'AI model failed – using template');
          }
          appendEncounterMessage('them', reply, fromLLM);
          if (input) input.disabled = false;
          if (sendBtn) sendBtn.disabled = false;
        }).catch(function () {
          removeGeneratingPlaceholder();
          var genericList = replies.animalGeneric && replies.animalGeneric[langKey];
          if (window.Spacerek && window.Spacerek.llmModuleLoaded && Sp.showToast) {
            Sp.showToast(window.t ? window.t('npc_model_failed_toast') : 'AI model failed – using template');
          }
          appendEncounterMessage('them', getRandomReply(genericList) || 'Nice to chat!', false);
          if (input) input.disabled = false;
          if (sendBtn) sendBtn.disabled = false;
        });
        return;
      }
      var genericList = replies.animalGeneric && replies.animalGeneric[langKey];
      appendEncounterMessage('them', getRandomReply(genericList) || (langKey === 'pl' ? 'Hmm, miło pogadać!' : 'Nice to chat!'), false);
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
      if (typeof window.generateNpcReplyFromContext === 'function') {
        var input = document.getElementById('npc-chat-input');
        var sendBtn = document.getElementById('btn-npc-send');
        if (input) input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        showGeneratingPlaceholder();
        window.generateNpcReplyFromContext(npcName || 'NPC', 'en', state.encounterMessages).then(function (llmReply) {
          removeGeneratingPlaceholder();
          var reply = llmReply && llmReply.trim();
          var fromLLM = !!reply;
          if (!reply && replies && replies.npcGeneric && replies.npcGeneric.en) reply = getRandomReply(replies.npcGeneric.en);
          if (!reply) reply = 'I see. Have a nice walk!';
          if (!fromLLM && window.Spacerek && window.Spacerek.llmModuleLoaded && Sp.showToast) {
            Sp.showToast(window.t ? window.t('npc_model_failed_toast') : 'AI model failed – using template');
          }
          appendEncounterMessage('them', reply, fromLLM);
          if (input) input.disabled = false;
          if (sendBtn) sendBtn.disabled = false;
        }).catch(function () {
          removeGeneratingPlaceholder();
          var genericList = replies.npcGeneric && replies.npcGeneric[langKey];
          if (window.Spacerek && window.Spacerek.llmModuleLoaded && Sp.showToast) {
            Sp.showToast(window.t ? window.t('npc_model_failed_toast') : 'AI model failed – using template');
          }
          appendEncounterMessage('them', getRandomReply(genericList) || 'I see. Have a nice walk!', false);
          if (input) input.disabled = false;
          if (sendBtn) sendBtn.disabled = false;
        });
        return;
      }
      if (replies && replies.npcGeneric && replies.npcGeneric[langKey]) {
        appendEncounterMessage('them', getRandomReply(replies.npcGeneric[langKey]), false);
      } else {
        appendEncounterMessage('them', langKey === 'pl' ? 'Rozumiem. Miłego spaceru!' : 'I see. Have a nice walk!', false);
      }
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
    if (state.map && state.map.hasLayer(marker)) state.map.removeLayer(marker);
    var name = marker._decorationName || '?';
    if (encounterType === 'animal') {
      state.metAnimalNames.push(name);
      var xp = carrotGiven ? ((config && config.CARROT_GIFT_XP) != null ? config.CARROT_GIFT_XP : 25) : 10;
      if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('animal', name, xp);
    } else {
      state.metNpcNames.push(name);
      if (Sp.saveDecorationEntry) Sp.saveDecorationEntry('npc', name, 5);
    }
    if (Sp.renderExperiencePanel) Sp.renderExperiencePanel();
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
      var ulChance = (config && config.ARTIFACT_ULTRALEGENDARY_CHANCE) != null ? config.ARTIFACT_ULTRALEGENDARY_CHANCE : 0.05;
      var ulXp = (config && config.ARTIFACT_ULTRALEGENDARY_XP) != null ? config.ARTIFACT_ULTRALEGENDARY_XP : 50;
      var isUltralegendary = names.artifactsUltralegendary && names.artifactsUltralegendary[langKey] && names.artifactsUltralegendary[langKey].length && Math.random() < ulChance;
      var list = isUltralegendary ? (names.artifactsUltralegendary && names.artifactsUltralegendary[langKey]) : (names.artifacts && names.artifacts[langKey]);
      var artifactName = (list && list.length) ? list[Math.floor(Math.random() * list.length)] : t('chest_artifact_unknown');
      var xp = isUltralegendary ? ulXp : 15;
      state.artifactsFound.push(artifactName);
      if (saveDecorationEntry) saveDecorationEntry('artifact', artifactName, xp);
      showChestResultToast('artifact', artifactName, isUltralegendary);
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
})();
