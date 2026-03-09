/**
 * Local LLM (Transformers.js, ~85MB distilgpt2) to generate short animal "quest" lines.
 * When meeting an animal in Cute mode, generates e.g. "The squirrel says: I'm so hungry, I could eat a carrot!"
 * Polish: uses static templates (no small PL model under 100MB). English: uses distilgpt2 in browser.
 */

const POLISH_TEMPLATES = [
  'Jestem bardzo głodna, zjadłabym marcheweczkę!',
  'Szukam marchewki… masz może?',
  'O, cześć! Marchewka by mi nie zaszkodziła.',
  'Pssst! Gdzie tu można dostać marchewkę?',
  'Marcheweczka to mój przysmak. Masz?',
  'Brzuszek mi burczy… marchewka by pomogła!',
  'Hej! Nie widziałeś tu marchewki?'
];

const ENGLISH_FALLBACKS = [
  "I'm so hungry, I could eat a carrot!",
  "Looking for a carrot... have you got one?",
  "Hi! A carrot would be nice.",
  "Where can I find a carrot around here?",
  "Carrots are my favourite. Got any?"
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

async function loadGenerator() {
  if (generatorPromise) return generatorPromise;
  try {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0');
    generatorPromise = pipeline('text-generation', 'Xenova/distilgpt2', { progress_callback: null });
    return generatorPromise;
  } catch (e) {
    console.warn('Animal quest LLM load failed', e);
    generatorPromise = false;
    return false;
  }
}

/**
 * Generate a short "quest" sentence for the animal.
 * @param {string} animalName - e.g. "Puszystek"
 * @param {string} lang - 'pl' or 'en'
 * @returns {Promise<string>} Full line to show in toast
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

// Expose globally for vanilla script usage (map.js)
if (typeof window !== 'undefined') {
  window.generateAnimalQuest = generateAnimalQuest;
}
