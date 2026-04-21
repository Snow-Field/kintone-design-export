import type { ExcelData, SheetResult, AppSettings } from "@/types";

const flag = (b: boolean) => (b ? "■" : "□");

export function buildAppAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    [
      "",
      "コード",
      "種類",
      "閲覧",
      "追加",
      "編集",
      "削除",
      "管理",
      "読込",
      "書出",
      "継承",
    ],
  ];

  data.appAcl.rights.forEach((r) => {
    rows.push([
      "",
      r.entity.code || "",
      r.entity.type,
      flag(r.recordViewable),
      flag(r.recordAddable),
      flag(r.recordEditable),
      flag(r.recordDeletable),
      flag(r.appEditable),
      flag(r.recordImportable),
      flag(r.recordExportable),
      flag(r.includeSubs),
    ]);
  });
  return { rows, headerIndex: [1] };
}
