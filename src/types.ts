export interface Env {
  GOOGLE_CHAT_WEBHOOK_URL: string;
  ANTHROPIC_API_KEY: string;
}

export interface HuggingFacePaper {
  id: string;
  title: string;
  authors: string[];
  organization: string;
  abstract: string;
  publishedDate: string;
  pdfUrl: string;
  paperUrl: string;
  upvotes?: number;
}

export interface PaperSummary {
  title: string;
  titleKo?: string;
  authors: string;
  organization: string;
  summary: string;
  keyPoints: string[];
  significance: string;
  eliFor5?: string;
  paperUrl: string;
  upvotes?: number;
}

export interface AnalyzedPapersResponse {
  date: string;
  count: number;
  papers: PaperSummary[];
  trend?: string;
}

export interface GoogleChatMessage {
  text?: string;
  cards?: Array<{
    header?: {
      title: string;
      subtitle?: string;
    };
    sections: Array<{
      widgets: Array<{
        textParagraph?: {
          text: string;
        };
        buttons?: Array<{
          textButton: {
            text: string;
            onClick: {
              openLink: {
                url: string;
              };
            };
          };
        }>;
      }>;
    }>;
  }>;
}
