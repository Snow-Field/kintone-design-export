// utils/error.ts
export const getErrorMessage = (
  error: unknown,
  fallback = "不明なエラーが発生しました",
): string => (error instanceof Error ? error.message : fallback);
