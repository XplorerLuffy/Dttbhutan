/**
 * "Good morning / afternoon / evening" for an hour of the day (0-23).
 * Morning 5-11, afternoon 12-16, evening 17-4, so there is no hour without a greeting.
 */
export function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** The hour in Bhutan (UTC+6) — what the server uses until the browser reports its own clock. */
export function bhutanHour(now: Date = new Date()): number {
  return (now.getUTCHours() + 6) % 24;
}

/** Initials for an avatar: first letter of the first and last word, or just one letter. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}
