import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  HuggingFacePaper,
  PaperSummary,
  AnalyzedPapersResponse,
} from "./types";
import { formatPaperForSummary } from "./pdf";
import { PROMPTS } from "./prompts";
import { createAIModel } from "./config/ai-model";
import { PAPER_CONFIG, AI_CONFIG } from "./config/constants";
import { formatAuthors, replacePaperUrls } from "./utils/format";

export async function analyzePapersWithLangchain(
  papers: HuggingFacePaper[],
  apiKey: string
): Promise<string> {
  try {
    const topPapers = papers.slice(0, PAPER_CONFIG.topPapersCount);

    const papersText = topPapers
      .map((paper, index) => formatPaperForSummary(paper, index))
      .join("\n---\n");

    const model = createAIModel(apiKey, {
      maxTokens: AI_CONFIG.maxTokens.summary,
    });

    const promptTemplate = PromptTemplate.fromTemplate(PROMPTS.paperSummary);
    const outputParser = new StringOutputParser();
    const chain = promptTemplate.pipe(model).pipe(outputParser);

    console.log("Analyzing papers with Langchain...");
    const summary = await chain.invoke({
      papers: papersText,
    });

    console.log("Langchain analysis completed");

    const paperUrls = topPapers.map((p) => p.paperUrl);
    const finalSummary = replacePaperUrls(summary, paperUrls);

    return finalSummary;
  } catch (error) {
    console.error("Error analyzing papers with Langchain:", error);
    throw error;
  }
}

export function generateSimpleSummary(papers: HuggingFacePaper[]): string {
  const topPapers = papers.slice(0, PAPER_CONFIG.topPapersCount);

  let summary = "📊 **오늘의 Hugging Face 인기 논문**\n\n";

  topPapers.forEach((paper, index) => {
    summary += `**${index + 1}. ${paper.title}**\n`;
    summary += `👥 저자: ${formatAuthors(
      paper.authors,
      PAPER_CONFIG.maxAuthorsDisplay.short
    )}\n`;
    summary += `📝 초록: ${paper.abstract.slice(
      0,
      PAPER_CONFIG.abstractPreviewLength.short
    )}...\n`;
    summary += `🔗 링크: ${paper.paperUrl}\n`;
    if (paper.upvotes) {
      summary += `👍 추천: ${paper.upvotes}\n`;
    }
    summary += "\n";
  });

  summary += `\n총 ${papers.length}개의 논문이 발견되었습니다.`;

  return summary;
}

export async function analyzePapersStructured(
  papers: HuggingFacePaper[],
  apiKey: string
): Promise<AnalyzedPapersResponse> {
  try {
    const topPapers = papers.slice(0, PAPER_CONFIG.topPapersCount);
    const model = createAIModel(apiKey, {
      maxTokens: AI_CONFIG.maxTokens.structured,
    });

    const papersText = topPapers
      .map((paper, index) => formatPaperForSummary(paper, index))
      .join("\n---\n");

    const promptTemplate = PromptTemplate.fromTemplate(
      PROMPTS.batchStructuredAnalysis
    );

    const outputParser = new StringOutputParser();
    const chain = promptTemplate.pipe(model).pipe(outputParser);

    console.log("Analyzing all papers in a single API call...");
    const result = await chain.invoke({
      papers: papersText,
    });

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON array from AI response");
    }

    const parsedResults = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedResults)) {
      throw new Error("AI response is not an array");
    }

    const analyzedPapers: PaperSummary[] = topPapers.map((paper, index) => {
      const analysis = parsedResults[index];

      if (!analysis) {
        return {
          title: paper.title,
          authors: formatAuthors(
            paper.authors,
            PAPER_CONFIG.maxAuthorsDisplay.short
          ),
          organization: paper.organization,
          summary:
            paper.abstract.slice(0, PAPER_CONFIG.abstractPreviewLength.long) +
            "...",
          keyPoints: [],
          significance: "",
          paperUrl: paper.paperUrl,
          upvotes: paper.upvotes,
        };
      }

      return {
        title: paper.title,
        titleKo: analysis.titleKo,
        authors: formatAuthors(
          paper.authors,
          PAPER_CONFIG.maxAuthorsDisplay.short
        ),
        organization: paper.organization,
        summary: analysis.summary,
        keyPoints: analysis.keyPoints || [],
        significance: analysis.significance,
        eliFor5: analysis.eliFor5,
        paperUrl: paper.paperUrl,
        upvotes: paper.upvotes,
      };
    });

    console.log("Batch analysis completed");

    return {
      date: papers[0]?.publishedDate || "",
      count: papers.length,
      papers: analyzedPapers,
    };
  } catch (error) {
    console.error("Error in structured analysis:", error);
    throw error;
  }
}
