/**
 * Structured dialogue responses per intent, in Polish and English.
 * Used by responseGenerator; randomized to avoid repetition.
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  var Sp = window.Spacerek;

  Sp.dialogueData = {
    /** NPC (adventure) responses by intent. */
    npc: {
      pl: {
        greeting: [
          'Witaj, wędrowcze. Uważaj na siebie.',
          'Dzień dobry. Masz pytania?',
          'Hej. Miło cię widzieć.',
          'Witaj. Pilnuję tej okolicy.',
          'Cześć. Idź z bogiem.'
        ],
        quest_request: [
          'Mógłbyś rozprawić się z bestią w okolicy. Przyniesiesz dowód – dam ci coś w zamian.',
          'Jest tu stwór, który nie daje spokoju. Zabij go, a dostaniesz nagrodę.',
          'Mam dla ciebie zadanie: znajdź i pokonaj potwora. Wróć z wieściami.',
          'Potrzebuję kogoś odważnego. Zabiłbyś potwora? Nagroda czeka.',
          'W tych stronach grasuje coś niebezpiecznego. Zajmij się tym – wynagrodzę.'
        ],
        location_question: [
          'Trzymaj się ścieżki. Za wzgórzem w prawo.',
          'Dalej na północ. Uważaj w wąwozie.',
          'Ta droga prowadzi do wioski. Godzina marszu.',
          'Nie schodź ze szlaku. W lesie łatwo się zgubić.',
          'Idź w stronę ruin. Ale ostrożnie.'
        ],
        trade: [
          'Nie handluję tu. W wiosce znajdziesz kupca.',
          'Nie mam nic na sprzedaż. Tylko rada: uzbrój się.',
          'Nie sprzedaję. Ale jeśli zabijesz bestię – dam ci artefakt.',
          'Handel? To nie miejsce. Idź do wioski.'
        ],
        help: [
          'Uważaj na potwory. Zabijesz któregoś – przyjdź, dam ci nagrodę.',
          'Nie daj się zaskoczyć. W okolicy coś się czai.',
          'Miej broń w pogotowiu. I wracaj przed zmrokiem.',
          'Jeśli zobaczysz skrzynię – sprawdź, czy nic przy niej nie czeka.'
        ],
        goodbye: [
          'Idź z bogiem. Wracaj cały.',
          'Do zobaczenia. Uważaj na siebie.',
          'Żegnaj. Powodzenia.',
          'Miłego spaceru. Trzymaj się.'
        ],
        unknown: [
          'Hmm, nie wiem co na to. Idź z bogiem.',
          'Rozumiem. Uważaj na siebie w drodze.',
          'Ciekawe. Jeśli zobaczysz coś dziwnego – daj znać.',
          'Słucham. Masz jeszcze pytania?',
          'Tak bywa. Uważaj na potwory.'
        ]
      },
      en: {
        greeting: [
          'Hello, traveller. Watch yourself.',
          'Good day. Any questions?',
          'Hey. Good to see you.',
          'Welcome. I guard these parts.',
          'Hi. Go in peace.'
        ],
        quest_request: [
          'You could deal with the beast around here. Bring proof – I\'ll reward you.',
          'There\'s a creature causing trouble. Kill it and you\'ll get a reward.',
          'I have a task: find and defeat the monster. Come back with news.',
          'I need someone brave. Would you kill the monster? A reward awaits.',
          'Something dangerous roams these parts. Take care of it – I\'ll pay you.'
        ],
        location_question: [
          'Stick to the path. Over the hill, to the right.',
          'North from here. Watch out in the ravine.',
          'This road leads to the village. An hour\'s walk.',
          'Don\'t leave the trail. Easy to get lost in the woods.',
          'Head toward the ruins. But be careful.'
        ],
        trade: [
          'I don\'t trade here. You\'ll find a merchant in the village.',
          'I\'ve nothing to sell. Just advice: arm yourself.',
          'I don\'t sell. But if you kill the beast – I\'ll give you an artifact.',
          'Trade? This isn\'t the place. Go to the village.'
        ],
        help: [
          'Watch for monsters. Kill one – come back, I\'ll reward you.',
          'Don\'t get caught off guard. Something lurks around here.',
          'Keep your weapon ready. And be back before dark.',
          'If you see a chest – check that nothing\'s waiting by it.'
        ],
        goodbye: [
          'Go in peace. Come back in one piece.',
          'See you. Watch yourself.',
          'Farewell. Good luck.',
          'Have a good walk. Take care.'
        ],
        unknown: [
          'Hmm, not sure what to say. Go in peace.',
          'I see. Watch yourself on the road.',
          'Interesting. If you see something odd – let me know.',
          'I hear you. Any other questions?',
          'That\'s how it is. Watch out for monsters.'
        ]
      }
    },
    /** Animal (cute) responses by intent. */
    animal: {
      pl: {
        greeting: [
          'Cześć! Fajnie że jesteś.',
          'O, ktoś przyszedł! Cieszę się.',
          'Hej! Nie bój się, jestem przyjazna.',
          'Dzień dobry! Masz może marchewkę?',
          'Miło kogoś spotkać.'
        ],
        quest_request: [
          'Szukam marchewki… znajdziesz mi?',
          'Brzuszek mi burczy. Marchewka by pomogła!',
          'Chciałabym marcheweczkę. Masz?',
          'Głód dopada. Marchewka to mój przysmak.'
        ],
        location_question: [
          'Nie wiem gdzie. Tu ładnie, zostanę.',
          'Szukam tu marchewki. Nie wiem drogi.',
          'Tu jest bezpiecznie. Zostań chwilę!',
          'Nie chodzę daleko. Tu jest mój dom.'
        ],
        trade: [
          'Nie handluję. Ale marchewkę wezmę!',
          'Mam tylko przyjaźń. I głód na marchewkę.',
          'Dam ci uścisk za marchewkę!'
        ],
        help: [
          'Marchewka pomaga. Masz?',
          'Nie bój się. Jestem mała i przyjazna.',
          'Szukam przyjaciół. I marchewek.'
        ],
        goodbye: [
          'Pa! Wracaj z marchewką!',
          'Do zobaczenia! Miło było.',
          'Żegnaj! Dziękuję za pogawędkę.'
        ],
        unknown: [
          'Hmm, nie do końca rozumiem. Masz marchewkę?',
          'O! Ciekawe. Lubię towarzystwo.',
          'Słucham! Opowiedz coś jeszcze.',
          'Fajnie że rozmawiasz. Marchewka by nie zaszkodziła!'
        ]
      },
      en: {
        greeting: [
          'Hi! Nice to meet you.',
          'Oh, someone came! I\'m glad.',
          'Hey! Don\'t be scared, I\'m friendly.',
          'Good day! Got a carrot maybe?',
          'Nice to meet someone.'
        ],
        quest_request: [
          'I\'m looking for a carrot… can you find me one?',
          'My tummy\'s rumbling. A carrot would help!',
          'I\'d love a carrot. Have you got one?',
          'I\'m getting hungry. Carrot\'s my favourite.'
        ],
        location_question: [
          'I don\'t know where. It\'s nice here, I\'ll stay.',
          'Looking for carrots here. Don\'t know the way.',
          'It\'s safe here. Stay a while!',
          'I don\'t go far. This is my home.'
        ],
        trade: [
          'I don\'t trade. But I\'ll take a carrot!',
          'I only have friendship. And hunger for carrots.',
          'I\'ll give you a hug for a carrot!'
        ],
        help: [
          'Carrots help. Got any?',
          'Don\'t be scared. I\'m small and friendly.',
          'Looking for friends. And carrots.'
        ],
        goodbye: [
          'Bye! Come back with a carrot!',
          'See you! That was nice.',
          'Goodbye! Thanks for chatting.'
        ],
        unknown: [
          'Hmm, not sure I get it. Got a carrot?',
          'Oh! Interesting. I like company.',
          'I\'m listening! Tell me more.',
          'Nice that you\'re talking. A carrot wouldn\'t hurt!'
        ]
      }
    }
  };
})();
