/** 真偽値をチェック記号で表す */
export function checkMark(value: unknown): string {
  return value ? '■' : '□';
}

/** 値の一覧をカンマ区切りにする */
export function joinValues(values: readonly string[]): string {
  return values.join(',');
}
