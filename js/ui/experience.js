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
    casual: { xp: 8, label: 'Casual' },
    epic: { xp: 22, label: 'Epic' },
    legendary: { xp: 45, label: 'Legendary' }
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
    if (xp < 80) return 1;
    if (xp < 220) return 2;
    if (xp < 450) return 3;
    if (xp < 800) return 4;
    return 5;
  }

  function renderExperiencePanel() {
    var mode = state.mapStyle || 'adventure';
    var list = getExperience(getCurrentMode());
    var totalXp = totalXpFromExperience(list);
    var level = levelFromXp(totalXp);
    var totalEl = $('experience-total-xp');
    var levelEl = $('experience-level-num');
    var contentEl = $('experience-content');
    var modeEl = $('experience-mode-name');
    if (modeEl) modeEl.textContent = t('experience_mode_prefix') + t('mode_' + mode);
    if (totalEl) totalEl.textContent = totalXp;
    if (levelEl) levelEl.textContent = level;
    if (!contentEl) return;

    var places = [];
    var artifacts = [];
    var monsters = [];
    var carrots = [];
    var carrotsSpoiled = 0;
    var animals = [];
    var npcs = [];
    var wounds = [];
    list.forEach(function (entry) {
      if (entry.type === 'monster') monsters.push(entry);
      else if (entry.type === 'carrot') carrots.push(entry);
      else if (entry.type === 'spoiled_carrot') carrotsSpoiled += 1;
      else if (entry.type === 'animal') animals.push(entry);
      else if (entry.type === 'npc') npcs.push(entry);
      else if (entry.type === 'artifact' || entry.type === 'npc_reward_artifact' || entry.type === 'place_artifact') artifacts.push(entry);
      else if (entry.type === 'wound') wounds.push(entry);
      else if (!entry.type && entry.name) places.push(entry);
    });

    var char = typeof Sp.getStoredCharacter === 'function' ? Sp.getStoredCharacter(mode) : null;
    var html = '';

    if (char) {
      var statsLine = '';
      if (mode === 'adventure' && char.stats) {
        var s = char.stats;
        statsLine = '<p class="experience-char-stats">' +
          (s.strength != null ? t('character_strength') + ' ' + s.strength : '') +
          (s.dexterity != null ? ' · ' + t('character_dexterity') + ' ' + s.dexterity : '') +
          (s.intelligence != null ? ' · ' + t('character_intelligence') + ' ' + s.intelligence : '') +
          '</p>';
      }
      html += '<div class="experience-section experience-section-character">' +
        '<h3 class="experience-section-title">' + t('experience_section_character') + '</h3>' +
        '<div class="experience-character-block">' +
        '<span class="experience-char-emoji" aria-hidden="true">' + (char.emoji || '🧙') + '</span>' +
        '<div class="experience-char-info">' +
        '<p class="experience-char-name">' + escapeHtml(char.name || '—') + '</p>' +
        '<p class="experience-char-level">' + t('experience_level_prefix') + level + '</p>' +
        (statsLine || '') +
        '</div></div></div>';
    }

    if (places.length) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_places') + ' <span class="experience-count">(' + places.length + ')</span></h3><ul class="experience-list">';
      places.forEach(function (entry) {
        var tierClass = 'exp-tier-' + (entry.tier || 'casual');
        html += '<li class="exp-entry">' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-tier ' + tierClass + '">' + t('tier_' + (entry.tier || 'casual')) + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      html += '</ul></div>';
    }

    if (artifacts.length) {
      var artifactIconByType = { place_artifact: '\u{1F31F}', npc_reward_artifact: '\u{1F4F0}', artifact: '\u{1F4F0}' };
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_artifacts') + ' <span class="experience-count">(' + artifacts.length + ')</span></h3><ul class="experience-list">';
      artifacts.forEach(function (entry) {
        var icon = entry.icon || artifactIconByType[entry.type] || '\u{1F4F0}';
        var statLine = '';
        if (entry.statDelta && typeof entry.statDelta === 'object') {
          var parts = [];
          if (entry.statDelta.strength !== undefined && entry.statDelta.strength !== 0) parts.push((entry.statDelta.strength > 0 ? '+' : '') + entry.statDelta.strength + ' ' + t('character_strength'));
          if (entry.statDelta.dexterity !== undefined && entry.statDelta.dexterity !== 0) parts.push((entry.statDelta.dexterity > 0 ? '+' : '') + entry.statDelta.dexterity + ' ' + t('character_dexterity'));
          if (entry.statDelta.intelligence !== undefined && entry.statDelta.intelligence !== 0) parts.push((entry.statDelta.intelligence > 0 ? '+' : '') + entry.statDelta.intelligence + ' ' + t('character_intelligence'));
          if (parts.length) statLine = ' <span class="exp-stat-delta">' + parts.join(', ') + '</span>';
        }
        html += '<li class="exp-entry exp-entry-decoration">' +
          '<span class="exp-decoration-icon">' + icon + '</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + statLine + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      html += '</ul></div>';
    }

    if (monsters.length) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_monsters') + ' <span class="experience-count">(' + monsters.length + ')</span></h3><ul class="experience-list">';
      monsters.forEach(function (entry) {
        var icon = entry.icon || '\u{1F479}';
        var statsLine = '';
        if (entry.stats && typeof entry.stats === 'object') {
          var s = entry.stats;
          statsLine = ' <span class="exp-monster-stats">' + (s.str != null ? t('character_strength') + ' ' + s.str : '') + (s.dex != null ? ' · ' + t('character_dexterity') + ' ' + s.dex : '') + (s.int != null ? ' · ' + t('character_intelligence') + ' ' + s.int : '') + '</span>';
        }
        html += '<li class="exp-entry exp-entry-decoration">' +
          '<span class="exp-decoration-icon">' + icon + '</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + statsLine + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      html += '</ul></div>';
    }

    if (carrots.length || carrotsSpoiled) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_carrots') + ' <span class="experience-count">(' + carrots.length + (carrotsSpoiled ? ' + ' + carrotsSpoiled + ' ' + t('experience_carrots_spoiled') : '') + ')</span></h3><ul class="experience-list">';
      carrots.forEach(function (entry) {
        html += '<li class="exp-entry exp-entry-decoration">' +
          '<span class="exp-decoration-icon">🥕</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      if (carrotsSpoiled) {
        html += '<li class="exp-entry exp-entry-decoration exp-entry-spoiled">' +
          '<span class="exp-decoration-icon">🥕</span>' +
          '<span class="exp-place-name">' + t('carrot_spoiled_label') + ' × ' + carrotsSpoiled + '</span>' +
          '<span class="exp-xp">—</span></li>';
      }
      html += '</ul></div>';
    }

    if (animals.length) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_animals') + ' <span class="experience-count">(' + animals.length + ')</span></h3><ul class="experience-list">';
      animals.forEach(function (entry) {
        html += '<li class="exp-entry exp-entry-decoration">' +
          '<span class="exp-decoration-icon">🐾</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      html += '</ul></div>';
    }

    if (npcs.length) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_npcs') + ' <span class="experience-count">(' + npcs.length + ')</span></h3><ul class="experience-list">';
      npcs.forEach(function (entry) {
        html += '<li class="exp-entry exp-entry-decoration">' +
          '<span class="exp-decoration-icon">👤</span>' +
          '<span class="exp-place-name">' + escapeHtml(entry.name || '') + '</span>' +
          '<span class="exp-xp">+' + (entry.xp || 0) + ' XP</span></li>';
      });
      html += '</ul></div>';
    }

    if (wounds.length) {
      html += '<div class="experience-section"><h3 class="experience-section-title">' + t('experience_section_wounds') + ' <span class="experience-count">(' + wounds.length + ')</span></h3><ul class="experience-list">';
      wounds.forEach(function (entry) {
        var desc = entry.description || entry.name || '';
        html += '<li class="exp-entry exp-entry-decoration exp-entry-wound">' +
          '<span class="exp-decoration-icon">🩹</span>' +
          '<span class="exp-place-name">' + escapeHtml(desc) + '</span>' +
          '<span class="exp-xp">—</span></li>';
      });
      html += '</ul></div>';
    }

    if (!char && !places.length && !artifacts.length && !monsters.length && !carrots.length && !carrotsSpoiled && !animals.length && !npcs.length && !wounds.length) {
      html += '<p class="exp-empty">' + t('experience_empty') + '</p>';
    }

    contentEl.innerHTML = html;
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
