import { Env } from "./types";
import { fetchDailyPapers } from "./huggingface";
import {
  analyzePapersWithLangchain,
  generateSimpleSummary,
  analyzePapersStructured,
} from "./langchain-analyzer";
import {
  sendErrorToGoogleChat,
  formatPapersForGoogleChat,
} from "./googlechat";
import { getYesterdayDate } from "./utils/date";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    if (url.pathname === "/trigger") {
      try {
        const date = url.searchParams.get("date") || getYesterdayDate();
        await processDailyPapers(env, date);
        return new Response(
          JSON.stringify({
            success: true,
            date,
            message: "Papers analyzed and sent to Google Chat",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (url.pathname === "/test") {
      try {
        const date = url.searchParams.get("date") || getYesterdayDate();
        const papers = await fetchDailyPapers(date);

        return new Response(
          JSON.stringify({
            date,
            count: papers.length,
            papers: papers.slice(0, 5),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/analyze") {
      try {
        const date = url.searchParams.get("date") || getYesterdayDate();
        const papers = await fetchDailyPapers(date);

        if (papers.length === 0) {
          return new Response(
            JSON.stringify({ error: "No papers found for this date" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        let result;

        if (env.ANTHROPIC_API_KEY) {
          try {
            console.log("Analyzing papers with structured AI analysis...");
            result = await analyzePapersStructured(
              papers,
              env.ANTHROPIC_API_KEY
            );
          } catch (error) {
            console.error("Failed to analyze with AI:", error);
            result = {
              date,
              count: papers.length,
              papers: papers.slice(0, 5).map((paper) => ({
                title: paper.title,
                authors:
                  paper.authors.slice(0, 3).join(", ") +
                  (paper.authors.length > 3 ? " 외" : ""),
                summary: paper.abstract.slice(0, 300) + "...",
                keyPoints: [],
                significance: "",
                paperUrl: paper.paperUrl,
                upvotes: paper.upvotes,
              })),
            };
          }
        } else {
          console.log("No API key, using basic info");
          result = {
            date,
            count: papers.length,
            papers: papers.slice(0, 5).map((paper) => ({
              title: paper.title,
              authors:
                paper.authors.slice(0, 3).join(", ") +
                (paper.authors.length > 3 ? " 외" : ""),
              summary: paper.abstract.slice(0, 300) + "...",
              keyPoints: [],
              significance: "",
              paperUrl: paper.paperUrl,
              upvotes: paper.upvotes,
            })),
          };
        }

        return new Response(JSON.stringify(result, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Hugging Face Daily Papers Bot", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log(
      "Scheduled event triggered at:",
      new Date(event.scheduledTime).toISOString()
    );

    try {
      const date = getYesterdayDate();
      await processDailyPapers(env, date);
    } catch (error) {
      console.error("Error in scheduled handler:", error);

      if (env.GOOGLE_CHAT_WEBHOOK_URL) {
        await sendErrorToGoogleChat(
          env.GOOGLE_CHAT_WEBHOOK_URL,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  },
};

async function processDailyPapers(env: Env, date: string): Promise<void> {
  console.log(`Processing papers for date: ${date}`);

  const papers = await fetchDailyPapers(date);

  if (papers.length === 0) {
    console.log("No papers found for today");
    return;
  }

  console.log(`Found ${papers.length} papers`);

  let summary: string;

  if (env.ANTHROPIC_API_KEY) {
    try {
      console.log("Analyzing papers with Langchain...");
      summary = await analyzePapersWithLangchain(papers, env.ANTHROPIC_API_KEY);
      console.log("Langchain analysis completed");
    } catch (error) {
      console.error(
        "Failed to analyze with Langchain, trying direct API:",
        error
      );
      try {
        summary = await analyzePapersWithLangchain(
          papers,
          env.ANTHROPIC_API_KEY
        );
        console.log("Direct API analysis completed");
      } catch (apiError) {
        console.error(
          "Failed to analyze with direct API, using simple summary:",
          apiError
        );
        summary = generateSimpleSummary(papers);
      }
    }
  } else {
    console.log("No API key found, using simple summary");
    summary = generateSimpleSummary(papers);
  }

  if (env.GOOGLE_CHAT_WEBHOOK_URL) {
    console.log("Sending to Google Chat...");
    const chatMessage = formatPapersForGoogleChat(papers, summary);

    const response = await fetch(env.GOOGLE_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(chatMessage),
    });

    if (response.ok) {
      console.log("Successfully sent to Google Chat");
    } else {
      const errorText = await response.text();
      console.error("Failed to send to Google Chat:", errorText);
      throw new Error("Failed to send to Google Chat");
    }
  } else {
    console.warn("No Google Chat webhook URL configured");
    console.log("Summary:", summary);
  }
}
