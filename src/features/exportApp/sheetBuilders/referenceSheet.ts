import type { ExcelData, SheetResult, AppSettings } from "@/types";
import { getFieldProp } from "@/utils/field";

export function buildReferenceSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    [
      "",
      "フィールドコード",
      "参照先アプリID",
      "参照先アプリコード",
      "フィールド",
      "参照先のフィールド",
      "表示フィールド",
      "絞り込み",
      "ソート",
    ],
  ];

  Object.values(data.fields.properties).forEach((f) => {
    const referenceTable = getFieldProp(f, "referenceTable");
    if (!referenceTable) return;
    const r = referenceTable as {
      relatedApp: { app: string; code: string };
      condition: { field: string; relatedField: string };
      displayFields: string[];
      filterCond: string;
      sort: string;
    };
    rows.push([
      "",
      f.code,
      r.relatedApp.app,
      r.relatedApp.code,
      r.condition.field,
      r.condition.relatedField,
      r.displayFields.join(","),
      r.filterCond,
      r.sort,
    ]);
  });
  return { rows, headerIndex: [1] };
}
