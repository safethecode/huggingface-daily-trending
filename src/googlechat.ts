import { GoogleChatMessage, HuggingFacePaper } from "./types";
import { GOOGLE_CHAT_CONFIG } from "./config/constants";
import { formatAuthors } from "./utils/format";

export function formatPapersForGoogleChat(
  papers: HuggingFacePaper[],
  summary: string
): GoogleChatMessage {
  const date = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const summaryParts = summary.split(/\*\*\[\d+\]/);
  const intro = summaryParts[0] || "";

  const paperWidgets = papers.slice(0, 5).map((paper, index) => {
    const paperSummary = summaryParts[index + 1] || "";

    return {
      textParagraph: {
        text: `<b>${index + 1}. ${paper.title}</b>\n⭐ ${
          paper.upvotes || 0
        } | 👥 ${formatAuthors(
          paper.authors,
          GOOGLE_CHAT_CONFIG.maxAuthorsInCard
        )}\n\n${paperSummary.substring(
          0,
          GOOGLE_CHAT_CONFIG.maxSummaryLength
        )}...\n\n<a href="${paper.paperUrl}">논문 보기 →</a>`,
      },
    };
  });

  return {
    cards: [
      {
        header: {
          title: "🤗 Hugging Face 데일리 논문",
          subtitle: date,
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text:
                    intro.trim() ||
                    `오늘 ${papers.length}개의 인기 논문을 소개합니다.`,
                },
              },
            ],
          },
          ...paperWidgets.map((widget) => ({
            widgets: [widget],
          })),
          {
            widgets: [
              {
                buttons: [
                  {
                    textButton: {
                      text: "더 많은 논문 보기",
                      onClick: {
                        openLink: {
                          url: "https://huggingface.co/papers",
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

export async function sendErrorToGoogleChat(
  webhookUrl: string,
  error: Error | string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;

  const message: GoogleChatMessage = {
    cards: [
      {
        header: {
          title: "⚠️ 오류 발생",
          subtitle: "Hugging Face 논문 수집 중 오류",
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `오류 내용: ${errorMessage}\n\n시간: ${new Date().toLocaleString(
                    "ko-KR"
                  )}`,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error("Failed to send error to Google Chat:", err);
  }
}
