import type { ExcelData, SheetResult, AppSettings } from "@/types";

const flag = (b: boolean) => (b ? "■" : "□");

export function buildFieldAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    ["", "フィールド", "コード", "種類", "閲覧", "編集", "継承"],
  ];

  data.fieldAcl.rights.forEach((r) => {
    r.entities.forEach((e) => {
      const view = e.accessibility !== "NONE" ? "■" : "□";
      const edit = e.accessibility === "WRITE" ? "■" : "□";
      rows.push([
        "",
        r.code,
        e.entity.code,
        e.entity.type,
        view,
        edit,
        flag(e.includeSubs),
      ]);
    });
  });
  return { rows, headerIndex: [1] };
}
