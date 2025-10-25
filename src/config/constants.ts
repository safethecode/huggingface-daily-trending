export const AI_CONFIG = {
  modelName: "claude-3-7-sonnet-20250219",
  temperature: 0.7,
  maxTokens: {
    summary: 4096,
    structured: 2048,
  },
} as const;

export const PAPER_CONFIG = {
  topPapersCount: 5,
  maxAuthorsDisplay: {
    short: 3,
    long: 5,
  },
  abstractPreviewLength: {
    short: 200,
    long: 300,
  },
} as const;

export const GOOGLE_CHAT_CONFIG = {
  maxAuthorsInCard: 2,
  maxSummaryLength: 300,
} as const;
