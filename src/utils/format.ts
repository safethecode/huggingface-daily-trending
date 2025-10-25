export function formatAuthors(authors: string[], maxCount: number): string {
  const displayAuthors = authors.slice(0, maxCount).join(", ");
  return authors.length > maxCount ? `${displayAuthors} 외` : displayAuthors;
}

export function replacePaperUrls(summary: string, paperUrls: string[]): string {
  let result = summary;
  let replacementCount = 0;

  result = result.replace(new RegExp(`\\[논문 보기\\]`, "g"), () => {
    if (replacementCount < paperUrls.length) {
      return paperUrls[replacementCount++];
    }
    return "[논문 보기]";
  });

  return result;
}
