// Banned word filter for user-generated content (club names, tags, display names, gamertags).
// Catches common obfuscations: leetspeak, repeated chars, spaces/symbols inserted, vowel removal.

const BANNED_WORDS = [
  // Racial slurs
  'nigger', 'nigga', 'niggr', 'nigr', 'n1gg', 'n!gg', 'nlgg',
  'spic', 'sp1c', 'sp!c', 'sp1ck',
  'chink', 'ch1nk', 'ch!nk',
  'kike', 'k1ke', 'k!ke',
  'wetback', 'wetb4ck',
  'gook', 'g00k', 'g0ok',
  'coon', 'c00n', 'c0on',
  'cracker', 'cr4ck3r',
  'sandnigger', 'sandn1gg',
  'paki', 'p4k1',

  // Homophobic / LGBTQ+ derogatory
  'faggot', 'fag', 'f4gg0t', 'f4g', 'f4gg', 'f@g', 'f@gg0t', 'f@ggot',
  'dyke', 'd1ke', 'd!ke',
  'tranny', 'tr4nny', 'tr@nny',
  'queer', 'qu33r', 'qu##r',

  // Sexist / misogynistic
  'cunt', 'cuntface', 'cunty', 'cuntboy',
  'bitch', 'b1tch', 'b!tch', 'b1tchface',
  'whore', 'wh0re', 'wh0r3', 'whor3',
  'slut', 'sl1t', 'sl!t', 'sl00t',
  'skank', 'sk4nk',
  'twat', 'tw4t', 'tw@t',
  'pussy', 'pu55y', 'pus5y',
  'bimbo', 'b1mb0',

  // General profanity / offensive
  'retard', 'retarded', 'r3t4rd', 'r3tard', 'r#tard',
  'mongoloid', 'mong0l01d',
  'midget', 'm1dg3t',

  // Sexual / pedophilia
  'pedophile', 'paedophile', 'ped0', 'pead0', 'pedobear',
  'rapist', 'r4p1st', 'r@pist',
  'rape', 'r4p3', 'r@pe',

  // Hate group / nazi
  'nazi', 'n4z1', 'n@z1',
  'hitler', 'h1tl3r', 'h!tler',
  'kkk', 'k.k.k',
  'swastika', 'sw4st1k4',
  'fascist', 'f4sc1st',

  // Other offensive
  'wop', 'w0p',
  'gypsy', 'g1psy', 'gypsycurse',
  'trailer trash',
  'inbred', '1nbr3d',
  'incest', '1nc3st',
]

// Normalization: remove non-alphanumeric, collapse repeated chars, common leet substitutions
function normalize(str) {
  let s = str.toLowerCase().trim()
  // Replace common leet substitutions
  s = s
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/!/g, 'i')
    .replace(/[$]/g, 's')
    .replace(/[#]/g, 'h')
    .replace(/[^a-z]/g, '') // remove all non-alpha after substitutions
  // Collapse repeated characters (e.g. "niiigger" -> "niger", "niggger" -> "niger")
  // But only collapse 3+ repeats to 1, and 2 repeats to 1 as well for matching
  s = s.replace(/(.)\1+/g, '$1')
  return s
}

// Also check with just spaces/symbols removed but no leet substitution
// (for words that use real letters with obfuscating spaces)
function normalizeLight(str) {
  return str.toLowerCase().replace(/[^a-z]/g, '')
}

export function containsBannedWord(text) {
  if (!text || typeof text !== 'string') return false
  const normalized = normalize(text)
  const light = normalizeLight(text)

  for (const word of BANNED_WORDS) {
    const normWord = normalize(word)
    if (normalized.includes(normWord) || light.includes(word)) {
      return true
    }
  }
  return false
}

export function validateCleanText(text, fieldName = 'This field') {
  if (containsBannedWord(text)) {
    return `${fieldName} contains language that is not allowed. Please choose something else.`
  }
  return null
}
