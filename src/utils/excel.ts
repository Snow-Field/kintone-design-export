import { Workbook, type Borders, type Fill, type Worksheet } from 'exceljs';
import type { ColumnDef, SheetBlock, SheetResult } from '@/types';
import { THEME } from './theme';

export const SHEET_NAMES = {
  GENERAL: '一般情報',
  FIELD: 'フィールド',
  ACTION: 'アクション情報',
  LOOKUP: 'ルックアップ情報',
  REFERENCE: '関連レコード情報',
  VIEW: '一覧',
  APP_ACL: 'アプリのアクセス権',
  RECORD_ACL: 'レコードのアクセス権',
  FIELD_ACL: 'フィールドのアクセス権',
  PROCESS: 'プロセス管理',
} as const;

/** A列は余白として空けるため、表は B 列から始まる */
const FIRST_COLUMN = 2;
/** 表の開始行。1行目は余白として空ける */
const FIRST_ROW = 2;
/** 表と表の間に空ける行数 */
const BLOCK_GAP = 2;
/** A列の幅 */
const MARGIN_COLUMN_WIDTH = 2;

const BORDER: Partial<Borders> = {
  top: { style: 'thin', color: { argb: THEME.color.border } },
  bottom: { style: 'thin', color: { argb: THEME.color.border } },
  left: { style: 'thin', color: { argb: THEME.color.border } },
  right: { style: 'thin', color: { argb: THEME.color.border } },
};

function solidFill(argb: string): Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

export function createWorkbook(): Workbook {
  return new Workbook();
}

/** 隣り合う同じ group をひとまとまりとして、結合する範囲を求める */
function groupSpans(columns: ColumnDef[]): Array<{
  group: string | undefined;
  start: number;
  end: number;
}> {
  const spans: Array<{
    group: string | undefined;
    start: number;
    end: number;
  }> = [];
  columns.forEach((column, index) => {
    const last = spans.at(-1);
    if (last && last.group !== undefined && last.group === column.group) {
      last.end = index;
      return;
    }
    spans.push({ group: column.group, start: index, end: index });
  });
  return spans;
}

/** 表の見出しが2段かどうか。1列でも group を持てば2段にする */
function hasGroupRow(columns: ColumnDef[]): boolean {
  return columns.some((column) => column.group !== undefined);
}

function writeTitle(ws: Worksheet, row: number, title: string) {
  const cell = ws.getCell(row, FIRST_COLUMN);
  cell.value = title;
  cell.font = {
    name: THEME.font.name,
    size: THEME.font.titleSize,
    bold: true,
    color: { argb: THEME.color.titleText },
  };
}

/** 見出しを書き、次に書き込む行番号を返す */
function writeHeader(
  ws: Worksheet,
  startRow: number,
  columns: ColumnDef[],
): number {
  const twoTier = hasGroupRow(columns);

  if (twoTier) {
    groupSpans(columns).forEach(({ group, start, end }) => {
      const from = FIRST_COLUMN + start;
      const to = FIRST_COLUMN + end;
      // group を持たない列は上段を空のままにする
      if (group !== undefined) ws.getCell(startRow, from).value = group;
      if (to > from) ws.mergeCells(startRow, from, startRow, to);
      for (let c = from; c <= to; c++) {
        const target = ws.getCell(startRow, c);
        target.font = {
          name: THEME.font.name,
          size: THEME.font.size,
          bold: true,
          color: { argb: THEME.color.headerText },
        };
        target.fill = solidFill(THEME.color.groupHeaderBg);
        target.border = BORDER;
        target.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  }

  const headerRow = twoTier ? startRow + 1 : startRow;
  columns.forEach((column, index) => {
    const cell = ws.getCell(headerRow, FIRST_COLUMN + index);
    cell.value = column.header;
    cell.font = {
      name: THEME.font.name,
      size: THEME.font.size,
      bold: true,
      color: { argb: THEME.color.headerText },
    };
    cell.fill = solidFill(THEME.color.headerBg);
    cell.border = BORDER;
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
  });

  return headerRow + 1;
}

/** 明細行を書き、次に書き込む行番号を返す */
function writeRows(ws: Worksheet, startRow: number, block: SheetBlock): number {
  block.rows.forEach((row, rowIndex) => {
    const target = startRow + rowIndex;
    const striped = rowIndex % 2 === 1;
    block.columns.forEach((_, columnIndex) => {
      const cell = ws.getCell(target, FIRST_COLUMN + columnIndex);
      const value = row[columnIndex];
      if (value !== undefined && value !== null) cell.value = value;
      cell.font = { name: THEME.font.name, size: THEME.font.size };
      cell.border = BORDER;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (striped) cell.fill = solidFill(THEME.color.stripeBg);
    });
  });
  return startRow + block.rows.length;
}

export function addStyledSheet(
  wb: Workbook,
  name: string,
  { blocks }: SheetResult,
) {
  const ws = wb.addWorksheet(name);
  ws.getColumn(1).width = MARGIN_COLUMN_WIDTH;

  let row = FIRST_ROW;
  let firstHeaderRow: number | undefined;
  let firstBlock: SheetBlock | undefined;

  blocks.forEach((block, index) => {
    if (index > 0) row += BLOCK_GAP;
    if (block.title) {
      writeTitle(ws, row, block.title);
      row += 2;
    }
    const bodyStart = writeHeader(ws, row, block.columns);
    if (index === 0) {
      firstHeaderRow = bodyStart - 1;
      firstBlock = block;
    }
    row = writeRows(ws, bodyStart, block);
  });

  // 列幅は最も列数の多い表に合わせる
  const widest = blocks.reduce<ColumnDef[]>(
    (max, block) => (block.columns.length > max.length ? block.columns : max),
    [],
  );
  widest.forEach((column, index) => {
    ws.getColumn(FIRST_COLUMN + index).width = column.width;
  });

  // 見出しまでを固定する。2段見出しなら2行とも固定される
  if (firstHeaderRow !== undefined) {
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: firstHeaderRow }];
  }

  // オートフィルタはシートに1つしか置けないため、表が1つのときだけ設定する
  if (blocks.length === 1 && firstHeaderRow !== undefined && firstBlock) {
    ws.autoFilter = {
      from: { row: firstHeaderRow, column: FIRST_COLUMN },
      to: {
        row: firstHeaderRow + firstBlock.rows.length,
        column: FIRST_COLUMN + firstBlock.columns.length - 1,
      },
    };
  }
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
