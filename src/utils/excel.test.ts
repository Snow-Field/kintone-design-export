import { describe, expect, it } from 'vitest';
import { COL_WIDTHS, pxToCharWidth, SHEET_NAMES } from './excel';

/**
 * 期待値は移行前（xlsx-js-style）が出力していた列幅の実測値。
 * COL_WIDTHS に現れるすべてのピクセル値を網羅している。
 * ここが崩れると列幅が移行前と変わるため、換算式を変更する場合は
 * 実測し直したうえでこの表を更新すること。
 */
const MEASURED: Array<[px: number, width: number]> = [
  [13, 2.1640625],
  [44, 7.33203125],
  [45, 7.50390625],
  [53, 8.83203125],
  [59, 9.83203125],
  [61, 10.1640625],
  [101, 16.83203125],
  [120, 20.00390625],
  [142, 23.6640625],
  [145, 24.1640625],
  [150, 25.00390625],
  [165, 27.50390625],
  [166, 27.6640625],
  [168, 28.00390625],
  [173, 28.83203125],
  [175, 29.1640625],
  [186, 31.00390625],
  [193, 32.1640625],
  [204, 34.00390625],
  [205, 34.1640625],
  [245, 40.83203125],
  [404, 67.33203125],
  [405, 67.50390625],
  [449, 74.83203125],
  [485, 80.83203125],
  [500, 83.33203125],
  [565, 94.1640625],
];

describe('pxToCharWidth', () => {
  it.each(MEASURED)('%d px を %d に換算する', (px, width) => {
    expect(pxToCharWidth(px)).toBe(width);
  });

  it('COL_WIDTHS に現れるすべての値が実測表に含まれている', () => {
    const used = [...new Set(Object.values(COL_WIDTHS).flat())].sort(
      (a, b) => a - b,
    );
    const measured = MEASURED.map(([px]) => px);
    expect(used.filter((px) => !measured.includes(px))).toEqual([]);
  });
});

describe('COL_WIDTHS', () => {
  it('すべてのシートに列幅が定義されている', () => {
    for (const name of Object.values(SHEET_NAMES)) {
      expect(COL_WIDTHS[name], `${name} の列幅が未定義`).toBeDefined();
    }
  });

  it('先頭列は余白のため一定の幅である', () => {
    for (const [name, widths] of Object.entries(COL_WIDTHS)) {
      expect(widths[0], `${name} の先頭列`).toBe(13);
    }
  });
});
