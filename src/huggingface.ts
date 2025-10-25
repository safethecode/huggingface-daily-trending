import { HuggingFacePaper } from "./types";

export async function fetchDailyPapers(
  date: string
): Promise<HuggingFacePaper[]> {
  const url = `https://huggingface.co/api/daily_papers?date=${date}`;

  try {
    console.log(`Fetching papers from API: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HuggingFaceDailyBot/1.0)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch papers: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as any[];
    const papers = parseHuggingFaceAPI(data, date);

    console.log(`Found ${papers.length} papers`);
    return papers;
  } catch (error) {
    console.error("Error fetching papers:", error);
    throw error;
  }
}

function parseHuggingFaceAPI(data: any[], date: string): HuggingFacePaper[] {
  const papers: HuggingFacePaper[] = [];

  for (const item of data) {
    const paper = item.paper;
    if (!paper) continue;

    const id = paper.id;
    const title = item.title || paper.title || "";
    const summary = item.summary || paper.summary || "";

    const authors = paper.authors
      ? paper.authors.map((author: any) => {
          if (typeof author === "string") return author;
          return author.name || author.fullname || "";
        })
      : [];

    papers.push({
      id,
      title,
      authors,
      organization: paper.organization?.name || "Unknown",
      abstract: summary,
      publishedDate: date,
      pdfUrl: `https://huggingface.co/papers/${id}`,
      paperUrl: `https://huggingface.co/papers/${id}`,
      upvotes: paper.upvotes || 0,
    });
  }

  papers.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

  return papers;
}
