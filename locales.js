/**
 * Locales – UI labels. To add a language: copy the pl or en object and translate the values.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'spacerek_lang';

  var LOCALES = {
    pl: {
      // Start screen
      app_title: 'Spacerek – spacer w ciemno',
      start_tagline: 'Odkryj miejsce w okolicy – spacer w ciemno',
      start_instruction_distance: 'Wybierz zasięg spaceru:',
      start_instruction_world_size: 'Wielkość świata:',
      start_instruction_attractions: 'Liczba atrakcji do zebrania:',
      start_instruction_map_style: 'Tryb:',
      start_btn_start: 'Rozpocznij spacer',
      start_btn_experience: '🏆 Twoje doświadczenie',
      start_btn_experience_title: 'Twoje doświadczenie',
      mode_adventure: 'Przygoda',
      mode_stroll: 'Spacer',
      mode_cute: 'Słodki',
      character_label: 'Twoja postać',
      character_reroll: '🎲 Losuj',
      character_reroll_title: 'Wylosuj nową postać',
      character_rename: '✏️ Zmień imię',
      character_rename_title: 'Zmień imię postaci',
      character_level: 'Poziom {level}',
      character_strength: 'Siła',
      character_dexterity: 'Zręczność',
      character_intelligence: 'Inteligencja',

      // Map and status
      map_status_loading: 'Ładowanie lokalizacji…',
      map_style_label: 'Tryb:',
      map_style_select_title: 'Zmień tryb',
      map_loading_searching: 'Szukam miejsca w okolicy…',

      // Walk
      walk_hint_collected: 'Zebrane: {count}/{total}',
      walk_walking_hint: 'Spaceruj w kierunku celu. Gdy dojdziesz, miejsce się ujawni.',
      walk_hint_distance: 'Odległość do celu: – m',
      walk_hint_distance_value: 'Odległość do celu: {m} m',
      walk_hint_distance_to_goal: 'Do najbliższej atrakcji: {m} m',
      walk_hint_all_collected: 'Wszystkie zebrane!',
      walk_btn_experience_title: 'Twoje doświadczenie',
      walk_btn_simulate_title: 'Symuluj dojście do celu (test)',
      walk_btn_simulate_label: '📍 Symuluj dojście',
      walk_btn_go_to_decoration: '🎯 Do potwora/marchewki/zwierzątka',
      walk_btn_go_to_decoration_title: 'Dojdź do zaznaczonego lub najbliższego',
      walk_go_to_decoration_none: 'Brak do zebrania w okolicy.',
      walk_btn_debug_title: 'Pokaż/ukryj debug',

      // Debug
      debug_summary_empty: 'Brak wyszukania (rozpocznij spacer).',
      debug_summary_found: 'Znaleziono: {n} miejsc. Atrakcji: {m}, zebrane: {c}/{m}.',

      // Arrival
      arrival_title: 'Dotarłeś!',
      arrival_subtitle: 'Odkrywamy to miejsce…',

      // Place card / reveal
      reveal_title: 'Oto Twoje miejsce',
      reveal_ciekawostka: 'Ciekawostka',
      reveal_btn_next: 'Następna atrakcja',
      reveal_btn_back: 'Wróć do mapy',
      reveal_btn_end: 'Zakończ spacer',
      reveal_desc_placeholder: 'Brak opisu.',

      // Experience panel
      experience_title: '🏆 Twoje doświadczenie',
      experience_mode_prefix: 'Tryb: ',
      experience_btn_close_title: 'Zamknij',
      experience_level_prefix: 'Poziom ',
      experience_btn_clear_title: 'Usuń wszystkie zapisane dane',
      experience_btn_clear_label: '🗑️ Wyczyść dane (localStorage)',
      experience_empty: 'Jeszcze nie odwiedziłeś żadnego miejsca. Rozpocznij spacer!',

      // Status messages (setStatus)
      status_getting_location: 'Pobieram Twoją lokalizację…',
      status_getting_location_ios: 'Pobieram Twoją lokalizację… (na iPhonie zezwól na dostęp, gdy Safari zapyta)',
      status_no_geolocation: 'Twoja przeglądarka nie obsługuje geolokalizacji.',
      status_location_denied: 'Potrzebujemy zgody na lokalizację.',
      status_location_error: 'Brak dostępu do lokalizacji. Włącz GPS i odśwież.',
      ios_location_denied: 'Zezwól na dostęp do lokalizacji, gdy Safari zapyta. Albo: Ustawienia > Safari > Lokalizacja.',
      ios_location_timeout: 'Czekanie na GPS trwało zbyt długo. Sprawdź: Ustawienia > Prywatność > Usługi lokalizacyjne — włącz dla Safari.',
      ios_https_hint: 'Na iPhonie Safari udostępnia lokalizację tylko przez HTTPS. Otwórz aplikację przez https:// — np. tunel ngrok (ngrok http 8000) lub wdrożoną stronę z SSL.',
      ios_banner: 'Na iPhonie aplikacja działa tylko przez HTTPS. Na komputerze: python3 -m http.server 8000. Na telefonie otwórz adres https z tunelu (ngrok) lub wdróż na serwer z SSL.',
      status_map_load_error: 'Błąd ładowania mapy',
      safari_use_server: 'Mapa nie załadowała się (np. Safari przy otwarciu z dysku). Uruchom w terminalu w folderze projektu: python3 -m http.server 8000 — potem wejdź na http://localhost:8000',
      status_searching: 'Szukam miejsc w okolicy…',
      status_no_places: 'Brak ciekawych miejsc w tym zasięgu. Spróbuj większego dystansu.',
      status_all_on_map: 'Wszystkie atrakcje na mapie. Podejdź do dowolnej – sama się ujawni.',
      status_search_error: 'Błąd wyszukiwania miejsc. Sprawdź internet i spróbuj ponownie.',
      status_go_to_next: 'Podejdź do kolejnej atrakcji.',
      status_position_error: 'Błąd odświeżania pozycji.',
      status_all_collected: 'Wszystkie atrakcje już zebrane.',

      // Tooltips and tiers
      tooltip_you: 'Ty – tu jesteś',
      tooltip_you_short: 'Ty',
      tooltip_visited: ' (odwiedzone)',
      tier_casual: 'Spacerowy',
      tier_epic: 'Epicki',
      tier_legendary: 'Legendarny',

      // Simulation
      simulate_distance: 'Odległość do celu: {m} m (symulacja…)',

      // Walk statistics
      stats_title: '📊 Statystyki spaceru',
      stats_summary: 'Podsumowanie',
      stats_places: 'Odwiedzone miejsca',
      stats_monsters: 'Spotkane potwory',
      stats_carrots: 'Zebrane marchewki',
      stats_animals: 'Spotkane zwierzątka',
      stats_discovered_list: 'Odkryte miejsca',
      stats_btn_finish: 'Zakończ',
      carrot_name: 'Marchewka'
    },

    en: {
      app_title: 'Spacerek – blind walk',
      start_tagline: 'Discover a place nearby – a walk in the dark',
      start_instruction_distance: 'Choose walk distance:',
      start_instruction_world_size: 'World size:',
      start_instruction_attractions: 'Number of places to find:',
      start_instruction_map_style: 'Mode:',
      start_btn_start: 'Start walk',
      start_btn_experience: '🏆 Your experience',
      start_btn_experience_title: 'Your experience',
      mode_adventure: 'Adventure',
      mode_stroll: 'Walk',
      mode_cute: 'Cute',
      character_label: 'Your character',
      character_reroll: '🎲 Reroll',
      character_reroll_title: 'Roll a new character',
      character_rename: '✏️ Change name',
      character_rename_title: 'Change character name',
      character_level: 'Level {level}',
      character_strength: 'Strength',
      character_dexterity: 'Dexterity',
      character_intelligence: 'Intelligence',

      map_status_loading: 'Loading location…',
      map_style_label: 'Mode:',
      map_style_select_title: 'Change mode',
      map_loading_searching: 'Searching for places…',

      walk_hint_collected: 'Collected: {count}/{total}',
      walk_walking_hint: 'Walk towards the goal. When you get there, the place will be revealed.',
      walk_hint_distance: 'Distance to goal: – m',
      walk_hint_distance_value: 'Distance to goal: {m} m',
      walk_hint_distance_to_goal: 'To nearest place: {m} m',
      walk_hint_all_collected: 'All collected!',
      walk_btn_experience_title: 'Your experience',
      walk_btn_simulate_title: 'Simulate arrival (test)',
      walk_btn_simulate_label: '📍 Simulate arrival',
      walk_btn_go_to_decoration: '🎯 Go to monster/carrot/animal',
      walk_btn_go_to_decoration_title: 'Reach selected or nearest',
      walk_go_to_decoration_none: 'Nothing left to collect nearby.',
      walk_btn_debug_title: 'Show/hide debug',

      debug_summary_empty: 'No search yet (start a walk).',
      debug_summary_found: 'Found: {n} places. Targets: {m}, collected: {c}/{m}.',

      arrival_title: "You've arrived!",
      arrival_subtitle: 'Revealing this place…',

      reveal_title: "Here's your place",
      reveal_ciekawostka: 'Did you know',
      reveal_btn_next: 'Next place',
      reveal_btn_back: 'Back to map',
      reveal_btn_end: 'End walk',
      reveal_desc_placeholder: 'No description.',

      experience_title: '🏆 Your experience',
      experience_mode_prefix: 'Mode: ',
      experience_btn_close_title: 'Close',
      experience_level_prefix: 'Level ',
      experience_btn_clear_title: 'Delete all saved data',
      experience_btn_clear_label: '🗑️ Clear data (localStorage)',
      experience_empty: "You haven't visited any place yet. Start a walk!",

      status_getting_location: 'Getting your location…',
      status_getting_location_ios: 'Getting your location… (on iPhone, allow access when Safari asks)',
      status_no_geolocation: 'Your browser does not support geolocation.',
      status_location_denied: 'We need your consent for location.',
      status_location_error: 'No access to location. Enable GPS and refresh.',
      ios_location_denied: 'Allow location access when Safari prompts. Or: Settings > Safari > Location.',
      ios_location_timeout: 'GPS took too long. Check: Settings > Privacy > Location Services — enable for Safari.',
      ios_https_hint: 'On iPhone, Safari only allows location over HTTPS. Open the app via https:// — e.g. ngrok tunnel (ngrok http 8000) or a deployed site with SSL.',
      ios_banner: 'On iPhone the app only works over HTTPS. On your computer run: python3 -m http.server 8000. On the phone open the https URL from a tunnel (ngrok) or deploy to a server with SSL.',
      status_map_load_error: 'Map loading error',
      safari_use_server: 'Map failed to load (e.g. Safari opening from disk). In the project folder run: python3 -m http.server 8000 — then open http://localhost:8000',
      status_searching: 'Searching for places…',
      status_no_places: 'No interesting places in this range. Try a longer distance.',
      status_all_on_map: 'All places on the map. Walk to any – it will reveal itself.',
      status_search_error: 'Search error. Check your connection and try again.',
      status_go_to_next: 'Walk to the next place.',
      status_position_error: 'Error updating position.',
      status_all_collected: 'All places already collected.',

      tooltip_you: "You – you're here",
      tooltip_you_short: 'You',
      tooltip_visited: ' (visited)',
      tier_casual: 'Casual',
      tier_epic: 'Epic',
      tier_legendary: 'Legendary',

      simulate_distance: 'Distance to goal: {m} m (simulation…)',

      stats_title: '📊 Walk statistics',
      stats_summary: 'Summary',
      stats_places: 'Places visited',
      stats_monsters: 'Monsters met',
      stats_carrots: 'Carrots collected',
      stats_animals: 'Animals met',
      stats_discovered_list: 'Places discovered',
      stats_btn_finish: 'Finish',
      carrot_name: 'Carrot'
    }
  };

  function getStoredLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored && LOCALES[stored] ? stored : 'pl';
    } catch (e) {
      return 'pl';
    }
  }

  function setStoredLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function t(key, replacements) {
    var lang = window.CURRENT_LOCALE || getStoredLang();
    var dict = LOCALES[lang] || LOCALES.pl;
    var value = dict[key];
    if (value == null) value = LOCALES.pl[key] || key;
    if (replacements && typeof value === 'string') {
      Object.keys(replacements).forEach(function (k) {
        value = value.replace(new RegExp('\\{' + k + '\\}', 'g'), String(replacements[k]));
      });
    }
    return value;
  }

  window.LOCALES = LOCALES;
  window.CURRENT_LOCALE = getStoredLang();
  window.t = t;
  window.getStoredLang = getStoredLang;
  window.setStoredLang = setStoredLang;
})();
