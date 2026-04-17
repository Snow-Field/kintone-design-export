import * as XLSX from "xlsx-js-style";
import type { ExcelData } from "@/types";

export const SHEET_NAMES = {
  GENERAL: "一般情報",
  FIELD: "フィールド",
  LOOKUP: "ルックアップ情報",
  REFERENCE: "関連レコード情報",
  VIEW: "一覧",
  APP_ACL: "アプリのアクセス権",
  RECORD_ACL: "レコードのアクセス権",
  FIELD_ACL: "フィールドのアクセス権",
  PROCESS: "プロセス管理",
  CALC_INFO: "自動計算情報",
} as const;

export const STYLES = {
  HEADER: {
    font: { name: "メイリオ", sz: 11, bold: true },
    fill: { fgColor: { rgb: "33CCCC" } },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  },
  CELL: {
    font: { name: "メイリオ", sz: 11 },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  },
  TITLE: {
    font: { name: "メイリオ", sz: 16, bold: true },
  },
};

export const COL_WIDTHS: Record<string, number[]> = {
  [SHEET_NAMES.GENERAL]: [13, 186, 404],
  [SHEET_NAMES.FIELD]: [
    13, 140, 193, 168, 59, 101, 101, 61, 61, 61, 61, 61, 61, 61, 245, 485,
  ],
  [SHEET_NAMES.LOOKUP]: [13, 142, 166, 175, 173, 449, 165, 165, 165],
  [SHEET_NAMES.REFERENCE]: [13, 204, 166, 175, 165, 165, 165, 165, 165],
  [SHEET_NAMES.VIEW]: [13, 145, 53, 101, 405, 405, 245, 565],
  [SHEET_NAMES.APP_ACL]: [13, 85, 165, 45, 45, 45, 45, 45, 45, 45, 45],
  [SHEET_NAMES.RECORD_ACL]: [13, 85, 405, 165, 45, 45, 45, 45],
  [SHEET_NAMES.FIELD_ACL]: [13, 165, 149, 149, 44, 44, 44],
  [SHEET_NAMES.PROCESS]: [13, 165, 205, 205],
  [SHEET_NAMES.CALC_INFO]: [13, 150, 120, 500],
};

/** シートごとのヘッダー行インデックス（0始まり）。複数行ある場合は配列で指定 */
const HEADER_ROWS: Record<string, number[]> = {
  [SHEET_NAMES.GENERAL]: [1],
  [SHEET_NAMES.FIELD]: [1],
  [SHEET_NAMES.LOOKUP]: [1],
  [SHEET_NAMES.REFERENCE]: [1],
  [SHEET_NAMES.VIEW]: [1],
  [SHEET_NAMES.APP_ACL]: [1],
  [SHEET_NAMES.RECORD_ACL]: [1],
  [SHEET_NAMES.FIELD_ACL]: [1],
  [SHEET_NAMES.PROCESS]: [1],
  [SHEET_NAMES.CALC_INFO]: [1],
};

export function addStyledSheet(
  wb: XLSX.WorkBook,
  name: string,
  data: ExcelData,
) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const headerRows = new Set(HEADER_ROWS[name] ?? [1]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    const isHeader = headerRows.has(R);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr] || C === 0) continue;
      ws[addr].s = isHeader ? STYLES.HEADER : STYLES.CELL;
    }
  }

  if (COL_WIDTHS[name]) ws["!cols"] = COL_WIDTHS[name].map((w) => ({ wpx: w }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

export function saveExcelFile(wb: XLSX.WorkBook, filename: string) {
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
