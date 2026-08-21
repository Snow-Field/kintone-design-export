import {
  Workbook,
  type Borders,
  type Fill,
  type Font,
  type Worksheet,
} from 'exceljs';
import type { ExcelData } from '@/types';

export const SHEET_NAMES = {
  GENERAL: '一般情報',
  FIELD: 'フィールド',
  CALC: '自動計算情報',
  ACTION: 'アクション情報',
  LOOKUP: 'ルックアップ情報',
  REFERENCE: '関連レコード情報',
  VIEW: '一覧',
  APP_ACL: 'アプリのアクセス権',
  RECORD_ACL: 'レコードのアクセス権',
  FIELD_ACL: 'フィールドのアクセス権',
  PROCESS: 'プロセス管理',
} as const;

const FONTS = {
  TITLE: { name: 'メイリオ', size: 16, bold: true },
  HEADER: { name: 'メイリオ', size: 11, bold: true },
  CELL: { name: 'メイリオ', size: 11 },
} as const satisfies Record<string, Partial<Font>>;

const HEADER_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF33CCCC' },
};

const NO_FILL: Fill = { type: 'pattern', pattern: 'none' };

const THIN_BORDER: Partial<Borders> = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};

export const COL_WIDTHS: Record<string, number[]> = {
  [SHEET_NAMES.GENERAL]: [13, 186, 404],
  [SHEET_NAMES.FIELD]: [
    13, 193, 193, 168, 59, 101, 101, 61, 61, 61, 61, 61, 61, 61, 245, 485,
  ],
  [SHEET_NAMES.CALC]: [13, 150, 120, 500],
  [SHEET_NAMES.ACTION]: [13, 145, 142, 53, 142, 175, 449, 245, 405],
  [SHEET_NAMES.LOOKUP]: [13, 142, 166, 175, 173, 449, 165, 165, 165],
  [SHEET_NAMES.REFERENCE]: [13, 204, 166, 175, 165, 165, 165, 165, 165],
  [SHEET_NAMES.VIEW]: [13, 145, 53, 101, 405, 405, 245, 565],
  [SHEET_NAMES.APP_ACL]: [13, 145, 165, 45, 45, 45, 45, 45, 45, 45, 45],
  [SHEET_NAMES.RECORD_ACL]: [13, 145, 405, 165, 45, 45, 45, 45],
  [SHEET_NAMES.FIELD_ACL]: [13, 165, 145, 145, 44, 44, 44],
  [SHEET_NAMES.PROCESS]: [13, 165, 205, 205],
};

/** 標準文字幅（ピクセル）。SheetJS が列幅の換算に用いている値 */
const MAX_DIGIT_WIDTH = 6;

/**
 * 列幅をピクセルから Excel の文字数単位へ変換する。
 * COL_WIDTHS はピクセルで定義されているが ExcelJS は文字数で扱うため、
 * 移行前と同じ見た目になるよう SheetJS と同じ二段階の換算を行う。
 * 換算式は移行前の出力を実測して割り出した（excel.migration.test.ts で検証）。
 */
export function pxToCharWidth(px: number): number {
  const chars = Math.floor(((px - 5) / MAX_DIGIT_WIDTH) * 100 + 0.5) / 100;
  return (
    Math.round(((chars * MAX_DIGIT_WIDTH + 5) / MAX_DIGIT_WIDTH) * 256) / 256
  );
}

export function createWorkbook(): Workbook {
  return new Workbook();
}

/** [一般情報]シート専用のスタイルを適用する */
function applyGeneralInfoStyle(ws: Worksheet) {
  const title = ws.getCell('B1');
  if (hasValue(title.value)) {
    // タイトルは罫線と塗りを持たない
    title.font = FONTS.TITLE;
    title.border = {};
    title.fill = NO_FILL;
  }
  for (const address of ['B3', 'B4', 'B5', 'B6', 'B7']) {
    const cell = ws.getCell(address);
    if (!hasValue(cell.value)) continue;
    cell.font = FONTS.HEADER;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  }
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined;
}

export function addStyledSheet(
  wb: Workbook,
  name: string,
  { rows, headerIndex }: { rows: ExcelData; headerIndex: number[] },
) {
  const ws = wb.addWorksheet(name);
  const headerRows = new Set(headerIndex ?? [1]);

  rows.forEach((row, r) => {
    const isHeader = headerRows.has(r);
    row.forEach((value, c) => {
      // A列は余白として使うため、セルを作らず罫線も引かない
      if (c === 0) return;
      // 値を持たない位置にはセルを作らない
      if (!hasValue(value)) return;
      const cell = ws.getCell(r + 1, c + 1);
      cell.value = value;
      cell.font = isHeader ? FONTS.HEADER : FONTS.CELL;
      cell.border = THIN_BORDER;
      if (isHeader) cell.fill = HEADER_FILL;
    });
  });

  if (name === SHEET_NAMES.GENERAL) {
    applyGeneralInfoStyle(ws);
  }

  COL_WIDTHS[name]?.forEach((px, i) => {
    ws.getColumn(i + 1).width = pxToCharWidth(px);
  });
}

export async function saveExcelFile(wb: Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
