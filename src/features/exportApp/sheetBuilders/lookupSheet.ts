import type { ExcelData, SheetResult, AppSettings } from "@/types";
import { getFieldProp } from "@/utils/field";

export function buildLookupSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    [
      "",
      "フィールドコード",
      "コピー元アプリID",
      "コピー元アプリコード",
      "コピー元のフィールド",
      "ほかのフィールドのコピー",
      "表示フィールド",
      "絞り込み",
      "ソート",
    ],
  ];

  Object.values(data.fields.properties).forEach((f) => {
    const lookup = getFieldProp(f, "lookup");
    if (!lookup) return;
    const l = lookup as {
      relatedApp: { app: string; code: string };
      relatedKeyField: string;
      fieldMappings: Array<{ field: string; relatedField: string }>;
      lookupPickerFields: string[];
      filterCond: string;
      sort: string;
    };
    const mappings = l.fieldMappings
      .map((m) => `${m.field}->${m.relatedField}`)
      .join(",");
    rows.push([
      "",
      f.code,
      l.relatedApp.app,
      l.relatedApp.code,
      l.relatedKeyField,
      mappings,
      l.lookupPickerFields.join(","),
      l.filterCond,
      l.sort,
    ]);
  });
  return { rows, headerIndex: [1] };
}
