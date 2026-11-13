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

/** 下位組織にも適用することを示す添え字 */
const INCLUDE_SUBS_SUFFIX = '(下位含む)';

/**
 * ユーザー・グループ・組織などを `種類:コード` で表す。
 * コードを持たない作成者（CREATOR）は種類だけを書く。
 */
export function formatEntity(
  entity: { type: string; code: string | null },
  includeSubs = false,
): string {
  const base = entity.code ? `${entity.type}:${entity.code}` : entity.type;
  return includeSubs ? `${base}${INCLUDE_SUBS_SUFFIX}` : base;
}

/** 対応元と対応先の組を `元 → 先` で表す */
export function formatMapping(src: string, dest: string): string {
  return `${src} → ${dest}`;
}
