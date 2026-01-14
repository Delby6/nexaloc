// src/utils/localAI.js
// Lightweight, multilingual (EN/FR/PL) moderation + sentiment utilities.
// Pure client-side, zero network calls.

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")               // split accents
    .replace(/\p{Diacritic}/gu, "") // remove accents
    .replace(/\s+/g, " ")
    .trim();
}

// 🚫 Inappropriate words (EN / FR / PL). Keep short and general.
const BANNED = [
  // English
  "idiot", "stupid", "racist", "hate", "kill", "trash", "sex", "fuck", "shit", "bitch", "scam",
  // French
  "idiot", "stupide", "haine", "tuer", "merde", "connard", "salope", "arnaque", "raciste",
  // Polish (unaccented forms for matching after normalize)
  "idiota", "glupi", "nienawisc", "zabic", "smiec", "oszustwo", "kurwa",
];

// 😊 Positive keywords (EN / FR / PL)
const POS = [
  // English
  "good", "great", "excellent", "love", "amazing", "friendly", "fresh", "nice",
  "wonderful", "helpful", "professional", "fast", "perfect",
  // French
  "bon", "super", "excellent", "aimer", "formidable", "sympa", "gentil",
  "rapide", "parfait", "magnifique",
  // Polish
  "dobry", "swietny", "doskonaly", "kocham", "wspanialy", "mily", "szybki",
  "perfekcyjny", "pomocny",
];

// 😞 Negative keywords (EN / FR / PL)
const NEG = [
  // English
  "bad", "poor", "terrible", "hate", "awful", "slow", "dirty", "rude",
  "broken", "expensive", "late", "horrible", "unfriendly",
  // French
  "mauvais", "lent", "sale", "cher", "mechant", "horrible", "nul",
  "desagreable", "casse",
  // Polish
  "zly", "brudny", "drogi", "pozny", "okropny", "nieuprzejmy", "wolny",
  "niedobry",
];

export function isInappropriate(text) {
  const t = normalize(text);
  // word boundary-ish matching after normalization
  return BANNED.some((w) => new RegExp(`(?:^|\\W)${w}(?:$|\\W)`, "i").test(t));
}

export function analyzeSentiment(text) {
  const t = normalize(text);
  if (!t) return "neutral";

  const posHits = POS.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
  const negHits = NEG.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);

  if (posHits > negHits && posHits > 0) return "positive";
  if (negHits > posHits && negHits > 0) return "negative";
  return "neutral";
}

export function sentimentEmoji(sentiment) {
  if (sentiment === "positive") return "😊";
  if (sentiment === "negative") return "😞";
  return "😐";
}

export function sentimentLabel(sentiment) {
  switch (sentiment) {
    case "positive":
      return "Positive / Positif / Pozytywny";
    case "negative":
      return "Negative / Négatif / Negatywny";
    default:
      return "Neutral / Neutre / Neutralny";
  }
}
