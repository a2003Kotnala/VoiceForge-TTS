import type { EmotionOption } from "./ttsProvider";

export type LanguageConfidence = "low" | "medium" | "high";

export type LanguageAnalysis = {
  code: string;
  label: string;
  baseLanguage: string;
  confidence: LanguageConfidence;
  needsReview: boolean;
  source: "script" | "keywords" | "fallback";
};

type LanguageProfile = {
  baseLanguage: string;
  label: string;
  defaultCode: string;
  scripts?: RegExp[];
  keywords?: string[];
};

const LATIN_TOKEN_PATTERN = /[a-zA-ZÀ-ÿ']+/g;

const LANGUAGE_PROFILES: LanguageProfile[] = [
  {
    baseLanguage: "en",
    label: "English",
    defaultCode: "en-IN",
    keywords: [
      "the",
      "and",
      "with",
      "this",
      "that",
      "please",
      "thank",
      "hello",
      "you",
      "your"
    ]
  },
  {
    baseLanguage: "es",
    label: "Spanish",
    defaultCode: "es-ES",
    keywords: [
      "hola",
      "gracias",
      "para",
      "por",
      "usted",
      "que",
      "con",
      "esta",
      "buenos",
      "dias"
    ]
  },
  {
    baseLanguage: "fr",
    label: "French",
    defaultCode: "fr-FR",
    keywords: [
      "bonjour",
      "merci",
      "avec",
      "pour",
      "vous",
      "que",
      "cette",
      "est",
      "une",
      "le"
    ]
  },
  {
    baseLanguage: "de",
    label: "German",
    defaultCode: "de-DE",
    keywords: [
      "hallo",
      "danke",
      "bitte",
      "und",
      "nicht",
      "mit",
      "eine",
      "der",
      "die",
      "das"
    ]
  },
  {
    baseLanguage: "it",
    label: "Italian",
    defaultCode: "it-IT",
    keywords: [
      "ciao",
      "grazie",
      "per",
      "con",
      "una",
      "sono",
      "questo",
      "che",
      "buongiorno",
      "voi"
    ]
  },
  {
    baseLanguage: "pt",
    label: "Portuguese",
    defaultCode: "pt-BR",
    keywords: [
      "ola",
      "obrigado",
      "para",
      "com",
      "voce",
      "que",
      "esta",
      "uma",
      "bom",
      "dia"
    ]
  },
  {
    baseLanguage: "nl",
    label: "Dutch",
    defaultCode: "nl-NL",
    keywords: [
      "hallo",
      "dank",
      "voor",
      "met",
      "dit",
      "een",
      "het",
      "de",
      "goed",
      "morgen"
    ]
  },
  {
    baseLanguage: "tr",
    label: "Turkish",
    defaultCode: "tr-TR",
    keywords: [
      "merhaba",
      "tesekkurler",
      "icin",
      "ve",
      "bir",
      "bu",
      "gorusuruz",
      "bugun",
      "lutfen",
      "nasilsin"
    ]
  },
  {
    baseLanguage: "pl",
    label: "Polish",
    defaultCode: "pl-PL",
    keywords: [
      "dziekuje",
      "prosze",
      "czesc",
      "jest",
      "oraz",
      "dla",
      "ten",
      "dzien",
      "witam",
      "zespol"
    ]
  },
  {
    baseLanguage: "hi",
    label: "Hindi",
    defaultCode: "hi-IN",
    scripts: [/\p{Script=Devanagari}/u]
  },
  {
    baseLanguage: "ja",
    label: "Japanese",
    defaultCode: "ja-JP",
    scripts: [/\p{Script=Hiragana}/u, /\p{Script=Katakana}/u]
  },
  {
    baseLanguage: "ko",
    label: "Korean",
    defaultCode: "ko-KR",
    scripts: [/\p{Script=Hangul}/u]
  },
  {
    baseLanguage: "zh",
    label: "Chinese",
    defaultCode: "cmn-CN",
    scripts: [/\p{Script=Han}/u]
  },
  {
    baseLanguage: "ar",
    label: "Arabic",
    defaultCode: "ar-XA",
    scripts: [/\p{Script=Arabic}/u]
  },
  {
    baseLanguage: "ru",
    label: "Russian",
    defaultCode: "ru-RU",
    scripts: [/\p{Script=Cyrillic}/u]
  }
];

const POSITIVE_WORDS = [
  "great",
  "wonderful",
  "excited",
  "happy",
  "glad",
  "celebrate",
  "amazing",
  "genial",
  "feliz",
  "fantastique"
];
const FORMAL_WORDS = [
  "regards",
  "agenda",
  "update",
  "meeting",
  "proposal",
  "timeline",
  "stakeholders"
];
const STORY_WORDS = [
  "once",
  "suddenly",
  "remember",
  "story",
  "chapter",
  "journey",
  "meanwhile"
];
const SAD_WORDS = [
  "sorry",
  "miss",
  "loss",
  "difficult",
  "sad",
  "regret",
  "unfortunately"
];
const ANGRY_WORDS = [
  "angry",
  "upset",
  "unacceptable",
  "frustrated",
  "urgent",
  "immediately",
  "issue"
];
const FRIENDLY_WORDS = [
  "hi",
  "hello",
  "thanks",
  "thank you",
  "welcome",
  "hola",
  "gracias",
  "bonjour",
  "merci",
  "namaste",
  "saludos"
];

function tokenize(text: string) {
  return (
    text
      .toLowerCase()
      .match(LATIN_TOKEN_PATTERN)
      ?.map((token) => token.normalize("NFKD").replace(/[^\w']/g, "")) ?? []
  );
}

function resolveSupportedLanguage(
  targetCode: string,
  supportedLanguages: string[]
) {
  if (!supportedLanguages.length) {
    return targetCode;
  }

  if (supportedLanguages.includes(targetCode)) {
    return targetCode;
  }

  const baseLanguage = targetCode.split("-")[0];
  return (
    supportedLanguages.find((languageCode) =>
      languageCode.startsWith(`${baseLanguage}-`)
    ) ?? supportedLanguages[0]
  );
}

function scoreKeywordLanguages(tokens: string[]) {
  return LANGUAGE_PROFILES.filter((profile) => profile.keywords?.length).map(
    (profile) => ({
      profile,
      score:
        profile.keywords?.reduce(
          (count, keyword) => count + Number(tokens.includes(keyword)),
          0
        ) ?? 0
    })
  );
}

export function detectLanguage(
  inputText: string,
  supportedLanguages: string[]
): LanguageAnalysis {
  const text = inputText.trim();

  if (!text) {
    return {
      code: resolveSupportedLanguage("en-US", supportedLanguages),
      label: "English",
      baseLanguage: "en",
      confidence: "low",
      needsReview: false,
      source: "fallback"
    };
  }

  for (const profile of LANGUAGE_PROFILES) {
    if (profile.scripts?.some((pattern) => pattern.test(text))) {
      return {
        code: resolveSupportedLanguage(profile.defaultCode, supportedLanguages),
        label: profile.label,
        baseLanguage: profile.baseLanguage,
        confidence: text.length > 18 ? "high" : "medium",
        needsReview: text.length < 12,
        source: "script"
      };
    }
  }

  const tokens = tokenize(text);
  const scores = scoreKeywordLanguages(tokens).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.profile.label.localeCompare(right.profile.label);
  });
  const winner = scores[0];

  if (winner && winner.score > 0) {
    const confidence: LanguageConfidence =
      winner.score >= 4 || text.length > 120
        ? "high"
        : winner.score >= 2 || text.length > 40
          ? "medium"
          : "low";

    return {
      code: resolveSupportedLanguage(
        winner.profile.defaultCode,
        supportedLanguages
      ),
      label: winner.profile.label,
      baseLanguage: winner.profile.baseLanguage,
      confidence,
      needsReview: confidence === "low",
      source: "keywords"
    };
  }

  return {
    code: resolveSupportedLanguage("en-IN", supportedLanguages),
    label: "English",
    baseLanguage: "en",
    confidence: text.length > 100 ? "medium" : "low",
    needsReview: text.length < 80,
    source: "fallback"
  };
}

export function suggestEmotion(text: string): EmotionOption {
  const lowerText = text.toLowerCase();
  const exclamationCount = (lowerText.match(/!/g) ?? []).length;

  if (STORY_WORDS.some((word) => lowerText.includes(word)) || /["“”]/.test(text)) {
    return "storytelling";
  }

  if (FRIENDLY_WORDS.some((word) => lowerText.includes(word))) {
    return "friendly";
  }

  if (FORMAL_WORDS.some((word) => lowerText.includes(word))) {
    return "professional";
  }

  if (SAD_WORDS.some((word) => lowerText.includes(word))) {
    return "sad";
  }

  if (ANGRY_WORDS.some((word) => lowerText.includes(word))) {
    return "angry";
  }

  if (POSITIVE_WORDS.some((word) => lowerText.includes(word))) {
    return exclamationCount >= 2 ? "excited" : "cheerful";
  }

  if (exclamationCount >= 2) {
    return "excited";
  }

  return "neutral";
}
