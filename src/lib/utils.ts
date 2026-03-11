export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  return err instanceof Error ? err.message : fallback
}
