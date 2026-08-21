/**
 * xlsx-js-style から ExcelJS へ移行するにあたり、出力される .xlsx が
 * 等価であることを確認する。
 *
 * 両実装で生成したブックを同じ読み取り経路（ExcelJS）で読み込み、
 * セルの値・フォント・塗り・罫線・列幅を突き合わせる。
 * 移行の完了後、legacy 実装とともに削除する一時的なテスト。
 */
import { describe, expect, it, beforeAll, vi } from 'vitest';
import { Workbook } from 'exceljs';
import * as XLSX from 'xlsx-js-style';
import {
  addStyledSheet as addStyledSheetNext,
  createWorkbook,
  SHEET_NAMES,
} from './excel';
import { addStyledSheet as addStyledSheetLegacy } from './excel.legacy';
import { createMockAppSettings } from '@/test/fixtures/appSettings';
import type { AppSettings, SheetResult } from '@/types';
import {
  buildGeneralSheet,
  buildFieldSheet,
  buildCalcSheet,
  buildActionSheet,
  buildLookupSheet,
  buildReferenceSheet,
  buildViewSheet,
  buildAppAclSheet,
  buildRecordAclSheet,
  buildFieldAclSheet,
  buildProcessSheet,
} from '@/features/exportApp/sheetBuilders';

beforeAll(() => {
  vi.stubGlobal('location', { hostname: 'example.cybozu.com' });
});

const sheetDefinitions: Array<{
  name: string;
  builder: (data: AppSettings) => SheetResult;
}> = [
  { name: SHEET_NAMES.GENERAL, builder: buildGeneralSheet },
  { name: SHEET_NAMES.FIELD, builder: buildFieldSheet },
  { name: SHEET_NAMES.CALC, builder: buildCalcSheet },
  { name: SHEET_NAMES.ACTION, builder: buildActionSheet },
  { name: SHEET_NAMES.LOOKUP, builder: buildLookupSheet },
  { name: SHEET_NAMES.REFERENCE, builder: buildReferenceSheet },
  { name: SHEET_NAMES.VIEW, builder: buildViewSheet },
  { name: SHEET_NAMES.APP_ACL, builder: buildAppAclSheet },
  { name: SHEET_NAMES.RECORD_ACL, builder: buildRecordAclSheet },
  { name: SHEET_NAMES.FIELD_ACL, builder: buildFieldAclSheet },
  { name: SHEET_NAMES.PROCESS, builder: buildProcessSheet },
];

/** 比較に使う、セル1つ分の正規化した見た目 */
type NormalizedCell = {
  address: string;
  value: unknown;
  font: string;
  fill: string;
  border: string;
};

type NormalizedSheet = {
  name: string;
  cells: NormalizedCell[];
  columnWidths: Array<number | undefined>;
};

function describeFont(font: Partial<Record<string, unknown>> | undefined) {
  if (!font) return 'none';
  return `${font.name ?? ''}/${font.size ?? ''}/${font.bold ? 'bold' : 'normal'}`;
}

function describeFill(fill: Record<string, unknown> | undefined) {
  if (!fill || fill.pattern === 'none' || fill.type !== 'pattern')
    return 'none';
  const fg = fill.fgColor as { argb?: string } | undefined;
  return `solid:${fg?.argb ?? ''}`;
}

function describeBorder(border: Record<string, unknown> | undefined) {
  if (!border) return 'none';
  const side = (key: string) => {
    const value = border[key] as { style?: string } | undefined;
    return value?.style ?? '-';
  };
  const sides = ['top', 'bottom', 'left', 'right'].map(side);
  return sides.every((s) => s === '-') ? 'none' : sides.join(',');
}

/** ブックを読み込み、シートごとに正規化した見た目を取り出す */
async function normalize(buffer: ArrayBuffer): Promise<NormalizedSheet[]> {
  const wb = new Workbook();
  await wb.xlsx.load(buffer);

  return wb.worksheets.map((ws) => {
    const cells: NormalizedCell[] = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        // SheetJS 経由では空文字が null として読まれるため同一視する
        const value = cell.value === '' ? null : cell.value;
        const fill = describeFill(
          cell.fill as unknown as Record<string, unknown> | undefined,
        );
        const border = describeBorder(
          cell.border as unknown as Record<string, unknown> | undefined,
        );
        // 値も塗りも罫線も無いセルは見た目に影響しないため比較しない
        if (value === null && fill === 'none' && border === 'none') return;
        cells.push({
          address: cell.address,
          value,
          font: describeFont(cell.font as Record<string, unknown> | undefined),
          fill,
          border,
        });
      });
    });
    cells.sort((a, b) => a.address.localeCompare(b.address));

    const columnWidths: Array<number | undefined> = [];
    ws.columns?.forEach((col) => columnWidths.push(col.width));

    return { name: ws.name, cells, columnWidths };
  });
}

async function buildWithLegacy(data: AppSettings): Promise<ArrayBuffer> {
  const wb = XLSX.utils.book_new();
  sheetDefinitions.forEach(({ name, builder }) => {
    addStyledSheetLegacy(wb, name, builder(data));
  });
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

async function buildWithExcelJs(data: AppSettings): Promise<ArrayBuffer> {
  const wb = createWorkbook();
  sheetDefinitions.forEach(({ name, builder }) => {
    addStyledSheetNext(wb, name, builder(data));
  });
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

describe('xlsx-js-style から ExcelJS への移行', () => {
  let legacy: NormalizedSheet[];
  let next: NormalizedSheet[];

  beforeAll(async () => {
    const data = createMockAppSettings();
    legacy = await normalize(await buildWithLegacy(data));
    next = await normalize(await buildWithExcelJs(data));
  });

  it('シートの数と並び順が一致する', () => {
    expect(next.map((s) => s.name)).toEqual(legacy.map((s) => s.name));
  });

  it.each(sheetDefinitions.map((d) => d.name))(
    '%s シートのセルの値が一致する',
    (name) => {
      const a = legacy.find((s) => s.name === name);
      const b = next.find((s) => s.name === name);
      expect(b?.cells.map((c) => [c.address, c.value])).toEqual(
        a?.cells.map((c) => [c.address, c.value]),
      );
    },
  );

  it.each(sheetDefinitions.map((d) => d.name))(
    '%s シートのフォント・塗り・罫線が一致する',
    (name) => {
      const a = legacy.find((s) => s.name === name);
      const b = next.find((s) => s.name === name);
      expect(
        b?.cells.map((c) => [c.address, c.font, c.fill, c.border]),
      ).toEqual(a?.cells.map((c) => [c.address, c.font, c.fill, c.border]));
    },
  );

  it.each(sheetDefinitions.map((d) => d.name))(
    '%s シートの列幅が一致する',
    (name) => {
      const a = legacy.find((s) => s.name === name);
      const b = next.find((s) => s.name === name);
      expect(b?.columnWidths).toEqual(a?.columnWidths);
    },
  );
});
