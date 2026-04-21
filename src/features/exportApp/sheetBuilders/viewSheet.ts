import type { ExcelData, SheetResult, AppSettings } from "@/types";

export function buildViewSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    [
      "",
      "一覧名",
      "Index",
      "タイプ",
      "表示フィールド",
      "絞込条件",
      "ソート条件",
      "その他",
    ],
  ];

  Object.values(data.views.views)
    .sort((a, b) => Number(a.index) - Number(b.index))
    .forEach((v) => {
      rows.push([
        "",
        v.name,
        v.index,
        v.type,
        "fields" in v ? (v.fields?.join(",") ?? "") : "",
        v.filterCond,
        v.sort,
        `id=${v.id}`,
      ]);
    });
  return { rows, headerIndex: [1] };
}
