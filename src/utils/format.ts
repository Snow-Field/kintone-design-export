/** 設定が有効であることを表す記号。このセルには背景色が付く */
export const CHECK_ON = '■';
/** 設定が無効であることを表す記号 */
export const CHECK_OFF = '□';
/** 行の種類（フィールドの型など）にそもそも存在しない項目を表す記号 */
export const NOT_APPLICABLE = '-';

/** 真偽値をチェック記号で表す */
export function checkMark(value: unknown): string {
  return value ? CHECK_ON : CHECK_OFF;
}

/** 値の一覧をカンマ区切りにする */
export function joinValues(values: readonly string[]): string {
  return values.join(',');
}
