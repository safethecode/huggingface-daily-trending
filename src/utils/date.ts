export function getTodayDate(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);

  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getYesterdayDate(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const yesterday = new Date(now.getTime() + kstOffset - 24 * 60 * 60 * 1000);

  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
