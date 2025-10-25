import { HuggingFacePaper } from "./types";

export function formatPaperForSummary(
  paper: HuggingFacePaper,
  index: number
): string {
  return `
논문 ${index + 1}:
제목: ${paper.title}
저자: ${paper.authors.slice(0, 3).join(", ")}${
    paper.authors.length > 3 ? " 외" : ""
  }
초록: ${paper.abstract}
추천수: ${paper.upvotes || 0}
`;
}
