import { GoogleChatMessage, AnalyzedPapersResponse } from "./types";

export function formatPapersForGoogleChat(
  result: AnalyzedPapersResponse,
  dateStr: string
): GoogleChatMessage {
  const date = new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const paperWidgets = result.papers.map((paper, index) => {
    const titleText = paper.titleKo
      ? `${paper.titleKo}\n<i>${paper.title}</i>`
      : paper.title;

    let content = `<b>${index + 1}. ${titleText}</b>\n`;
    content += `⭐ ${paper.upvotes || 0} | 👥 ${paper.authors}`;

    if (paper.organization) {
      content += ` | 🏢 ${paper.organization}`;
    }

    content += `\n\n${paper.summary}`;

    if (paper.keyPoints && paper.keyPoints.length > 0) {
      content += "\n\n<b>주요 포인트:</b>";
      paper.keyPoints.forEach((point) => {
        content += `\n• ${point}`;
      });
    }

    if (paper.significance) {
      content += `\n\n<b>의의:</b> ${paper.significance}`;
    }

    if (paper.eliFor5) {
      content += `\n\n<b>쉽게 설명하면:</b> ${paper.eliFor5}`;
    }

    content += `\n\n<a href="${paper.paperUrl}">논문 보기 →</a>`;

    return {
      textParagraph: {
        text: content,
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
                  text: `오늘 ${result.count}개의 인기 논문 중 상위 ${result.papers.length}개를 AI가 분석했습니다.`,
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
