import type { ExcelData, SheetResult, AppSettings } from "@/types";

export function buildCalcSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    ["", "対象フィールド名", "フィールドコード", "自動計算式"],
  ];

  Object.values(data.fields.properties).forEach((p) => {
    if ("expression" in p && p.expression) {
      rows.push(["", p.label, p.code, p.expression]);
    }
  });
  return { rows, headerIndex: [1] };
}
