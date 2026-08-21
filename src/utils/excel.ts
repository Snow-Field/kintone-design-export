import { Workbook, type Borders, type Fill, type Worksheet } from 'exceljs';
import type { ColumnDef, ExcelCell, SheetBlock, SheetResult } from '@/types';
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

/** 表は左上から始める */
const FIRST_COLUMN = 1;
const FIRST_ROW = 1;
/** 表と表の間に空ける列数 */
const BLOCK_GAP_COLUMNS = 1;
/** 表と表の間に挟む列の幅 */
const GAP_COLUMN_WIDTH = 2;

/** 列幅に加える余裕。Excel の自動調整も文字幅ちょうどではなく少し広い */
const WIDTH_PADDING = 2;
/** オートフィルタのボタンが見出しに重ならないよう確保する幅 */
const FILTER_BUTTON_WIDTH = 3;
/** 列幅の下限と、Excel が扱える上限 */
const MIN_WIDTH = 3;
const MAX_WIDTH = 255;
/**
 * ExcelJS の既定列幅。この値をそのまま指定すると「幅の指定なし」と見なされ
 * xlsx に記録されず、Excel 側の既定幅（9 より狭い）で表示されてしまう。
 */
const EXCELJS_DEFAULT_WIDTH = 9;

/** 全角として数える文字の範囲 */
const FULL_WIDTH_CHAR =
  /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︐-﹯＀-｠￠-￦]/;

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

/**
 * 全角文字1つぶんの幅。
 *
 * Excel の列幅は「標準フォントの数字1文字ぶん」を単位としており、日本語
 * フォントの全角文字はその2倍よりわずかに広い。単純に2で数えると文字数が
 * 多い列ほど不足が積み上がるため、実際の字幅に近い係数を使う。
 */
const FULL_WIDTH_RATIO = 2.2;

/** 太字は通常より字幅が広がる。見出しに用いる */
const BOLD_RATIO = 1.05;

/**
 * セルの表示幅を Excel の文字数単位で数える。
 * セル内改行がある場合は最も長い行で測る。
 */
export function displayWidth(value: ExcelCell, bold = false): number {
  if (value === null || value === undefined) return 0;
  const width = String(value)
    .split('\n')
    .reduce((max, line) => {
      let sum = 0;
      for (const char of line) {
        sum += FULL_WIDTH_CHAR.test(char) ? FULL_WIDTH_RATIO : 1;
      }
      return Math.max(max, sum);
    }, 0);
  return bold ? width * BOLD_RATIO : width;
}

/**
 * 列幅を内容から決める。
 *
 * xlsx には「開いたときに自動調整せよ」という指定が無く、Excel の自動調整は
 * 表示時に実測して決まる。そのため見出しと値の表示幅を測って列幅に充てる。
 * 上段の見出しは結合されるため幅の対象にしない（Excel の自動調整も同じ）。
 *
 * オートフィルタを設定する表では、見出しにボタンが重なって文字が隠れるため、
 * 見出しの幅にボタンぶんを上乗せする。
 */
function computeColumnWidths(
  blocks: SheetBlock[],
  offsets: number[],
  withFilter: boolean,
): Array<number | undefined> {
  const widths: Array<number | undefined> = [];
  const extend = (column: number, width: number) => {
    const index = column - FIRST_COLUMN;
    widths[index] = Math.max(widths[index] ?? 0, width);
  };

  const headerExtra = withFilter ? FILTER_BUTTON_WIDTH : 0;

  blocks.forEach((block, blockIndex) => {
    const offset = offsets[blockIndex] ?? FIRST_COLUMN;
    block.columns.forEach((column, index) =>
      // 見出しは太字で表示されるぶん幅を要する
      extend(offset + index, displayWidth(column.header, true) + headerExtra),
    );
    for (const row of block.rows) {
      row.forEach((value, index) =>
        extend(offset + index, displayWidth(value)),
      );
    }
  });

  return widths.map((width) => {
    // 表と表の間に挟まる列は幅を測る対象が無い
    if (width === undefined) return undefined;
    const clamped = Math.min(
      Math.max(Math.ceil(width) + WIDTH_PADDING, MIN_WIDTH),
      MAX_WIDTH,
    );
    // 既定値と同じ幅は記録されないため、わずかにずらして必ず反映させる
    return clamped === EXCELJS_DEFAULT_WIDTH ? clamped + 0.1 : clamped;
  });
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

/** 見出しを書き、次に書き込む行番号を返す */
function writeHeader(
  ws: Worksheet,
  startRow: number,
  startColumn: number,
  columns: ColumnDef[],
): number {
  const twoTier = hasGroupRow(columns);

  if (twoTier) {
    groupSpans(columns).forEach(({ group, start, end }) => {
      const from = startColumn + start;
      const to = startColumn + end;
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
    const cell = ws.getCell(headerRow, startColumn + index);
    cell.value = column.header;
    cell.font = {
      name: THEME.font.name,
      size: THEME.font.size,
      bold: true,
      color: { argb: THEME.color.headerText },
    };
    cell.fill = solidFill(THEME.color.headerBg);
    cell.border = BORDER;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  return headerRow + 1;
}

/** 明細行を書き、次に書き込む行番号を返す */
function writeRows(
  ws: Worksheet,
  startRow: number,
  startColumn: number,
  block: SheetBlock,
): number {
  block.rows.forEach((row, rowIndex) => {
    const target = startRow + rowIndex;
    const striped = rowIndex % 2 === 1;
    block.columns.forEach((_, columnIndex) => {
      const cell = ws.getCell(target, startColumn + columnIndex);
      const value = row[columnIndex];
      if (value !== undefined && value !== null) cell.value = value;
      cell.font = { name: THEME.font.name, size: THEME.font.size };
      cell.border = BORDER;
      cell.alignment = { vertical: 'top' };
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
  // オートフィルタはシートに1つしか置けないため、表が1つのときだけ設定する
  const withFilter = blocks.length === 1;

  // 表は横に並べる。縦に積むと列幅が表どうしで共有され、片方の長い値が
  // もう片方の列まで広げてしまうため。
  const offsets: number[] = [];
  let nextColumn = FIRST_COLUMN;
  for (const block of blocks) {
    offsets.push(nextColumn);
    nextColumn += block.columns.length + BLOCK_GAP_COLUMNS;
  }

  let headerHeight = 0;
  blocks.forEach((block, index) => {
    const startColumn = offsets[index] ?? FIRST_COLUMN;
    const bodyStart = writeHeader(ws, FIRST_ROW, startColumn, block.columns);
    headerHeight = Math.max(headerHeight, bodyStart - FIRST_ROW);
    writeRows(ws, bodyStart, startColumn, block);
  });

  computeColumnWidths(blocks, offsets, withFilter).forEach((width, index) => {
    if (width === undefined) return;
    ws.getColumn(FIRST_COLUMN + index).width = width;
  });
  // 表の間に挟まる列は区切りとして狭くする
  offsets.slice(1).forEach((offset) => {
    ws.getColumn(offset - BLOCK_GAP_COLUMNS).width = GAP_COLUMN_WIDTH;
  });

  // 見出しまでを固定する。2段見出しなら2行とも固定される
  const freezeRow = FIRST_ROW + headerHeight - 1;
  if (headerHeight > 0) {
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: freezeRow }];
  }

  const firstBlock = blocks[0];
  if (withFilter && firstBlock) {
    ws.autoFilter = {
      from: { row: freezeRow, column: FIRST_COLUMN },
      to: {
        row: freezeRow + firstBlock.rows.length,
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
