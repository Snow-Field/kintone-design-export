/**
 * Excel 設計書の配色・フォント・列幅。
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
    /** 有効（■）のセルの背景。黒文字と 14.7:1、偶数行の背景と明るさで 1.32:1 の差 */
    checkedBg: 'FFC6E0B4',
    /** 罫線 */
    border: 'FFBFCBD9',
  },
  /**
   * 列幅（Excel の文字数単位）の範囲。値の表示幅から算出した列幅をこの範囲に収める。
   * 上限を超える値はセルの端で切れる。特定の列だけ上限を変えたい場合は
   * シートビルダーの ColumnDef.maxWidth で上書きする。
   */
  columnWidth: {
    min: 6,
    max: 50,
  },
} as const;
