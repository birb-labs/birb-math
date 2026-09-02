/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate the input.
 *
 * Shared by every call site that needs a randomized-but-deterministically-
 * overridable order (simulado question selection, OrderingInput,
 * MatchingInput) so there is exactly one implementation to reason about.
 */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
