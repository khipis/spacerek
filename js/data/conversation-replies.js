/**
 * Reply lines for multi-turn NPC/animal conversations.
 * Used when player sends a message; also "happy" replies when player gives a carrot to an animal.
 */
(function () {
  'use strict';
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.conversationReplies = {
    /** Keywords that indicate player is giving a carrot (lowercase, one match enough). */
    giveCarrotKeywords: {
      pl: ['marchewkę', 'marchewke', 'marchewka', 'mam marchew', 'masz marchew', 'weź marchew', 'na masz', 'proszę weź', 'prosze wez', 'tak mam', 'dam ci', 'bierz marchew', 'trzymaj marchew', 'daję marchew', 'daje marchew', 'masz tu marchew', 'dla ciebie marchew'],
      en: ['carrot', 'have a carrot', 'here\'s a carrot', 'heres a carrot', 'take a carrot', 'take it', 'have it', 'i have a carrot', 'yes here', 'for you', 'here you go', 'give you a carrot', 'you can have', 'have this carrot']
    },
    animalHappy: {
      pl: [
        'O nie! Dziękuję! Jestem taka szczęśliwa! *mlask*',
        'Marchewka! Dziękuję, dziękuję! Jesteś wspaniały!',
        'Aaa! Dziękuję! To najlepszy prezent na świecie!',
        'O wow! Naprawdę dla mnie? Dziękuję! *zjada z radością*',
        'Dziękuję! Brzuszek będzie szczęśliwy. Jesteś super!',
        'Marcheweczka! Tak bardzo dziękuję! *podskakuje*',
        'Nie mogę uwierzyć! Dziękuję! Jesteś moim przyjacielem!',
        'O! Dziękuję! To taka dobra marchewka. Najlepszy dzień!',
        'Dziękuję, dziękuję! Jestem wniebowzięta! *mruczy z zadowolenia*',
        'Woo! Dziękuję! Zjem ją z przyjemnością. Jesteś super!'
      ],
      en: [
        'Oh my! Thank you! I\'m so happy! *munch*',
        'A carrot! Thank you, thank you! You\'re amazing!',
        'Aaa! Thank you! Best present ever!',
        'Oh wow! Really for me? Thank you! *eats happily*',
        'Thank you! My tummy will be so happy. You\'re the best!',
        'A carrot! Thank you so much! *bounces*',
        'I can\'t believe it! Thank you! You\'re my friend!',
        'Oh! Thank you! Such a nice carrot. Best day ever!',
        'Thank you, thank you! I\'m over the moon! *purrs*',
        'Woo! Thank you! I\'ll enjoy every bite. You\'re awesome!'
      ]
    },
    animalGeneric: {
      pl: [
        'Hmm, nie do końca rozumiem, ale miło pogadać!',
        'O! Ciekawe. Masz może marchewkę?',
        'Tak, tak. Słucham dalej!',
        'Fajnie że rozmawiasz. Lubię towarzystwo.',
        'Hihi. Nie wiem co powiedzieć. Marchewka?',
        'Okej! Miło. Chcesz pogadać jeszcze?',
        'Dobrze że jesteś. Co tam u ciebie?',
        'Słucham! Opowiedz coś jeszcze.',
        'Hehe. Dziękuję za rozmowę. Marchewka by nie zaszkodziła!',
        'Super. Pogadajmy jeszcze chwilę!'
      ],
      en: [
        'Hmm, not sure I get it, but nice to chat!',
        'Oh! Interesting. Got a carrot maybe?',
        'Yeah, yeah. I\'m listening!',
        'Nice that you\'re talking. I like company.',
        'Hehe. Don\'t know what to say. Carrot?',
        'Okay! Nice. Want to chat more?',
        'Good that you\'re here. How are you?',
        'I\'m listening! Tell me more.',
        'Hehe. Thanks for chatting. A carrot wouldn\'t hurt!',
        'Cool. Let\'s talk a bit more!'
      ]
    },
    npcGeneric: {
      pl: [
        'Hmm, nie wiem co na to odpowiedzieć. Idź z bogiem.',
        'Rozumiem. Uważaj na siebie w drodze.',
        'Tak, tak. Miło pogadać. Powodzenia!',
        'Ciekawe. Jeśli zobaczysz coś dziwnego – daj znać.',
        'Słucham. Masz jeszcze jakieś pytania?',
        'Dobrze. Trzymaj się ścieżki.',
        'Okej. Miłego spaceru dalej!',
        'Rozumiem. Nie mam już nic do dodania.',
        'Tak bywa. Uważaj na potwory.',
        'Dobrze że rozmawiamy. Wracaj cały.'
      ],
      en: [
        'Hmm, not sure what to say to that. Go in peace.',
        'I see. Watch yourself on the road.',
        'Yeah, yeah. Nice to chat. Good luck!',
        'Interesting. If you see something odd – let me know.',
        'I hear you. Any other questions?',
        'Alright. Stick to the path.',
        'Okay. Have a good walk.',
        'I see. I\'ve nothing more to add.',
        'That\'s how it is. Watch out for monsters.',
        'Good that we talked. Come back in one piece.'
      ]
    },
    animalNoCarrots: {
      pl: 'Nie masz teraz marchewki. Zbierz na spacerze, a potem wróć!',
      en: 'You don\'t have a carrot right now. Collect some on your walk and come back!'
    },
    /** Keywords that may offend NPCs (lowercase); one match triggers offended reaction. */
    offensiveKeywords: {
      pl: ['głupi', 'idiota', 'debil', 'kretyn', 'tępak', 'nic nie wiesz', 'zamknij się', 'odwal się', 'spadaj', 'nudziarz', 'beznadziejny'],
      en: ['stupid', 'idiot', 'dumb', 'shut up', 'piss off', 'boring', 'useless', 'loser', 'get lost', 'whatever']
    },
    /** NPC says goodbye when bored (after several messages). */
    npcBored: {
      pl: [
        'Muszę iść. Miło było pogadać.',
        'To już chyba wszystko. Powodzenia w drodze!',
        'Odejdę. Trzymaj się.',
        'Kończymy na dziś. Do zobaczenia.',
        'Mam coś do zrobienia. Idź z bogiem.'
      ],
      en: [
        'I have to go. Nice chatting.',
        'That\'s all for now. Good luck on the road!',
        'I\'m off. Take care.',
        'Let\'s call it a day. See you.',
        'I\'ve got things to do. Go in peace.'
      ]
    },
    /** NPC reacts when offended and ends conversation. */
    npcOffended: {
      pl: [
        'Nie mów tak. Do widzenia.',
        'Nie muszę tego słuchać. Odchodzę.',
        'Mam dość. Idź swoją drogą.',
        'Nie życzę sobie takiego tonu. Koniec rozmowy.',
        'To nie w porządku. Żegnaj.'
      ],
      en: [
        'Don\'t talk like that. Goodbye.',
        'I don\'t have to listen to this. I\'m leaving.',
        'I\'ve had enough. Go your way.',
        'I won\'t stand for that tone. Conversation over.',
        'That\'s not okay. Goodbye.'
      ]
    }
  };
})();
