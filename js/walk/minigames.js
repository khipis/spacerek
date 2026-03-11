/**
 * Fight minigames: 1) Reflex RPS, 2) Timing hit, 3) Dodge signal.
 * Shown when user clicks "Walcz"; overlay displays animated monster emoji.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;

  function t(key, replacements) {
    return window.t ? window.t(key, replacements) : key;
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function showOverlay(monsterChar) {
    var overlay = getEl('minigame-overlay');
    var emojiEl = getEl('minigame-monster-emoji');
    if (emojiEl) emojiEl.textContent = monsterChar || '👹';
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.zIndex = '100002';
    }
  }

  function hideOverlay() {
    var overlay = getEl('minigame-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
  }

  function setContent(html) {
    var el = getEl('minigame-content');
    if (el) el.innerHTML = html;
  }

  /** Difficulty level 1–5 from current mode XP; used to scale minigame difficulty. */
  function getMinigameLevel() {
    var state = Sp.state || {};
    var mode = state.mapStyle || 'adventure';
    var list = typeof Sp.getExperience === 'function' ? Sp.getExperience(Sp.getCurrentMode ? Sp.getCurrentMode() : mode) : [];
    if (!Array.isArray(list)) list = [];
    var totalXp = typeof Sp.totalXpFromExperience === 'function' ? Sp.totalXpFromExperience(list) : 0;
    var level = typeof Sp.levelFromXp === 'function' ? Sp.levelFromXp(totalXp) : 1;
    return Math.max(1, Math.min(5, level));
  }

  /** Effective difficulty: base level + monster level and stats, reduced by player stats (compare player vs monster). */
  function getEffectiveMinigameLevel(baseLevel, monsterMarker, playerStats) {
    var monsterLevel = (monsterMarker && monsterMarker._monsterLevel != null) ? monsterMarker._monsterLevel : 1;
    var monsterStr = (monsterMarker && monsterMarker._monsterStr != null) ? monsterMarker._monsterStr : 5;
    var monsterDex = (monsterMarker && monsterMarker._monsterDex != null) ? monsterMarker._monsterDex : 5;
    var monsterPower = Math.floor((monsterStr + monsterDex) / 8);
    var level = Math.min(5, Math.max(1, baseLevel + Math.floor(monsterLevel / 2) - 1 + monsterPower));
    if (!playerStats || typeof playerStats !== 'object') return level;
    var bonus = 0;
    if ((playerStats.dexterity || 0) >= 7) bonus += 1;
    if ((playerStats.strength || 0) >= 7) bonus += 1;
    if ((playerStats.intelligence || 0) >= 8) bonus += 1;
    bonus = Math.min(2, bonus);
    var playerPower = Math.floor(((playerStats.strength || 0) + (playerStats.dexterity || 0) + (playerStats.intelligence || 0)) / 10);
    if (playerPower > monsterPower) bonus = Math.min(3, bonus + 1);
    return Math.max(1, level - bonus);
  }

  // —— Game 1: Reflex RPS (Strike / Dodge / Spell) ——
  // Strike beats Spell, Spell beats Dodge, Dodge beats Strike
  var RPS = { strike: 0, dodge: 1, spell: 2 };
  var RPS_COUNTER = { strike: 'dodge', dodge: 'spell', spell: 'strike' };

  function dexTimeMult(opts) {
    var dex = (opts.playerStats && opts.playerStats.dexterity) ? opts.playerStats.dexterity : 0;
    if (dex >= 9) return 1.15;
    if (dex >= 7) return 1.10;
    if (dex >= 6) return 1.05;
    return 1;
  }

  function runReflexRPS(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var mult = dexTimeMult(opts);
    var telegraphMs = Math.floor((Math.max(380, 780 - (level - 1) * 70)) * mult);
    var choiceMs = Math.floor((Math.max(480, 950 - (level - 1) * 90)) * mult);
    var roundsWon = 0;
    var roundsToWin = (opts.playerStats && (opts.playerStats.strength || 0) >= 8) ? 1 : 2;
    var keys = ['strike', 'dodge', 'spell'];
    var labels = { strike: t('minigame_strike'), dodge: t('minigame_dodge'), spell: t('minigame_spell') };

    function playRound(roundNum) {
      var monsterChoice = keys[Math.floor(Math.random() * 3)];
      var correctCounter = RPS_COUNTER[monsterChoice];
      var choiceMade = false;
      var roundDone = false;

      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_rps') + '</p>' +
        '<p class="minigame-round">' + t('minigame_round', { n: roundNum }) + '</p>' +
        '<p class="minigame-wait-prompt">' + t('minigame_telegraph') + '</p>' +
        '<div class="minigame-timer-bar"><div id="minigame-rps-timer" class="minigame-timer-fill"></div></div>' +
        '<p id="minigame-rps-prompt" class="minigame-wait-prompt" style="display:none;">' + t('minigame_counter') + '</p>' +
        '<div id="minigame-rps-buttons" class="minigame-buttons" style="display:none;">' +
        keys.map(function (k) {
          return '<button type="button" class="minigame-btn-choice" data-choice="' + k + '">' + labels[k] + '</button>';
        }).join('') +
        '</div>'
      );

      var timerEl = getEl('minigame-rps-timer');
      var promptEl = document.getElementById('minigame-rps-prompt');
      var buttonsEl = document.getElementById('minigame-rps-buttons');
      var start = Date.now();
      var timerInterval = setInterval(function () {
        if (choiceMade) return;
        var elapsed = Date.now() - start;
        var pct = Math.min(1, elapsed / telegraphMs);
        if (timerEl) timerEl.style.width = (100 - pct * 100) + '%';
        if (pct >= 1) {
          clearInterval(timerInterval);
          if (!choiceMade) roundResult(false);
        }
      }, 50);

      setTimeout(function () {
        if (choiceMade) return;
        if (promptEl) promptEl.style.display = 'block';
        if (buttonsEl) buttonsEl.style.display = 'flex';
        if (timerEl) timerEl.style.width = '100%';
        start = Date.now();
        var choiceInterval = setInterval(function () {
          if (choiceMade) return;
          var elapsed = Date.now() - start;
          if (elapsed >= choiceMs) {
            clearInterval(choiceInterval);
            if (!choiceMade) roundResult(false);
          }
        }, 50);
      }, telegraphMs);

      function roundResult(won) {
        if (roundDone) return;
        roundDone = true;
        choiceMade = true;
        clearInterval(timerInterval);
        if (won) roundsWon += 1;
        var roundsLost = roundNum - roundsWon;
        if (roundsWon >= roundsToWin || roundsLost >= 2) {
          setContent('<p class="minigame-result ' + (roundsWon >= roundsToWin ? 'win' : 'lose') + '">' + (roundsWon >= roundsToWin ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(roundsWon >= roundsToWin); }, 1200);
          return;
        }
        setTimeout(function () { playRound(roundNum + 1); }, 600);
      }

      keys.forEach(function (k) {
        var btn = buttonsEl && buttonsEl.querySelector('[data-choice="' + k + '"]');
        if (btn) {
          btn.addEventListener('click', function () {
            if (choiceMade) return;
            choiceMade = true;
            clearInterval(timerInterval);
            roundResult(k === correctCounter);
          });
        }
      });
    }

    playRound(1);
  }

  // —— Game 2: Timing hit (click when slider in green zone) ——
  function runTimingHit(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var mult = dexTimeMult(opts);
    var zoneWidth = Math.min(28, Math.max(12, 24 - (level - 1) * 2.5) + ((opts.playerStats && (opts.playerStats.dexterity || 0) >= 6) ? 2 : 0));
    var zoneLeft = 50 - zoneWidth / 2;
    var baseDuration = Math.floor((Math.max(1100, 2100 - (level - 1) * 180)) * mult);
    var hits = 0;
    var attempts = 0;
    var maxAttempts = 3;

    function attempt() {
      attempts += 1;
      var duration = baseDuration + Math.random() * Math.max(250, 550 - (level - 1) * 60);
      var start = Date.now();

      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_timing') + '</p>' +
        '<p class="minigame-round">' + (attempts) + '/' + maxAttempts + '</p>' +
        '<div id="minigame-timing-wrap" class="minigame-timing-bar-wrap">' +
        '<div class="minigame-timing-zone minigame-timing-zone-visible" style="left:' + zoneLeft + '%; width:' + zoneWidth + '%;"></div>' +
        '<div id="minigame-timing-slider" class="minigame-timing-slider" style="left:0%;"></div>' +
        '</div>'
      );

      var sliderEl = getEl('minigame-timing-slider');
      var wrap = getEl('minigame-timing-wrap');
      var clicked = false;

      var anim = function () {
        if (clicked) return;
        var elapsed = Date.now() - start;
        var t = (elapsed / duration) % 1;
        var x = 46 * Math.sin(t * Math.PI * 2) + 46;
        if (sliderEl) sliderEl.style.left = Math.max(0, Math.min(92, x)) + '%';
        if (elapsed < duration) requestAnimationFrame(anim);
        else {
          roundResult(false);
          return;
        }
      };
      requestAnimationFrame(anim);

      function roundResult(hit) {
        if (clicked) return;
        clicked = true;
        if (hit) hits += 1;
        if (hits >= 2 || attempts >= maxAttempts) {
          setContent('<p class="minigame-result ' + (hits >= 2 ? 'win' : 'lose') + '">' + (hits >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(hits >= 2); }, 1200);
          return;
        }
        setTimeout(attempt, 700);
      }

      if (wrap) {
        var oneClick = function (e) {
          if (clicked) return;
          e.preventDefault();
          var rect = wrap.getBoundingClientRect();
          var sliderRect = sliderEl ? sliderEl.getBoundingClientRect() : { left: 0, width: 0 };
          var sliderCenter = (sliderRect.left - rect.left) + sliderRect.width / 2;
          var zoneStart = rect.width * (zoneLeft / 100);
          var zoneEnd = rect.width * ((zoneLeft + zoneWidth) / 100);
          var hit = sliderCenter >= zoneStart && sliderCenter <= zoneEnd;
          roundResult(hit);
          wrap.removeEventListener('click', oneClick);
          wrap.removeEventListener('touchend', oneClick);
        };
        wrap.addEventListener('click', oneClick);
        wrap.addEventListener('touchend', oneClick);
      }
    }

    attempt();
  }

  // —— Game 3: Dodge signal (wait, then press in time) ——
  function runDodgeSignal(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var mult = dexTimeMult(opts);
    var windowMs = Math.floor((Math.max(280, 520 - (level - 1) * 50)) * mult);
    var successes = 0;
    var attempts = 0;
    var maxAttempts = 3;

    function attempt() {
      attempts += 1;
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_dodge') + '</p>' +
        '<p class="minigame-round">' + attempts + '/' + maxAttempts + '</p>' +
        '<p id="minigame-dodge-prompt" class="minigame-wait-prompt">' + t('minigame_wait_signal') + '</p>' +
        '<p id="minigame-dodge-signal" class="minigame-dodge-signal" style="display:none;">' + t('minigame_dodge_now') + '</p>' +
        '<button type="button" id="minigame-dodge-tap" class="minigame-tap-button minigame-tap-big" style="margin-top:12px;">' + t('minigame_dodge_tap_btn') + '</button>'
      );

      var promptEl = getEl('minigame-dodge-prompt');
      var signalEl = getEl('minigame-dodge-signal');
      var tapBtn = getEl('minigame-dodge-tap');
      var delay = 800 + Math.random() * 1400;
      var signalShown = false;
      var resolved = false;

      function resolve(success) {
        if (resolved) return;
        resolved = true;
        if (success) successes += 1;
        if (successes >= 2 || attempts >= maxAttempts) {
          setContent('<p class="minigame-result ' + (successes >= 2 ? 'win' : 'lose') + '">' + (successes >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(successes >= 2); }, 1200);
          return;
        }
        setTimeout(attempt, 700);
      }

      var keyOrClick = function (e) {
        if (!signalShown) {
          resolve(false);
          if (promptEl) promptEl.textContent = t('minigame_too_early');
          document.removeEventListener('keydown', keyOrClick);
          document.removeEventListener('click', keyOrClick);
          return;
        }
        resolve(true);
        document.removeEventListener('keydown', keyOrClick);
        document.removeEventListener('click', keyOrClick);
      };

      document.addEventListener('keydown', keyOrClick);
      document.addEventListener('click', keyOrClick);
      if (tapBtn) tapBtn.addEventListener('click', function (e) { e.preventDefault(); keyOrClick(e); });

      setTimeout(function () {
        if (resolved) return;
        signalShown = true;
        if (promptEl) promptEl.style.display = 'none';
        if (signalEl) signalEl.style.display = 'block';
        setTimeout(function () {
          if (resolved) return;
          resolve(false);
          if (signalEl) signalEl.textContent = t('minigame_too_late');
        }, windowMs);
      }, delay);
    }

    attempt();
  }

  // —— Game 4: Reaction (wait for signal, then click fast) ——
  function runReaction(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var mult = dexTimeMult(opts);
    var maxReactMs = Math.floor((Math.max(280, 480 - (level - 1) * 45)) * mult);
    var successes = 0;
    var attempts = 0;
    var maxAttempts = 3;

    function attempt() {
      attempts += 1;
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_reaction') + '</p>' +
        '<p class="minigame-round">' + attempts + '/' + maxAttempts + '</p>' +
        '<p id="minigame-react-prompt" class="minigame-wait-prompt">' + t('minigame_reaction_wait') + '</p>' +
        '<button type="button" id="minigame-react-btn" class="minigame-tap-button minigame-tap-big" disabled>' + t('minigame_reaction_btn') + '</button>'
      );
      var promptEl = getEl('minigame-react-prompt');
      var btn = getEl('minigame-react-btn');
      var signalTime = 0;
      var reacted = false;

      var delay = 1200 + Math.random() * 1500;
      var tShow = setTimeout(function () {
        if (reacted) return;
        signalTime = Date.now();
        if (promptEl) promptEl.textContent = t('minigame_reaction_go');
        if (btn) btn.disabled = false;
        tFail = setTimeout(function () {
          if (reacted) return;
          onReact(false);
        }, Math.floor((Math.max(520, 980 - (level - 1) * 90)) * mult));
      }, delay);
      var tFail = null;

      function onReact(success) {
        if (success !== undefined && success === false) {
          reacted = true;
          clearTimeout(tShow);
          if (tFail) clearTimeout(tFail);
          if (successes >= 2 || attempts >= maxAttempts) {
            setContent('<p class="minigame-result lose">' + t('minigame_lose') + '</p>');
            setTimeout(function () { done(successes >= 2); }, 1200);
          } else {
            setTimeout(attempt, 600);
          }
          return;
        }
        if (reacted) return;
        reacted = true;
        clearTimeout(tShow);
        if (tFail) clearTimeout(tFail);
        var elapsed = signalTime > 0 ? Date.now() - signalTime : 9999;
        var hit = signalTime > 0 && elapsed <= maxReactMs;
        if (hit) successes += 1;
        if (successes >= 2 || attempts >= maxAttempts) {
          setContent('<p class="minigame-result ' + (successes >= 2 ? 'win' : 'lose') + '">' + (successes >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(successes >= 2); }, 1200);
        } else {
          setTimeout(attempt, 600);
        }
      }
      if (btn) btn.addEventListener('click', onReact, { once: true });
    }
    attempt();
  }

  // —— Game 5: Two targets (click the lit one) ——
  function runTwoTargets(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var maxRounds = level >= 4 ? 6 : 5;
    var hitsNeeded = level >= 4 ? 5 : 4;
    var hits = 0;
    var rounds = 0;

    function round() {
      rounds += 1;
      var lit = Math.random() < 0.5 ? 0 : 1;
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_twotargets') + '</p>' +
        '<p class="minigame-round">' + rounds + '/' + maxRounds + '</p>' +
        '<div class="minigame-buttons" style="gap:16px;">' +
        '<button type="button" class="minigame-whack-cell minigame-twotarget-btn' + (lit === 0 ? ' minigame-whack-lit' : '') + '" data-idx="0">A</button>' +
        '<button type="button" class="minigame-whack-cell minigame-twotarget-btn' + (lit === 1 ? ' minigame-whack-lit' : '') + '" data-idx="1">B</button>' +
        '</div>'
      );
      var btns = document.querySelectorAll('.minigame-twotarget-btn');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var idx = parseInt(b.getAttribute('data-idx'), 10);
          if (idx === lit) hits += 1;
          if (hits >= hitsNeeded || rounds >= maxRounds) {
            setContent('<p class="minigame-result ' + (hits >= hitsNeeded ? 'win' : 'lose') + '">' + (hits >= hitsNeeded ? t('minigame_win') : t('minigame_lose')) + '</p><p class="minigame-wait-prompt">' + hits + '/' + maxRounds + '</p>');
            setTimeout(function () { done(hits >= hitsNeeded); }, 1200);
          } else {
            setTimeout(round, Math.max(300, 500 - (level - 1) * 40));
          }
        }, { once: true });
      });
    }
    round();
  }

  // —— Game 6: Hold and release (release when bar in green zone) ——
  function runHoldRelease(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var zoneSize = Math.max(8, 20 - (level - 1) * 3);
    var zoneMin = 80 - zoneSize / 2;
    var zoneMax = 80 + zoneSize / 2;
    var holdDuration = Math.max(1000, 2000 - (level - 1) * 200);
    var hits = 0;
    var attempts = 0;

    function attempt() {
      attempts += 1;
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_hold') + '</p>' +
        '<p class="minigame-round">' + attempts + '/3</p>' +
        '<div class="minigame-timing-bar-wrap minigame-stop-wrap" style="height:28px;">' +
        '<div class="minigame-timing-zone minigame-stop-zone" style="left:' + zoneMin + '%; width:' + (zoneMax - zoneMin) + '%;"></div>' +
        '<div id="minigame-hold-fill" class="minigame-stop-fill" style="width:0%;"></div>' +
        '</div>' +
        '<button type="button" id="minigame-hold-btn" class="minigame-tap-button minigame-tap-big" style="margin-top:12px;">' + t('minigame_hold_btn') + '</button>'
      );
      var fillEl = getEl('minigame-hold-fill');
      var btn = getEl('minigame-hold-btn');
      var startHold = 0;
      var released = false;
      var releaseValue = 0;

      function onDown() {
        if (released) return;
        startHold = Date.now();
        var anim = function () {
          if (released) return;
          var elapsed = Date.now() - startHold;
          var pct = Math.min(1, elapsed / holdDuration);
          releaseValue = pct * 100;
          if (fillEl) fillEl.style.width = releaseValue + '%';
          if (pct >= 1) onUp();
          else requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      }
      function onUp() {
        if (released) return;
        released = true;
        var hit = releaseValue >= zoneMin && releaseValue <= zoneMax;
        if (hit) hits += 1;
        if (hits >= 2 || attempts >= 3) {
          setContent('<p class="minigame-result ' + (hits >= 2 ? 'win' : 'lose') + '">' + (hits >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(hits >= 2); }, 1200);
        } else {
          setTimeout(attempt, 600);
        }
      }
      if (btn) {
        btn.addEventListener('mousedown', onDown);
        btn.addEventListener('mouseup', onUp);
        btn.addEventListener('mouseleave', onUp);
        btn.addEventListener('touchstart', function (e) { e.preventDefault(); onDown(); });
        btn.addEventListener('touchend', function (e) { e.preventDefault(); onUp(); });
      }
    }
    attempt();
  }

  // —— Game 7: Stop the meter (click when bar in green zone) ——
  function runStopMeter(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var zoneSize = Math.max(14, 24 - (level - 1) * 2.5);
    var zoneMin = 80 - zoneSize / 2;
    var zoneMax = 80 + zoneSize / 2;
    var fillDuration = Math.max(900, 1600 - (level - 1) * 150);
    var hits = 0;
    var attempts = 0;

    function attempt() {
      attempts += 1;
      var start = Date.now();
      var stopped = false;
      var stopValue = 0;

      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_stop') + '</p>' +
        '<p class="minigame-wait-prompt">' + attempts + '/3</p>' +
        '<div class="minigame-timing-bar-wrap minigame-stop-wrap" style="height:32px;">' +
        '<div class="minigame-timing-zone minigame-stop-zone" style="left:' + zoneMin + '%; width:' + (zoneMax - zoneMin) + '%;"></div>' +
        '<div id="minigame-stop-fill" class="minigame-stop-fill" style="width:0%;"></div>' +
        '</div>' +
        '<button type="button" id="minigame-stop-btn" class="minigame-tap-button minigame-tap-big" style="margin-top:14px;">' + t('minigame_stop_btn') + '</button>'
      );

      var fillEl = getEl('minigame-stop-fill');
      var btnEl = getEl('minigame-stop-btn');

      var anim = function () {
        if (stopped) return;
        var elapsed = Date.now() - start;
        var pct = Math.min(1, elapsed / fillDuration);
        stopValue = pct * 100;
        if (fillEl) fillEl.style.width = stopValue + '%';
        if (pct >= 1) {
          roundResult(false);
          return;
        }
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);

      function roundResult(hit) {
        if (stopped) return;
        stopped = true;
        if (hit) hits += 1;
        if (hits >= 2 || attempts >= 3) {
          setContent('<p class="minigame-result ' + (hits >= 2 ? 'win' : 'lose') + '">' + (hits >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(hits >= 2); }, 1200);
          return;
        }
        setTimeout(attempt, 700);
      }

      if (btnEl) {
        var onStop = function () {
          if (stopped) return;
          var hit = stopValue >= zoneMin && stopValue <= zoneMax;
          roundResult(hit);
        };
        btnEl.addEventListener('click', onStop);
        btnEl.addEventListener('touchend', function (e) { e.preventDefault(); onStop(); });
      }
    }
    attempt();
  }

  // —— Game 8: Sequence memory (repeat 3 symbols) ——
  var SEQ_KEYS = ['strike', 'dodge', 'spell'];

  function runSequence(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var showStepMs = Math.max(400, 700 - (level - 1) * 60);
    var labels = { strike: t('minigame_strike'), dodge: t('minigame_dodge'), spell: t('minigame_spell') };
    var wins = 0;
    var round = 0;

    function playRound() {
      round += 1;
      var sequence = [SEQ_KEYS[Math.floor(Math.random() * 3)], SEQ_KEYS[Math.floor(Math.random() * 3)], SEQ_KEYS[Math.floor(Math.random() * 3)]];
      var step = 0;

      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_sequence') + '</p>' +
        '<p class="minigame-round">' + round + '/2</p>' +
        '<p id="minigame-seq-prompt" class="minigame-wait-prompt">' + t('minigame_sequence_watch') + '</p>' +
        '<div id="minigame-seq-display" class="minigame-buttons"></div>' +
        '<div id="minigame-seq-buttons" class="minigame-buttons" style="display:none;"></div>'
      );

      var displayEl = getEl('minigame-seq-display');
      var buttonsEl = getEl('minigame-seq-buttons');
      var promptEl = getEl('minigame-seq-prompt');

      function showNext() {
        if (step >= 3) {
          if (promptEl) promptEl.textContent = t('minigame_sequence_your_turn');
          if (displayEl) displayEl.innerHTML = '';
          if (buttonsEl) {
            buttonsEl.style.display = 'flex';
            buttonsEl.innerHTML = SEQ_KEYS.map(function (k) {
              return '<button type="button" class="minigame-btn-choice" data-choice="' + k + '">' + labels[k] + '</button>';
            }).join('');
          }
          var playerSeq = [];
          SEQ_KEYS.forEach(function (k) {
            var btn = buttonsEl && buttonsEl.querySelector('[data-choice="' + k + '"]');
            if (btn) {
              btn.addEventListener('click', function () {
                playerSeq.push(k);
                if (playerSeq.length === 3) {
                  var correct = playerSeq[0] === sequence[0] && playerSeq[1] === sequence[1] && playerSeq[2] === sequence[2];
                  if (correct) wins += 1;
                  if (wins >= 2 || round >= 2) {
                    setContent('<p class="minigame-result ' + (wins >= 2 ? 'win' : 'lose') + '">' + (wins >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
                    setTimeout(function () { done(wins >= 2); }, 1200);
                  } else {
                    setTimeout(playRound, 800);
                  }
                }
              });
            }
          });
          return;
        }
        if (displayEl) displayEl.innerHTML = '<span class="minigame-seq-symbol">' + labels[sequence[step]] + '</span>';
        step += 1;
        setTimeout(showNext, showStepMs);
      }
      showNext();
    }
    playRound();
  }

  // —— Game 9: Match the icon (remember which one was shown) ——
  function runMatchIcon(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var showMs = Math.max(500, 900 - (level - 1) * 100);
    var correct = 0;
    var attempts = 0;
    var labels = { strike: t('minigame_strike'), dodge: t('minigame_dodge'), spell: t('minigame_spell') };

    function attempt() {
      attempts += 1;
      var answer = SEQ_KEYS[Math.floor(Math.random() * 3)];
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_match') + '</p>' +
        '<p class="minigame-round">' + attempts + '/3</p>' +
        '<p id="minigame-match-show" class="minigame-seq-symbol">' + labels[answer] + '</p>'
      );
      setTimeout(function () {
        setContent(
          '<p class="minigame-instruction">' + t('minigame_instruction_match') + '</p>' +
          '<p class="minigame-round">' + attempts + '/3</p>' +
          '<p class="minigame-wait-prompt">' + t('minigame_match_which') + '</p>' +
          '<div class="minigame-buttons">' +
          SEQ_KEYS.map(function (k) {
            return '<button type="button" class="minigame-btn-choice" data-choice="' + k + '">' + labels[k] + '</button>';
          }).join('') +
          '</div>'
        );
        var btns = document.querySelectorAll('.minigame-btn-choice[data-choice]');
        btns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var ok = btn.getAttribute('data-choice') === answer;
            if (ok) correct += 1;
            if (correct >= 2 || attempts >= 3) {
              setContent('<p class="minigame-result ' + (correct >= 2 ? 'win' : 'lose') + '">' + (correct >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
              setTimeout(function () { done(correct >= 2); }, 1200);
            } else {
              setTimeout(attempt, 600);
            }
          });
        });
      }, showMs);
    }
    attempt();
  }

  // —— Game 10: Whack (click the lit square in time) ——
  function runWhack(done, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var showMs = Math.max(500, 900 - (level - 1) * 100);
    var hits = 0;
    var rounds = 0;
    var maxRounds = 5;

    function round() {
      rounds += 1;
      var index = Math.floor(Math.random() * 4);
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_whack') + '</p>' +
        '<p class="minigame-wait-prompt">' + rounds + '/' + maxRounds + '</p>' +
        '<div id="minigame-whack-grid" class="minigame-whack-grid">' +
        [0, 1, 2, 3].map(function (i) {
          return '<button type="button" class="minigame-whack-cell' + (i === index ? ' minigame-whack-lit' : '') + '" data-idx="' + i + '"></button>';
        }).join('') +
        '</div>'
      );
      var grid = getEl('minigame-whack-grid');
      var resolved = false;
      function resolve(hit) {
        if (resolved) return;
        resolved = true;
        if (hit) hits += 1;
        if (hits >= 4 || rounds >= maxRounds) {
          setContent('<p class="minigame-result ' + (hits >= 4 ? 'win' : 'lose') + '">' + (hits >= 4 ? t('minigame_win') : t('minigame_lose')) + '</p><p class="minigame-wait-prompt">' + hits + '/' + maxRounds + '</p>');
          setTimeout(function () { done(hits >= 4); }, 1200);
        } else {
          setTimeout(round, 500);
        }
      }
      var timeout = setTimeout(function () { resolve(false); }, showMs);
      if (grid) {
        grid.querySelectorAll('.minigame-whack-cell').forEach(function (cell) {
          cell.addEventListener('click', function () {
            var idx = parseInt(cell.getAttribute('data-idx'), 10);
            clearTimeout(timeout);
            resolve(idx === index);
          });
        });
      }
    }
    round();
  }

  // Stop meter appears 3x so it shows up often; rapid-tap removed
  var GAMES = [runStopMeter, runStopMeter, runStopMeter, runReflexRPS, runTimingHit, runDodgeSignal, runReaction, runTwoTargets, runHoldRelease, runSequence, runMatchIcon, runWhack];

  function startMinigame(monsterChar, onWin, onLose, monsterMarker) {
    showOverlay(monsterChar);
    var baseLevel = getMinigameLevel();
    var playerStats = null;
    if (typeof Sp.getStoredCharacter === 'function') {
      var char = Sp.getStoredCharacter('adventure');
      if (char && char.stats) playerStats = char.stats;
    }
    var level = getEffectiveMinigameLevel(baseLevel, monsterMarker, playerStats);
    var opts = {
      level: level,
      playerStats: playerStats || {},
      monsterStats: monsterMarker ? { str: monsterMarker._monsterStr, dex: monsterMarker._monsterDex, int: monsterMarker._monsterInt, level: monsterMarker._monsterLevel } : {}
    };
    var game = GAMES[Math.floor(Math.random() * GAMES.length)];
    game(function (won) {
      setTimeout(function () {
        hideOverlay();
        if (won && typeof onWin === 'function') onWin();
        else if (!won && typeof onLose === 'function') onLose();
      }, 100);
    }, opts);
  }

  Sp.startMinigame = startMinigame;
})();
