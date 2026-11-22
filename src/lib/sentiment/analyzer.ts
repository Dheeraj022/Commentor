import type { SentimentLabel, SentimentData } from "@/types";

interface SentimentResult {
  automatedLabel: SentimentLabel;
  confidence: number;
  reason: string;
  language: string;
  provider: string;
  modelName: string;
  analysisStatus: "completed" | "failed";
}

// Positive indicators (English, Hindi, Hinglish, Emojis)
const POSITIVE_LEXICON = [
  // Emojis
  "❤️", "😍", "🔥", "👏", "🙌", "✨", "💯", "🎉", "👍", "🚀", "🥰", "🤩", "💖", "👌",
  // English
  "great", "awesome", "amazing", "love", "loved", "excellent", "perfect", "superb", "helpful", "good",
  "best", "fantastic", "wonderful", "brilliant", "outstanding", "impressive", "recommend", "thank you",
  "thanks", "appreciate", "informative", "valuable", "gem", "inspiring", "clean", "smooth",
  // Hinglish / Hindi
  "badiya", "badhiya", "shandar", "shaandar", "mast", "zabardast", "maja", "maza", "dhansu",
  "kamaal", "kamal", "lajawab", "sahi hai", "accha", "achha", "bahut accha", "bahut badhiya",
  "शानदार", "बढ़िया", "जबरदस्त", "मस्त", "कमाल", "लाजवाब", "अच्छा", "बहुत बढ़िया"
];

// Negative indicators (English, Hindi, Hinglish, Emojis)
const NEGATIVE_LEXICON = [
  // Emojis
  "😡", "🤬", "👎", "💩", "🤮", "😤", "😠", "💔", "🤦", "🙄",
  // English
  "terrible", "worst", "bad", "horrible", "awful", "scam", "waste", "useless", "disappointed",
  "disappointing", "poor", "hate", "bug", "broken", "fraud", "annoying", "boring", "trash", "slow",
  "unacceptable", "cheated", "fake", "pathetic", "never again", "garbage", "fail", "crashed",
  // Hinglish / Hindi
  "bekaar", "bekar", "bakwas", "ghatiya", "chirkut", "fraud", "dhoka", "lutere", "barbad", "barbaad",
  "kharab", "faltu", "faaltu", "time waste", "paisa waste", "ganda", "kuch nahi",
  "बकवास", "घटिया", "खराब", "बेकार", "धोखा", "फालतू", "बर्बाद"
];

// Negation words that flip positive/negative
const NEGATIONS = ["not", "never", "no", "nahin", "nhi", "nahi", "mat", "don't", "dont", "didn't", "didnt", "isn't", "isnt", "won't", "wont"];

export async function analyzeSentiment(
  text: string,
  apiKey?: string
): Promise<SentimentResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      automatedLabel: "neutral",
      confidence: 1.0,
      reason: "Empty text",
      language: "en",
      provider: "system",
      modelName: "rule-based",
      analysisStatus: "completed",
    };
  }

  // If an external AI API key is configured, we can call external provider; otherwise use robust deterministic NLP
  const sentimentKey = apiKey || process.env.SENTIMENT_API_KEY;
  if (sentimentKey && sentimentKey.startsWith("AI_EXT_")) {
    try {
      // Future pluggable external AI provider integration
      // Can call OpenAI/Gemini/Anthropic API endpoint
    } catch {
      // Fallback on failure
    }
  }

  return analyzeSentimentRuleBased(trimmed);
}

export function analyzeSentimentRuleBased(text: string): SentimentResult {
  const lower = text.toLowerCase();

  // Language detection heuristic
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasHinglish = /\b(hai|bhai|yaar|badiya|badhiya|kya|accha|achha|bekar|bakwas|ghatiya|paisa|mast|sahi|bahut|nahi|nhi)\b/i.test(lower);
  const language = hasDevanagari ? "hi" : (hasHinglish ? "hi-en" : "en");

  let posScore = 0;
  let negScore = 0;
  const matchedPosTerms: string[] = [];
  const matchedNegTerms: string[] = [];

  // Check emojis and words
  for (const term of POSITIVE_LEXICON) {
    if (term.match(/^[a-z ]+$/i)) {
      // Word boundary match
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(lower)) {
        // Check for preceding negation
        const words = lower.split(/\s+/);
        const idx = words.findIndex((w) => w.includes(term));
        const isNegated = idx > 0 && NEGATIONS.includes(words[idx - 1]);
        if (isNegated) {
          negScore += 1.5;
          matchedNegTerms.push(`not ${term}`);
        } else {
          posScore += 1.2;
          matchedPosTerms.push(term);
        }
      }
    } else {
      // Emojis or Hindi chars
      if (text.includes(term)) {
        posScore += 1.5;
        matchedPosTerms.push(term);
      }
    }
  }

  for (const term of NEGATIVE_LEXICON) {
    if (term.match(/^[a-z ]+$/i)) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(lower)) {
        const words = lower.split(/\s+/);
        const idx = words.findIndex((w) => w.includes(term));
        const isNegated = idx > 0 && NEGATIONS.includes(words[idx - 1]);
        if (isNegated) {
          posScore += 1.0;
          matchedPosTerms.push(`not ${term}`);
        } else {
          negScore += 1.5;
          matchedNegTerms.push(term);
        }
      }
    } else {
      if (text.includes(term)) {
        negScore += 1.5;
        matchedNegTerms.push(term);
      }
    }
  }

  let label: SentimentLabel = "neutral";
  let confidence = 0.70;
  let reason = "Context indicates balanced, neutral, or inquiry statement.";

  if (posScore > negScore && posScore >= 1.0) {
    label = "positive";
    confidence = Math.min(0.98, 0.75 + posScore * 0.08);
    reason = `Positive sentiment detected (${matchedPosTerms.slice(0, 3).join(", ")})`;
  } else if (negScore > posScore && negScore >= 1.0) {
    label = "negative";
    confidence = Math.min(0.98, 0.75 + negScore * 0.08);
    reason = `Negative sentiment detected (${matchedNegTerms.slice(0, 3).join(", ")})`;
  } else if (posScore === 0 && negScore === 0) {
    // Pure neutral/factual/question
    if (text.includes("?") || lower.startsWith("when") || lower.startsWith("how") || lower.startsWith("where") || lower.startsWith("price") || lower.startsWith("cost")) {
      reason = "Inquiry or informational question";
    } else {
      reason = "Informative or general remark with neutral tone";
    }
    confidence = 0.85;
  }

  return {
    automatedLabel: label,
    confidence: Number(confidence.toFixed(2)),
    reason,
    language,
    provider: "sentiment-engine-v1",
    modelName: "lexical-context-hybrid",
    analysisStatus: "completed",
  };
}
