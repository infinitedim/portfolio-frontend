   
                                                          
                                                                                                  
   

                                                      
const PROFANITY_WORDS = [
            
  "fuck", "shit", "asshole", "bitch", "bastard", "cunt", "dick", "pussy", "cock", "prick", "whore", "slut", "nigger", "faggot",
               
  "anjing", "babi", "kontol", "memek", "bangsat", "pantek", "jancok", "jancuk", "pantat", "itil", "peler", "kintil", "goblok", "tolol", "asu", "bajingan", "pepek", "kampret", "puang",
                               
  "baka", "kuso", "yarou", "chikushou", "man ko", "chin ko",
                    
  "ssibal", "gaesaekki", "byeongsin", "jot", "jikka",
                     
  "caonima", "shabi", "nimabi", "wangba", "ganneima",
           
  "scheisse", "arschloch", "wichser", "hurensohn", "fick",
           
  "merde", "connard", "salope", "putain", "encule", "chienne",
            
  "pendejo", "mierda", "cabron", "puta", "chingar", "maricon",
               
  "caralho", "porra", "puta", "viado", "arrombado", "bosta",
                       
  "blya", "blyat", "suka", "pizdet", "pizdec", "khuy", "ebat", "nahuy"
];

                                                  
const NON_NAME_PHRASES = new Set([
  "terima kasih", "makasih", "thank you", "thanks a lot", "apa kabar",
  "selamat pagi", "selamat siang", "selamat sore", "selamat malam",
  "good morning", "good evening", "good night", "hello world", "tes nama"
]);

                                                                                                   
const HOME_ROW_VALID_NAMES = new Set([
  "sasha", "salma", "hasan", "hassan", "fallon", "dallas", "gala", "salas", "hadad", "falah"
]);

                                                                                                    
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "guerrillamail.org",
  "guerrillamail.net", "yopmail.com", "yopmail.fr", "trashmail.com", "trashmail.net",
  "throwawaymail.com", "sharklasers.com", "getnada.com", "dispostable.com", "temp-mail.org",
  "maildrop.cc", "mailnesia.com", "fakeinbox.com", "crazymailing.com", "generator.email",
  "emailondeck.com", "tempail.com", "mohmal.com", "burnermail.io", "mytemp.email",
  "dropmail.me", "incognitomail.com", "getairmail.com", "disposablemail.com", "fakemailgenerator.com"
]);

                                                               
                                                                                                
const NON_NAME_SENTENCE_WORDS = new Set([
                                       
  "sih", "deh", "dong", "kok", "kan", "lah", "loh", "tuh", "kah", "yuk", "ya", "yah", "yak", "ye", "yo", "nih", "gitu", "gimana",
  "apakah", "siap", "tes", "test", "testing", "valid", "invalid", "demo", "sample", "dummy", "admin", "user", "null", "undefined",
  "asdf", "qwerty", "foo", "bar", "baz", "anon", "anonymous",
                                                                    
  "kasihan", "kasian", "kasihanilah", "aku", "udah", "ah", "percaya", "ajalu", "aja", "kurang", "paham", "maksudnya", "kekmana",
  "sedih", "capek", "cape", "lelah", "pusing", "ngantuk", "lapar", "haus",
  "wkwk", "wkwkwk", "haha", "hahaha", "xixi", "xixixi", "hehe", "hehehe",
                                                     
  "tanam", "madu", "lauk", "mana", "makan", "minum", "nasi", "batu", "pintu", "rumah", "kucing", "burung", "ikan",
  "ayam", "tempe", "tahu", "sayur", "buah", "daging", "telur", "sambal", "garam", "gula", "minyak", "air", "teh", "kopi",
  "susu", "jus", "kue", "roti", "meja", "kursi", "baju", "celana", "topi", "sepatu", "buku", "pena", "kertas", "gelas",
  "sendok", "garpu", "piring", "mangkuk", "pisau", "bunga", "pohon", "daun", "rumput", "tanah", "pasir", "laut", "gunung",
  "sungai", "danau", "langit", "awan", "hujan", "angin", "matahari", "bulan", "bintang", "api", "kayu", "besi", "emas", "perak",
  "lagi", "sedang", "adalah", "yang", "ini", "itu", "dengan", "untuk", "pada", "atau", "dan", "bisa", "mau", "ingin",
  "bukan", "tidak", "gak", "ga", "ngga", "nggak", "ada", "sudah", "dah", "belum", "pernah", "buat", "bikin", "punya",
  "saya", "kamu", "dia", "mereka", "kita", "kami", "anda", "gue", "lu", "gw", "eloe", "kenapa", "bagaimana", "apa",
  "siapa", "dimana", "kapan", "halo", "hai", "tidur", "pergi", "jalan",
                                             
  "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "like", "likes", "eat", "eating", "food", "the", "an", "this", "that", "these", "those",
  "with", "for", "from", "to", "in", "on", "at", "by", "my", "your", "his", "her", "their", "our",
  "hello", "hi", "please", "thanks", "thank", "want", "wants", "make", "makes", "doing", "going",
  "where", "what", "when", "why", "how", "who", "yeah", "yep", "nope", "nah", "okay", "ok", "sure",
            
  "comer", "comiendo", "para", "con", "sin", "hola", "gracias", "quiero", "tengo",
           
  "manger", "pour", "avec", "bonjour", "merci", "suis", "faire",
           
  "essen", "mit", "fur", "hallo", "danke", "haben",
]);

                                                                     
const FORBIDDEN_NAME_CHARS = /[;<>{}[]=+\*$%@#~!~^\/\\\|`"]/;

                                                            
const KEYBOARD_SMASH_PATTERNS = [
  "qwerty", "asdfgh", "zxcvbn", "qwertz", "azerty", "dfghj", "fghjk",
  "ghjkl", "sdfgh", "jkl;", "hjkl;", "alsdja", "fajdo", "fuhfi", "wuehf",
  "fiahfi", "fhaiu", "fadfha", "dfhadf", "lkadf"
];

   
                                                                          
   
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

   
                                                                                            
   
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

   
                                                           
   
export function isKeyboardSmash(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (normalized.length < 4) return false;

                                            
  for (const pattern of KEYBOARD_SMASH_PATTERNS) {
    if (normalized.includes(pattern)) return true;
  }

                                                                       
  if (/(.)\1{3,}/.test(normalized)) return true;

                                                                                                        
  const words = normalized.split(/[\s'.-]+/);
  for (const word of words) {
    if (/^[a-z]+$/.test(word) && word.length > 18) {
      return true;
    }
  }

                                                                              
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(normalized)) {
    return true;
  }

                                                                                 
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

                                                                                    
  for (const word of words) {
    if (word.length >= 4 && /^[asdfghjkl]+$/.test(word)) {
      if (!HOME_ROW_VALID_NAMES.has(word)) {
        return true;
      }
    }
  }

                                                                                   
  if (normalized.length >= 8 && /^[a-z\s]+$/.test(normalized)) {
    const vowels = normalized.match(/[aeiou]/g);
    const vowelCount = vowels ? vowels.length : 0;
    if (vowelCount === 0 || vowelCount / normalized.length < 0.15) {
      return true;
    }
  }

  return false;
}

   
                                                                                    
   
export function isPlausibleName(name: string): boolean {
  const trimmed = name.trim();

                                                               
  if (trimmed.length < 2 || trimmed.length > 50) return false;

                                                           
  if (FORBIDDEN_NAME_CHARS.test(trimmed) || /\d/.test(trimmed)) return false;

                        
  if (containsProfanity(trimmed)) return false;

                                                                                     
  if (NON_NAME_PHRASES.has(trimmed.toLowerCase())) return false;

                                                                           
  const rawWords = trimmed.split(/[\s'.-]+/).filter((w) => w.length > 0);
  if (rawWords.length > 4) return false;

                                                       
  const lowerWords = rawWords.map((w) => w.toLowerCase());
  const uniqueWords = new Set(lowerWords);
  if (uniqueWords.size < lowerWords.length) return false;

                                                                                                              
  for (const word of lowerWords) {
    if (NON_NAME_SENTENCE_WORDS.has(word)) {
      return false;
    }
  }

                                                                                  
  if (rawWords.length >= 2 && /^[a-z\s'.-]+$/i.test(trimmed)) {
    const hasCapitalizedWord = rawWords.some((w) => /^[A-Z]/.test(w));
    if (!hasCapitalizedWord) {
      return false;
    }
  }

                         
  for (const word of lowerWords) {
    if (word.length > 18) return false;
  }

                             
  if (isKeyboardSmash(trimmed)) return false;

                                                                                                                    
  const validNameRegex = /^[\p{L}\p{M}\s'.-]+$/u;
  if (!validNameRegex.test(trimmed)) return false;

  return true;
}

   
                                                                       
                                                 
                                   
                                    
                                                
                                        
   
export function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  if (containsProfanity(trimmed)) return false;

                                          
  const rfc5322EmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfc5322EmailRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;

                                    
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return false;

                                        
  if (isKeyboardSmash(local)) return false;

                                
  const domainParts = domain.split(".");
  if (domainParts.some((part) => part.length === 0)) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
}

   
                                    
   
export function isPlausibleSubject(subject: string): boolean {
  const trimmed = subject.trim();
  if (trimmed.length === 0) return true;                       
  if (trimmed.length > 200) return false;
  if (containsProfanity(trimmed)) return false;
  if (isKeyboardSmash(trimmed)) return false;
  return true;
}

   
                               
   
export function isPlausibleMessage(message: string, minLen = 10, maxLen = 5000): boolean {
  const trimmed = message.trim();
  if (trimmed.length < minLen || trimmed.length > maxLen) return false;
  if (containsProfanity(trimmed)) return false;
  if (isKeyboardSmash(trimmed)) return false;
  return true;
}
