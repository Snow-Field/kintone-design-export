/**
 * Excel 設計書の配色とフォント。
 *
 * 見た目を変えたいときはこのファイルの値だけを差し替える。
 * 色は ExcelJS の書式に合わせて ARGB（先頭2桁は不透明度）で指定する。
 *
 * 見出しの背景色を変える場合は、文字色とのコントラスト比を 4.5:1 以上に
 * 保つこと。既定値は上段 11.6:1、下段 7.3:1 で、いずれも WCAG AAA を満たす。
 * 判断の背景は docs/specs/excel-layout.md を参照。
 */
export const THEME = {
  font: {
    name: 'Yu Gothic UI',
    size: 11,
    titleSize: 14,
  },
  color: {
    /** 上段見出しの背景 */
    groupHeaderBg: 'FF1F3864',
    /** 下段見出しの背景 */
    headerBg: 'FF2F5597',
    /** 見出しの文字 */
    headerText: 'FFFFFFFF',
    /** 偶数行の背景 */
    stripeBg: 'FFF2F7FC',
    /** 罫線 */
    border: 'FFBFCBD9',
    /** 表の上に置く見出しの文字 */
    titleText: 'FF1F3864',
  },
} as const;
