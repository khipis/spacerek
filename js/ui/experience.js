/**
 * Experience system (XP), tiers, achievements panel.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var $ = Sp.$;
  var show = Sp.show;
  var escapeHtml = Sp.escapeHtml;
  var getCurrentMode = Sp.getCurrentMode;
  var getExperience = Sp.getExperience;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  var XP_TIERS = {
    casual: { xp: 10, label: 'Casual' },
    epic: { xp: 50, label: 'Epic' },
    legendary: { xp: 100, label: 'Legendary' }
  };

  function getTierFromKm(km) {
    if (km <= 1) return 'casual';
    if (km <= 2) return 'epic';
    return 'legendary';
  }

  function getTierFromDistanceMeters(meters) {
    var km = meters / 1000;
    if (km <= 0.6) return 'casual';
    if (km <= 1.5) return 'epic';
    return 'legendary';
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
    var list = getExperience(getCurrentMode());
    var totalXp = totalXpFromExperience(list);
    var level = levelFromXp(totalXp);
    var totalEl = $('experience-total-xp');
    var levelEl = $('experience-level-num');
    var listEl = $('experience-list');
    var modeEl = $('experience-mode-name');
    if (modeEl) modeEl.textContent = t('experience_mode_prefix') + t('mode_' + (state.mapStyle || 'adventure'));
    if (totalEl) totalEl.textContent = totalXp;
    if (levelEl) levelEl.textContent = level;
    if (!listEl) return;
    listEl.innerHTML = '';
    list.slice().reverse().forEach(function (entry) {
      var li = document.createElement('li');
      if (entry.type === 'carrot' || entry.type === 'spoiled_carrot' || entry.type === 'monster' || entry.type === 'animal' || entry.type === 'npc') {
        var icon = (entry.type === 'carrot' || entry.type === 'spoiled_carrot') ? '🥕' : (entry.type === 'monster' ? '👹' : (entry.type === 'npc' ? '👤' : '🐾'));
        var isSpoiled = entry.type === 'spoiled_carrot';
        var xpVal = entry.xp != null ? entry.xp : 0;
        li.className = 'exp-entry exp-entry-decoration' + (isSpoiled ? ' exp-entry-spoiled' : '');
        li.innerHTML =
          '<span class="exp-decoration-icon">' + icon + '</span>' +
          '<span class="exp-place-name">' + escapeHtml(isSpoiled ? (t('carrot_spoiled_label') || (entry.name + ' (zepsuta)')) : (entry.name || '')) + '</span>' +
          '<span class="exp-xp">' + (xpVal >= 0 ? '+' : '') + xpVal + ' XP</span>';
      } else if (entry.type === 'artifact' || entry.type === 'chest_xp') {
        var chestIcon = entry.type === 'artifact' ? '🏺' : '✨';
        li.className = 'exp-entry exp-entry-decoration';
        li.innerHTML =
          '<span class="exp-decoration-icon">' + chestIcon + '</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span>';
      } else if (entry.type === 'wound') {
        li.className = 'exp-entry exp-entry-decoration exp-entry-wound';
        li.innerHTML =
          '<span class="exp-decoration-icon">🩹</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-xp">—</span>';
      } else {
        var tierClass = 'exp-tier-' + (entry.tier || 'casual');
        li.innerHTML =
          '<span class="exp-place-name">' + escapeHtml(entry.name) + '</span>' +
          '<span class="exp-tier ' + tierClass + '">' + t('tier_' + (entry.tier || 'casual')) + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span>';
      }
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

  Sp.XP_TIERS = XP_TIERS;
  Sp.getTierFromKm = getTierFromKm;
  Sp.getTierFromDistanceMeters = getTierFromDistanceMeters;
  Sp.totalXpFromExperience = totalXpFromExperience;
  Sp.levelFromXp = levelFromXp;
  Sp.renderExperiencePanel = renderExperiencePanel;
  Sp.openExperiencePanel = openExperiencePanel;
  Sp.closeExperiencePanel = closeExperiencePanel;
})();
