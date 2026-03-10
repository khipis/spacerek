/**
 * Local LLM (Transformers.js) for animal/NPC replies. Uses GPT-2 small for better context than DistilGPT-2.
 * Polish: static templates. English: Xenova/gpt2 in browser (~125M params, better at following conversation).
 */

const POLISH_TEMPLATES = [
  'Jestem bardzo głodna, zjadłabym marcheweczkę!',
  'Szukam marchewki… masz może?',
  'O, cześć! Marchewka by mi nie zaszkodziła.',
  'Pssst! Gdzie tu można dostać marchewkę?',
  'Marcheweczka to mój przysmak. Masz?',
  'Brzuszek mi burczy… marchewka by pomogła!',
  'Hej! Nie widziałeś tu marchewki?',
  'Dzień dobry! Pięknie dziś, prawda?',
  'O, ktoś przyszedł! Cieszę się.',
  'Nie bój się, nie gryzę. Chyba że masz marchewkę…',
  'Słoneczko takie ładne. Chciałabym poleżeć w trawie.',
  'Szukam przyjaciół. Zostawisz mi marcheweczkę?',
  'Uwielbiam te okolice. Tu zawsze coś pachnie.',
  'Cześć! Masz może coś do przegryzienia?',
  'Nie śpiesz się. Spacer to przyjemność.',
  'Brzuszek mi już nie burczy, ale marchewka zawsze mile widziana!',
  'Hej, hej! Miło kogoś spotkać.',
  'Dziś taki spokój. Dobrze że jesteś.',
  'Nie widziałeś tu innych? Czasem bywam samotna.',
  'Marchewka to mój ulubiony przysmak. Serio!',
  'Pogoda idealna na spacer. Idziesz daleko?',
  'O, człowiek! Zwykle widzę tylko ptaki.',
  'Mógłbyś nie hałasować? Ale… cześć.',
  'Szukam czegoś słodkiego. Marchewka by pasowała.',
  'Dzień jak co dzień. Ale fajnie że ktoś przechodzi.',
  'Nie mam nic przeciwko towarzystwu. Masz marchewkę?',
  'Hej! Tu bezpiecznie. Można odpocząć.',
  'Czasem tu przychodzę i myślę. Dziś myślę o marchewce.',
  'Nie bój się. Jestem przyjazna.',
  'Piękny dzień na spotkanie! Masz coś do jedzenia?',
  'O, cześć! Szukam właśnie kogoś miłego.',
  'Marchewka to zdrowie. Wiesz?',
  'Dobrze że przechodzisz. Tu bywa nudno.',
  'Hej! Nie widziałeś mojej mamy? A marchewki?',
  'Lubię ludzi. Zwłaszcza z przekąskami.',
  'Dzień dobry! Idziesz na spacer? Ja też.',
  'Nie śpiesz się. Zostań chwilę.',
  'Brzuszek już OK, ale marchewka to zawsze prezent.',
  'Cześć! Fajnie że jesteś. Masz coś na ząb?',
  'Tu zwykle cicho. Miło usłyszeć czyjeś kroki.',
  'Nie gryzę. Chyba że chodzi o marchewkę – wtedy zjem.',
  'Pogoda super. Dobrze że wyszłeś.',
  'Szukam kogoś, kto ma marchewkę. To ty?',
  'O, człowiek! Często tu nie zaglądacie.',
  'Dzień dobry! Masz może odrobinę marchewki?',
  'Lubię te ścieżki. I lubię spotkania.',
  'Hej! Nie bój się. Jestem przyjazna.',
  'Marchewka to mój ulubiony prezent. Wiesz?',
  'Spokojny dzień. Miło że ktoś przyszedł.',
  'Cześć! Szukam czegoś do zjedzenia. Marchewka?',
  'Nie mam nic przeciwko ludziom. Zwłaszcza z jedzeniem.',
  'Pięknie dziś. Zostań chwilę, pogadajmy.',
  'O, gość! Masz może coś słodkiego? Marchewka?',
  'Dobrze że jesteś. Tu czasem bywa strasznie cicho.',
  'Hej! Nie widziałeś tu innych takich jak ja?',
  'Marchewka to zawsze dobry pomysł. Zgadzasz się?',
  'Dzień dobry! Idziesz daleko? Weź marchewkę.',
  'Lubię kiedy ktoś przechodzi. Zwłaszcza z przekąską.',
  'Nie śpiesz się. Marchewka może poczekać. Albo nie.',
  'Cześć! Tu ładnie, prawda? I bezpiecznie.',
  'Szukam przyjaciół. I marchewek. W tej kolejności. Nie.',
  'Pogoda idealna. I ty tu. Super.',
  'O, ktoś! Cieszę się. Masz coś do zjedzenia?',
  'Hej! Nie bój się. Chcę tylko pogadać. I może marchewkę.',
  'Marcheweczka by mi nie zaszkodziła. Masz?',
  'Dzień jak zwykle. Ale ty jesteś – to już nie zwykle.',
  'Nie gryzę. Obiecuję. Chyba że to marchewka.',
  'Spokojnie tu. Zostań. Masz marchewkę?',
  'Cześć! Szukam kogoś miłego. I marchewki. Oboje.',
  'Piękny dzień. Dobrze że wyszedłeś. I że mnie spotkałeś.',
  'O, człowiek! Często tu nie bywacie. Szkoda.',
  'Hej! Masz może odrobinę marchewki? Proszę?',
  'Lubię te okolice. I lubię gości z przekąskami.',
  'Dzień dobry! Nie śpiesz się. Pogadajmy. Marchewka?',
  'Nie bój się. Jestem mała i przyjazna. I głodna.',
  'Szukam czegoś do zjedzenia. Marchewka by była idealna.',
  'Tu zawsze ładnie. Dziś szczególnie – bo jesteś ty.',
  'Cześć! Nie widziałeś mojej rodziny? A marchewki?',
  'Marchewka to mój przysmak. Wiesz, taki od serca.',
  'Pogoda super. Idziesz na spacer? Ja też. Marchewka?',
  'O, gość! Miło. Masz coś na ząb?',
  'Hej! Brzuszek mi burczy. Marchewka by pomogła.',
  'Dobrze że przechodzisz. Tu bywa samotnie.',
  'Nie śpiesz się. Zostań. Opowiem ci coś. Za marchewkę.',
  'Dzień dobry! Szukam przyjaciół. I jedzenia. Głównie jedzenia.',
  'Lubię ludzi. Zwłaszcza tych z marchewką.',
  'Cześć! Tu bezpiecznie. Można usiąść. I zjeść marchewkę.',
  'Piękny dzień. I ty. I może marchewka?',
  'O, ktoś przyszedł! Cieszę się. Masz marchewkę?',
  'Hej! Nie bój się. Chcę tylko pogadać. I zjeść.',
  'Marcheweczka to zawsze dobry pomysł. Masz?',
  'Spokojny dzień. Miło że ktoś zagląda. Z marchewką?',
  'Szukam kogoś miłego. I marchewki. Ty jesteś miły. A marchewka?',
  'Dzień jak co dzień. Ale spotkanie z tobą – nie codzienne.',
  'Nie gryzę. Naprawdę. Marchewkę – tak.',
  'Cześć! Fajnie że jesteś. Masz coś do przegryzienia?',
  'Tu zwykle cicho. Dziś głośniej – bo ty. I może marchewka?',
  'Pogoda idealna. Zostań chwilę. Pogadajmy. Marchewka?',
  'O, człowiek! Masz może odrobinę marchewki? Proszę?',
  'Hej! Szukam przyjaciół. I marchewek. Wiesz jak to jest.',
  'Marchewka to mój ulubiony przysmak. Serio. Masz?',
  'Dobrze że jesteś. Tu bywa nudno. Marchewka by rozjaśniła dzień.',
  'Lubię kiedy ktoś przechodzi. Zwłaszcza z marchewką.',
  'Nie śpiesz się. Marchewka może poczekać. Ja nie.',
  'Cześć! Nie widziałeś tu innych? I marchewki?',
  'Pięknie dziś. Dobrze że wyszedłeś. I że mnie spotkałeś. Marchewka?',
  'O, gość! Cieszę się. Masz coś słodkiego?',
  'Dzień dobry! Idziesz daleko? Weź mnie. I marchewkę.',
  'Hej! Brzuszek OK, ale marchewka to zawsze mile widziana.',
  'Szukam czegoś do zjedzenia. Marchewka? Masz?',
  'Tu ładnie. Zostań. Pogadajmy. I zjedzmy marchewkę.',
  'Nie bój się. Jestem przyjazna. I głodna. Marchewka?',
  'Cześć! Masz może marchewkę? Proszę?',
  'Spokojny dzień. I ty. I może marchewka. Idealnie.'
];

const ENGLISH_FALLBACKS = [
  "I'm so hungry, I could eat a carrot!",
  "Looking for a carrot... have you got one?",
  "Hi! A carrot would be nice.",
  "Where can I find a carrot around here?",
  "Carrots are my favourite. Got any?",
  "Good day! Lovely weather, isn't it?",
  "Oh, someone came! I'm glad.",
  "Don't be scared, I don't bite. Unless you have a carrot…",
  "The sun is so nice. I'd love to lie in the grass.",
  "I'm looking for friends. Will you leave me a carrot?",
  "I love it here. Something always smells good.",
  "Hi! Got anything to snack on?",
  "Don't rush. A walk is a pleasure.",
  "My tummy's not rumbling anymore, but a carrot is always welcome!",
  "Hey, hey! Nice to meet someone.",
  "So peaceful today. Good that you're here.",
  "Have you seen any others? Sometimes I get lonely.",
  "Carrot is my favourite treat. Really!",
  "Perfect weather for a walk. Going far?",
  "Oh, a human! I usually only see birds.",
  "Could you not make noise? But… hi.",
  "Looking for something sweet. A carrot would do.",
  "Same as every day. But nice that someone's passing by.",
  "I don't mind company. Got a carrot?",
  "Hey! It's safe here. You can rest.",
  "Sometimes I come here and think. Today I'm thinking about carrots.",
  "Don't be scared. I'm friendly.",
  "Lovely day for a meeting! Got something to eat?",
  "Oh, hi! I'm actually looking for someone nice.",
  "Carrots are healthy. You know?",
  "Good that you're passing by. It gets boring here.",
  "Hey! Have you seen my mum? And a carrot?",
  "I like humans. Especially with snacks.",
  "Good day! Out for a walk? Me too.",
  "Don't rush. Stay a while.",
  "Tummy's fine, but a carrot is always a gift.",
  "Hi! Nice that you're here. Got something to munch?",
  "It's usually quiet here. Nice to hear someone's steps.",
  "I don't bite. Unless it's a carrot – then I'll eat it.",
  "Weather's great. Good that you came out.",
  "Looking for someone with a carrot. Is that you?",
  "Oh, a human! You don't come here often.",
  "Good day! Got a little carrot maybe?",
  "I like these paths. And I like meetings.",
  "Hey! Don't be scared. I'm friendly.",
  "Carrot is my favourite present. You know?",
  "Quiet day. Nice that someone came.",
  "Hi! Looking for something to eat. Carrot?",
  "I don't mind humans. Especially with food.",
  "Lovely today. Stay a while, let's chat.",
  "Oh, a guest! Got something sweet? A carrot?",
  "Good that you're here. It gets really quiet sometimes.",
  "Hey! Have you seen others like me?",
  "Carrot is always a good idea. Don't you think?",
  "Good day! Going far? Bring a carrot.",
  "I like when someone passes by. Especially with a snack.",
  "Don't rush. A carrot can wait. Or not.",
  "Hi! It's nice here, right? And safe.",
  "Looking for friends. And carrots. In that order. No.",
  "Perfect weather. And you're here. Great.",
  "Oh, someone! I'm glad. Got something to eat?",
  "Hey! Don't be scared. I just want to chat. And maybe a carrot.",
  "A little carrot wouldn't hurt. Got one?",
  "Same as usual. But you're here – that's not usual.",
  "I don't bite. Promise. Unless it's a carrot.",
  "It's peaceful here. Stay. Got a carrot?",
  "Hi! Looking for someone nice. And a carrot. Both.",
  "Lovely day. Good that you came out. And that you met me.",
  "Oh, a human! You don't come here often. Shame.",
  "Hey! Got a little carrot maybe? Please?",
  "I like this area. And I like guests with snacks.",
  "Good day! Don't rush. Let's chat. Carrot?",
  "Don't be scared. I'm small and friendly. And hungry.",
  "Looking for something to eat. A carrot would be ideal.",
  "It's always nice here. Today especially – because you're here.",
  "Hi! Have you seen my family? And a carrot?",
  "Carrot is my favourite treat. You know, from the heart.",
  "Weather's great. Out for a walk? Me too. Carrot?",
  "Oh, a guest! Nice. Got something to munch?",
  "Hey! My tummy's rumbling. A carrot would help.",
  "Good that you're passing by. It gets lonely here.",
  "Don't rush. Stay. I'll tell you something. For a carrot.",
  "Good day! Looking for friends. And food. Mainly food.",
  "I like humans. Especially with carrots.",
  "Hi! It's safe here. You can sit. And eat a carrot.",
  "Lovely day. And you. And maybe a carrot?",
  "Oh, someone came! I'm glad. Got a carrot?",
  "Hey! Don't be scared. I just want to chat. And eat.",
  "A little carrot is always a good idea. Got one?",
  "Quiet day. Nice that someone dropped by. With a carrot?",
  "Looking for someone nice. And a carrot. You're nice. Got a carrot?",
  "Same as every day. But meeting you – not every day.",
  "I don't bite. Really. A carrot – yes.",
  "Hi! Nice that you're here. Got something to snack on?",
  "It's usually quiet here. Louder today – because of you. And maybe a carrot?",
  "Perfect weather. Stay a while. Let's chat. Carrot?",
  "Oh, a human! Got a little carrot maybe? Please?",
  "Hey! Looking for friends. And carrots. You know how it is.",
  "Carrot is my favourite treat. Really. Got any?",
  "Good that you're here. It gets boring. A carrot would brighten the day.",
  "I like when someone passes by. Especially with a carrot.",
  "Don't rush. A carrot can wait. I can't.",
  "Hi! Have you seen any others? And a carrot?",
  "Lovely today. Good that you came out. And that you met me. Carrot?",
  "Oh, a guest! I'm glad. Got something sweet?",
  "Good day! Going far? Take me. And a carrot.",
  "Hey! Tummy's OK, but a carrot is always welcome.",
  "Looking for something to eat. A carrot? Got any?",
  "It's nice here. Stay. Let's chat. And eat a carrot.",
  "Don't be scared. I'm friendly. And hungry. Carrot?",
  "Hi! Got a carrot maybe? Please?",
  "Quiet day. And you. And maybe a carrot. Perfect."
];

let generatorPromise = null;

function getPolishQuest(animalName) {
  const template = POLISH_TEMPLATES[Math.floor(Math.random() * POLISH_TEMPLATES.length)];
  return (animalName ? animalName + ' mówi: ' : '') + template;
}

function getEnglishFallback(animalName) {
  const template = ENGLISH_FALLBACKS[Math.floor(Math.random() * ENGLISH_FALLBACKS.length)];
  return (animalName ? animalName + ' says: ' : '') + template;
}

/** Xenova/gpt2 = better context but heavier; Xenova/distilgpt2 = smaller, loads faster on GitHub Pages. */
const TEXT_GEN_MODEL = 'Xenova/gpt2';
const FALLBACK_MODEL = 'Xenova/distilgpt2';

if (typeof window !== 'undefined') {
  window.Spacerek = window.Spacerek || {};
  window.Spacerek.llmModuleLoaded = true;
}

let fallbackModelTried = false;

async function loadGenerator() {
  if (generatorPromise && generatorPromise !== null) return generatorPromise;
  if (generatorPromise === false) return false;
  const modelToTry = fallbackModelTried ? FALLBACK_MODEL : TEXT_GEN_MODEL;
  try {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0');
    const pipelinePromise = pipeline('text-generation', modelToTry, { progress_callback: null });
    generatorPromise = pipelinePromise;
    const gen = await pipelinePromise;
    if (typeof window !== 'undefined') {
      window.Spacerek = window.Spacerek || {};
      window.Spacerek.llmAvailable = true;
    }
    return gen;
  } catch (e) {
    console.warn('Animal quest LLM load failed (' + modelToTry + ')', e);
    generatorPromise = null;
    if (!fallbackModelTried) {
      fallbackModelTried = true;
      return loadGenerator();
    }
    generatorPromise = false;
    if (typeof window !== 'undefined') {
      window.Spacerek = window.Spacerek || {};
      window.Spacerek.llmAvailable = false;
    }
    return false;
  }
}

/**
 * Generate a short "quest" sentence for the animal (first message).
 * @param {string} animalName - e.g. "Puszystek"
 * @param {string} lang - 'pl' or 'en'
 * @returns {Promise<string>} Full line to show
 */
export async function generateAnimalQuest(animalName, lang) {
  if (lang === 'pl') {
    return getPolishQuest(animalName || 'Zwierzątko');
  }

  const gen = await loadGenerator();
  if (!gen) return getEnglishFallback(animalName || 'Animal');

  const prompt = 'The ' + (animalName || 'animal') + ' says: ';
  try {
    const result = await gen(prompt, {
      max_new_tokens: 22,
      temperature: 0.8,
      do_sample: true
    });
    const full = (result && result[0] && result[0].generated_text) ? result[0].generated_text : '';
    const afterPrompt = full.indexOf(prompt) === 0 ? full.slice(prompt.length) : full;
    let line = afterPrompt.trim().replace(/\n.*/g, '').trim();
    if (line.length > 80) line = line.slice(0, 77) + '...';
    if (!line) return getEnglishFallback(animalName);
    return prompt.trim() + ' ' + line;
  } catch (e) {
    console.warn('Animal quest generation failed', e);
    return getEnglishFallback(animalName);
  }
}

/**
 * Generate the animal's next reply from full conversation context (EN only).
 * @param {string} animalName - e.g. "Squirrel"
 * @param {string} lang - 'pl' or 'en'
 * @param {Array<{who: string, text: string}>} messages - full conversation so far (them + player)
 * @returns {Promise<string|null>} Next animal line, or null to use fallback
 */
export async function generateAnimalReplyFromContext(animalName, lang, messages) {
  if (!messages || !messages.length) return null;
  /* Always generate in English; model is EN. Caller may show reply with AI badge for any UI language. */

  const gen = await loadGenerator();
  if (!gen) return null;

  const name = animalName || 'Animal';
  const lastMsg = messages[messages.length - 1];
  const humanJustSaid = lastMsg && lastMsg.who === 'player' ? lastMsg.text : '';
  const prevLines = messages.slice(0, -1).map((m) =>
    m.who === 'them' ? name + ': ' + m.text : 'Human: ' + m.text
  );
  const context = prevLines.length ? prevLines.join('\n') + '\n' : '';
  const prompt =
    context +
    'Human just said: "' +
    humanJustSaid.replace(/"/g, "'") +
    '"\n' +
    name +
    ' must reply directly to that in one short friendly sentence. ' +
    name +
    ': ';

  try {
    const result = await gen(prompt, {
      max_new_tokens: 45,
      temperature: 0.85,
      do_sample: true
    });
    const full = (result && result[0] && result[0].generated_text) ? result[0].generated_text : '';
    const afterPrompt = full.startsWith(prompt) ? full.slice(prompt.length) : full;
    let line = afterPrompt.trim().split('\n')[0].trim();
    if (line.length > 100) line = line.slice(0, 97) + '...';
    if (!line) return null;
    return line;
  } catch (e) {
    console.warn('Animal reply from context failed', e);
    return null;
  }
}

/**
 * Generate NPC's next reply from full conversation context (EN only). Fantasy NPC (Guard, Merchant, etc.).
 * @param {string} npcName - e.g. "Guard", "Merchant"
 * @param {string} lang - 'pl' or 'en'
 * @param {Array<{who: string, text: string}>} messages - full conversation so far
 * @returns {Promise<string|null>} Next NPC line, or null to use fallback
 */
export async function generateNpcReplyFromContext(npcName, lang, messages) {
  if (!messages || !messages.length) return null;
  /* Always generate in English; model is EN. Caller may show reply with AI badge for any UI language. */

  const gen = await loadGenerator();
  if (!gen) return null;

  const name = npcName || 'NPC';
  const lastMsg = messages[messages.length - 1];
  const travelerJustSaid = lastMsg && lastMsg.who === 'player' ? lastMsg.text : '';
  const prevLines = messages.slice(0, -1).map((m) =>
    m.who === 'them' ? name + ': ' + m.text : 'Traveler: ' + m.text
  );
  const context = prevLines.length ? prevLines.join('\n') + '\n' : '';
  const prompt =
    context +
    'Traveler just said: "' +
    travelerJustSaid.replace(/"/g, "'") +
    '"\n' +
    name +
    ' must answer that in one short in-character sentence. ' +
    name +
    ': ';

  try {
    const result = await gen(prompt, {
      max_new_tokens: 50,
      temperature: 0.85,
      do_sample: true
    });
    const full = (result && result[0] && result[0].generated_text) ? result[0].generated_text : '';
    const afterPrompt = full.startsWith(prompt) ? full.slice(prompt.length) : full;
    let line = afterPrompt.trim().split('\n')[0].trim();
    if (line.length > 120) line = line.slice(0, 117) + '...';
    if (!line) return null;
    return line;
  } catch (e) {
    console.warn('NPC reply from context failed', e);
    return null;
  }
}

// Expose globally for vanilla script usage (map.js)
if (typeof window !== 'undefined') {
  window.generateAnimalQuest = generateAnimalQuest;
  window.generateAnimalReplyFromContext = generateAnimalReplyFromContext;
  window.generateNpcReplyFromContext = generateNpcReplyFromContext;
  // Preload model in background so first NPC reply is faster (especially on GitHub Pages)
  setTimeout(function () {
    loadGenerator().catch(function () {});
  }, 1500);
}
