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

  // —— Game 1: Reflex RPS (Strike / Dodge / Spell) ——
  // Strike beats Spell, Spell beats Dodge, Dodge beats Strike
  var RPS = { strike: 0, dodge: 1, spell: 2 };
  var RPS_COUNTER = { strike: 'dodge', dodge: 'spell', spell: 'strike' };

  function runReflexRPS(done) {
    var roundsWon = 0;
    var roundsTotal = 3;
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
        var pct = Math.min(1, elapsed / 800);
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
          if (elapsed >= 1000) {
            clearInterval(choiceInterval);
            if (!choiceMade) roundResult(false);
          }
        }, 50);
      }, 800);

      function roundResult(won) {
        if (roundDone) return;
        roundDone = true;
        choiceMade = true;
        clearInterval(timerInterval);
        if (won) roundsWon += 1;
        var roundsLost = roundNum - roundsWon;
        if (roundsWon >= 2 || roundsLost >= 2) {
          setContent('<p class="minigame-result ' + (roundsWon >= 2 ? 'win' : 'lose') + '">' + (roundsWon >= 2 ? t('minigame_win') : t('minigame_lose')) + '</p>');
          setTimeout(function () { done(roundsWon >= 2); }, 1200);
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
  function runTimingHit(done) {
    var hits = 0;
    var attempts = 0;
    var maxAttempts = 3;
    var zoneWidth = 24;
    var zoneLeft = 38;

    function attempt() {
      attempts += 1;
      var duration = 2200 + Math.random() * 600;
      var start = Date.now();

      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_timing') + '</p>' +
        '<p class="minigame-round">' + (attempts) + '/' + maxAttempts + '</p>' +
        '<div id="minigame-timing-wrap" class="minigame-timing-bar-wrap">' +
        '<div class="minigame-timing-zone" style="left:' + zoneLeft + '%; width:' + zoneWidth + '%;"></div>' +
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
        var oneClick = function () {
          if (clicked) return;
          var rect = wrap.getBoundingClientRect();
          var sliderRect = sliderEl ? sliderEl.getBoundingClientRect() : { left: 0, width: 0 };
          var sliderCenter = (sliderRect.left - rect.left) + sliderRect.width / 2;
          var zoneStart = rect.width * (zoneLeft / 100);
          var zoneEnd = rect.width * ((zoneLeft + zoneWidth) / 100);
          var hit = sliderCenter >= zoneStart && sliderCenter <= zoneEnd;
          roundResult(hit);
          wrap.removeEventListener('click', oneClick);
        };
        wrap.addEventListener('click', oneClick);
      }
    }

    attempt();
  }

  // —— Game 3: Dodge signal (wait, then press in time) ——
  function runDodgeSignal(done) {
    var successes = 0;
    var attempts = 0;
    var maxAttempts = 3;

    function attempt() {
      attempts += 1;
      setContent(
        '<p class="minigame-instruction">' + t('minigame_instruction_dodge') + '</p>' +
        '<p class="minigame-round">' + attempts + '/' + maxAttempts + '</p>' +
        '<p id="minigame-dodge-prompt" class="minigame-wait-prompt">' + t('minigame_wait_signal') + '</p>' +
        '<p id="minigame-dodge-signal" class="minigame-dodge-signal" style="display:none;">' + t('minigame_dodge_now') + '</p>'
      );

      var promptEl = getEl('minigame-dodge-prompt');
      var signalEl = getEl('minigame-dodge-signal');
      var delay = 800 + Math.random() * 1400;
      var windowMs = 500;
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

  // —— Game 4: Rapid tap (click as fast as possible for 3 seconds) ——
  var TAP_REQUIRED = 14;

  function runRapidTap(done) {
    var count = 0;
    var started = false;
    var endTime = 0;

    setContent(
      '<p class="minigame-instruction">' + t('minigame_instruction_tap', { n: TAP_REQUIRED }) + '</p>' +
      '<p id="minigame-tap-count" class="minigame-wait-prompt">' + t('minigame_tap_count', { n: '0' }) + '</p>' +
      '<button type="button" id="minigame-tap-btn" class="minigame-tap-button">' + t('minigame_tap_go') + '</button>'
    );

    var countEl = getEl('minigame-tap-count');
    var btn = getEl('minigame-tap-btn');

    function onTap() {
      if (!started) {
        started = true;
        if (btn) btn.textContent = t('minigame_tap_btn');
        endTime = Date.now() + 3000;
        var tick = setInterval(function () {
          if (Date.now() >= endTime) {
            clearInterval(tick);
            var won = count >= TAP_REQUIRED;
            setContent(
              '<p class="minigame-instruction">' + t('minigame_instruction_tap', { n: TAP_REQUIRED }) + '</p>' +
              '<p class="minigame-result ' + (won ? 'win' : 'lose') + '">' + (won ? t('minigame_win') : t('minigame_lose')) + '</p>' +
              '<p class="minigame-wait-prompt">' + t('minigame_tap_count', { n: count }) + ' / ' + TAP_REQUIRED + '</p>'
            );
            setTimeout(function () { done(won); }, 1400);
            return;
          }
          if (countEl) countEl.textContent = t('minigame_tap_count', { n: count });
        }, 100);
        return;
      }
      count += 1;
      if (countEl) countEl.textContent = t('minigame_tap_count', { n: count });
    }

    if (btn) {
      btn.addEventListener('click', onTap);
    }
  }

  var GAMES = [runReflexRPS, runTimingHit, runDodgeSignal, runRapidTap];

  function startMinigame(monsterChar, onWin, onLose) {
    showOverlay(monsterChar);
    var game = GAMES[Math.floor(Math.random() * GAMES.length)];
    game(function (won) {
      setTimeout(function () {
        hideOverlay();
        if (won && typeof onWin === 'function') onWin();
        else if (!won && typeof onLose === 'function') onLose();
      }, 100);
    });
  }

  Sp.startMinigame = startMinigame;
})();
