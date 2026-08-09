/**
 * Multilingual Contact Form Validation & Profanity Filter
 * Supports 10 i18n locales: en_US, id_ID, ja_JP, ko_KR, zh_CN, de_DE, fr_FR, es_ES, pt_BR, ru_RU.
 */

// Multilingual profanity wordlist across 10 languages
const PROFANITY_WORDS = [
  // English
  "fuck", "shit", "asshole", "bitch", "bastard", "cunt", "dick", "pussy", "cock", "prick", "whore", "slut", "nigger", "faggot",
  // Indonesian
  "anjing", "babi", "kontol", "memek", "bangsat", "pantek", "jancok", "jancuk", "pantat", "itil", "peler", "kintil", "goblok", "tolol", "asu", "bajingan", "pepek", "kampret", "puang",
  // Japanese (romaji & common)
  "baka", "kuso", "yarou", "chikushou", "man ko", "chin ko",
  // Korean (romaji)
  "ssibal", "gaesaekki", "byeongsin", "jot", "jikka",
  // Chinese (pinyin)
  "caonima", "shabi", "nimabi", "wangba", "ganneima",
  // German
  "scheisse", "arschloch", "wichser", "hurensohn", "fick",
  // French
  "merde", "connard", "salope", "putain", "encule", "chienne",
  // Spanish
  "pendejo", "mierda", "cabron", "puta", "chingar", "maricon",
  // Portuguese
  "caralho", "porra", "puta", "viado", "arrombado", "bosta",
  // Russian (translit)
  "blya", "blyat", "suka", "pizdet", "pizdec", "khuy", "ebat", "nahuy"
];

// Conversational phrases that are not human names
const NON_NAME_PHRASES = new Set([
  "terima kasih", "makasih", "thank you", "thanks a lot", "apa kabar",
  "selamat pagi", "selamat siang", "selamat sore", "selamat malam",
  "good morning", "good evening", "good night", "hello world", "tes nama"
]);

// Valid single-word names that exclusively consist of home-row letters (a, s, d, f, g, h, j, k, l)
const HOME_ROW_VALID_NAMES = new Set([
  "sasha", "salma", "hasan", "hassan", "fallon", "dallas", "gala", "salas", "hadad", "falah"
]);

// Known disposable / temporary email domains commonly used for contact form spam & security testing
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "guerrillamail.org",
  "guerrillamail.net", "yopmail.com", "yopmail.fr", "trashmail.com", "trashmail.net",
  "throwawaymail.com", "sharklasers.com", "getnada.com", "dispostable.com", "temp-mail.org",
  "maildrop.cc", "mailnesia.com", "fakeinbox.com", "crazymailing.com", "generator.email",
  "emailondeck.com", "tempail.com", "mohmal.com", "burnermail.io", "mytemp.email",
  "dropmail.me", "incognitomail.com", "getairmail.com", "disposablemail.com", "fakemailgenerator.com"
]);

// Common non-name sentence words, particles & dictionary terms
// Note: "kasih" is intentionally EXCLUDED because "Kasih" is a genuine human name in Indonesia.
const NON_NAME_SENTENCE_WORDS = new Set([
  // Particles, fillers & testing terms
  "sih", "deh", "dong", "kok", "kan", "lah", "loh", "tuh", "kah", "yuk", "ya", "yah", "yak", "ye", "yo", "nih", "gitu", "gimana",
  "apakah", "siap", "tes", "test", "testing", "valid", "invalid", "demo", "sample", "dummy", "admin", "user", "null", "undefined",
  "asdf", "qwerty", "foo", "bar", "baz", "anon", "anonymous",
  // Slang, emotion, casual conversational terms & screenshot inputs
  "kasihan", "kasian", "kasihanilah", "aku", "udah", "ah", "percaya", "ajalu", "aja", "kurang", "paham", "maksudnya", "kekmana",
  "sedih", "capek", "cape", "lelah", "pusing", "ngantuk", "lapar", "haus",
  "wkwk", "wkwkwk", "haha", "hahaha", "xixi", "xixixi", "hehe", "hehehe",
  // Indonesian / Malay verbs, nouns & question words
  "tanam", "madu", "lauk", "mana", "makan", "minum", "nasi", "batu", "pintu", "rumah", "kucing", "burung", "ikan",
  "ayam", "tempe", "tahu", "sayur", "buah", "daging", "telur", "sambal", "garam", "gula", "minyak", "air", "teh", "kopi",
  "susu", "jus", "kue", "roti", "meja", "kursi", "baju", "celana", "topi", "sepatu", "buku", "pena", "kertas", "gelas",
  "sendok", "garpu", "piring", "mangkuk", "pisau", "bunga", "pohon", "daun", "rumput", "tanah", "pasir", "laut", "gunung",
  "sungai", "danau", "langit", "awan", "hujan", "angin", "matahari", "bulan", "bintang", "api", "kayu", "besi", "emas", "perak",
  "lagi", "sedang", "adalah", "yang", "ini", "itu", "dengan", "untuk", "pada", "atau", "dan", "bisa", "mau", "ingin",
  "bukan", "tidak", "gak", "ga", "ngga", "nggak", "ada", "sudah", "dah", "belum", "pernah", "buat", "bikin", "punya",
  "saya", "kamu", "dia", "mereka", "kita", "kami", "anda", "gue", "lu", "gw", "eloe", "kenapa", "bagaimana", "apa",
  "siapa", "dimana", "kapan", "halo", "hai", "tidur", "pergi", "jalan",
  // English particles, sentence & test words
  "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "like", "likes", "eat", "eating", "food", "the", "an", "this", "that", "these", "those",
  "with", "for", "from", "to", "in", "on", "at", "by", "my", "your", "his", "her", "their", "our",
  "hello", "hi", "please", "thanks", "thank", "want", "wants", "make", "makes", "doing", "going",
  "where", "what", "when", "why", "how", "who", "yeah", "yep", "nope", "nah", "okay", "ok", "sure",
  // Spanish
  "comer", "comiendo", "para", "con", "sin", "hola", "gracias", "quiero", "tengo",
  // French
  "manger", "pour", "avec", "bonjour", "merci", "suis", "faire",
  // German
  "essen", "mit", "fur", "hallo", "danke", "haben",
]);

// Regex matching forbidden punctuation & code symbols in human names
const FORBIDDEN_NAME_CHARS = /[;<>{}[]=+\*$%@#~!~^\/\\\|`"]/;

// Common keyboard smash row sequences & home row keysmashes
const KEYBOARD_SMASH_PATTERNS = [
  "qwerty", "asdfgh", "zxcvbn", "qwertz", "azerty", "dfghj", "fghjk",
  "ghjkl", "sdfgh", "jkl;", "hjkl;", "alsdja", "fajdo", "fuhfi", "wuehf",
  "fiahfi", "fhaiu", "fadfha", "dfhadf", "lkadf"
];

/**
 * Normalizes text for profanity checking by stripping accents and spaces.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a string contains inappropriate language from the 10-locale profanity wordlist.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeText(text);
  const words = text.toLowerCase().split(/\s+/);

  for (const profane of PROFANITY_WORDS) {
    const normalizedProfane = normalizeText(profane);
    if (words.includes(profane.toLowerCase()) || normalized.includes(normalizedProfane)) {
      return true;
    }
  }

  return false;
}

/**
 * Advanced detector for random keyboard smash / gibberish.
 */
export function isKeyboardSmash(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (normalized.length < 4) return false;

  // 1. Check known keyboard smash sequences
  for (const pattern of KEYBOARD_SMASH_PATTERNS) {
    if (normalized.includes(pattern)) return true;
  }

  // 2. Check 4+ consecutive repeated characters (e.g., "aaaa", "zzzz")
  if (/(.)\1{3,}/.test(normalized)) return true;

  // 3. Single unspaced Latin word length limit (human names don't have unspaced Latin words > 18 chars)
  const words = normalized.split(/[\s'.-]+/);
  for (const word of words) {
    if (/^[a-z]+$/.test(word) && word.length > 18) {
      return true;
    }
  }

  // 4. Check 4+ consecutive consonants in Latin script (e.g., "dfhd", "fhaf")
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(normalized)) {
    return true;
  }

  // 5. Check trigram repetition density in a single word (e.g., "fiahfiasfhaiu")
  for (const word of words) {
    if (word.length >= 10 && /^[a-z]+$/.test(word)) {
      const trigrams = new Map<string, number>();
      for (let i = 0; i <= word.length - 3; i++) {
        const tri = word.slice(i, i + 3);
        trigrams.set(tri, (trigrams.get(tri) || 0) + 1);
        if ((trigrams.get(tri) || 0) >= 3) {
          return true;
        }
      }
    }
  }

  // 6. Check Home-Row Keyboard Smash (e.g. "Lkadf", "Asdf", "Fdsa", "Lkaj", "Klad")
  for (const word of words) {
    if (word.length >= 4 && /^[asdfghjkl]+$/.test(word)) {
      if (!HOME_ROW_VALID_NAMES.has(word)) {
        return true;
      }
    }
  }

  // 7. Check high ratio of consonants without vowels for Latin names (length >= 8)
  if (normalized.length >= 8 && /^[a-z\s]+$/.test(normalized)) {
    const vowels = normalized.match(/[aeiou]/g);
    const vowelCount = vowels ? vowels.length : 0;
    if (vowelCount === 0 || vowelCount / normalized.length < 0.15) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a human name string using Proper Noun & Whitelist/Blacklist Heuristics.
 */
export function isPlausibleName(name: string): boolean {
  const trimmed = name.trim();

  // 1. Max length limit for names: between 2 and 50 characters
  if (trimmed.length < 2 || trimmed.length > 50) return false;

  // 2. Reject forbidden punctuation, code symbols & digits
  if (FORBIDDEN_NAME_CHARS.test(trimmed) || /\d/.test(trimmed)) return false;

  // 3. Reject profanity
  if (containsProfanity(trimmed)) return false;

  // 4. Check full non-name conversational phrases (e.g. "terima kasih", "apa kabar")
  if (NON_NAME_PHRASES.has(trimmed.toLowerCase())) return false;

  // 5. Word count limit: Human names don't exceed 4 words in contact forms
  const rawWords = trimmed.split(/[\s'.-]+/).filter((w) => w.length > 0);
  if (rawWords.length > 4) return false;

  // 6. Duplicate word check (e.g. "nana nana nana...")
  const lowerWords = rawWords.map((w) => w.toLowerCase());
  const uniqueWords = new Set(lowerWords);
  if (uniqueWords.size < lowerWords.length) return false;

  // 7. Sentence word check (e.g. "tanam madu lauk mana", "kasihan", "valid sih ya", "udah ah", "percayajalu")
  for (const word of lowerWords) {
    if (NON_NAME_SENTENCE_WORDS.has(word)) {
      return false;
    }
  }

  // 8. Multi-word Title Case / Capitalization Requirement for 2+ Word Latin Names
  if (rawWords.length >= 2 && /^[a-z\s'.-]+$/i.test(trimmed)) {
    const hasCapitalizedWord = rawWords.some((w) => /^[A-Z]/.test(w));
    if (!hasCapitalizedWord) {
      return false;
    }
  }

  // 9. Word length check
  for (const word of lowerWords) {
    if (word.length > 18) return false;
  }

  // 10. Check keyboard smash
  if (isKeyboardSmash(trimmed)) return false;

  // 11. Check valid unicode name characters: Unicode letters (\p{L}), marks (\p{M}), space, apostrophe, hyphen, dot
  const validNameRegex = /^[\p{L}\p{M}\s'.-]+$/u;
  if (!validNameRegex.test(trimmed)) return false;

  return true;
}

/**
 * Validates a contact email address using 5-Layer Enterprise Strategy:
 * 1. Length & character boundary checks [3, 254]
 * 2. Multilingual profanity filter
 * 3. RFC 5322 Standard Format Regex
 * 4. Disposable / Temporary Email Domain Filter
 * 5. Keyboard Smash Local-Part Detector
 */
export function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  if (containsProfanity(trimmed)) return false;

  // RFC 5322 Compliant Email Format Regex
  const rfc5322EmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfc5322EmailRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;

  // Reject disposable email domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return false;

  // Reject keyboard smash in local-part
  if (isKeyboardSmash(local)) return false;

  // Check valid TLD length >= 2
  const domainParts = domain.split(".");
  if (domainParts.some((part) => part.length === 0)) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
}

/**
 * Validates a contact subject line.
 */
export function isPlausibleSubject(subject: string): boolean {
  const trimmed = subject.trim();
  if (trimmed.length === 0) return true; // Subject is optional
  if (trimmed.length > 200) return false;
  if (containsProfanity(trimmed)) return false;
  if (isKeyboardSmash(trimmed)) return false;
  return true;
}

/**
 * Validates a contact message.
 */
export function isPlausibleMessage(message: string, minLen = 10, maxLen = 5000): boolean {
  const trimmed = message.trim();
  if (trimmed.length < minLen || trimmed.length > maxLen) return false;
  if (containsProfanity(trimmed)) return false;
  if (isKeyboardSmash(trimmed)) return false;
  return true;
}
