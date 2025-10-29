import { fetchDailyPapers } from "../src/huggingface";
import { analyzePapersStructured } from "../src/langchain-analyzer";
import { sendErrorToGoogleChat, formatPapersForGoogleChat } from "../src/googlechat";
import { getTodayDate } from "../src/utils/date";
import type { AnalyzedPapersResponse } from "../src/types";

async function processDailyPapers(): Promise<void> {
  const date = getTodayDate();
  console.log(`Processing papers for date: ${date}`);

  try {
    const papers = await fetchDailyPapers(date);

    if (papers.length === 0) {
      console.log("No papers found for today");
      return;
    }

    console.log(`Found ${papers.length} papers`);

    let result: AnalyzedPapersResponse;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

    if (apiKey) {
      try {
        console.log("Analyzing papers with structured AI analysis...");
        result = await analyzePapersStructured(papers, apiKey);
        console.log("Structured analysis completed");
      } catch (error) {
        console.error("Failed to analyze with AI, using fallback:", error);
        result = {
          date,
          count: papers.length,
          papers: papers.slice(0, 5).map((paper) => ({
            title: paper.title,
            authors:
              paper.authors.slice(0, 3).join(", ") +
              (paper.authors.length > 3 ? " 외" : ""),
            organization: paper.organization,
            summary: paper.abstract.slice(0, 300) + "...",
            keyPoints: [],
            significance: "",
            paperUrl: paper.paperUrl,
            upvotes: paper.upvotes,
          })),
        };
      }
    } else {
      console.log("No API key found, using basic info");
      result = {
        date,
        count: papers.length,
        papers: papers.slice(0, 5).map((paper) => ({
          title: paper.title,
          authors:
            paper.authors.slice(0, 3).join(", ") +
            (paper.authors.length > 3 ? " 외" : ""),
          organization: paper.organization,
          summary: paper.abstract.slice(0, 300) + "...",
          keyPoints: [],
          significance: "",
          paperUrl: paper.paperUrl,
          upvotes: paper.upvotes,
        })),
      };
    }

    if (webhookUrl) {
      console.log("Sending to Google Chat...");
      const chatMessage = formatPapersForGoogleChat(result, date);

      const response = await fetch(webhookUrl, {
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
      console.log("Analysis result:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("Error in processDailyPapers:", error);

    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    if (webhookUrl) {
      await sendErrorToGoogleChat(
        webhookUrl,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    throw error;
  }
}

processDailyPapers()
  .then(() => {
    console.log("Daily papers processing completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Daily papers processing failed:", error);
    process.exit(1);
  });
