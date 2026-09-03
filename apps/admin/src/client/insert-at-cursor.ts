export function insertAtCursor(text: string, start: number, end: number, snippet: string): string {
  return text.slice(0, start) + snippet + text.slice(end);
}
