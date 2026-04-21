import type { ExcelData, SheetResult, AppSettings } from "@/types";

const flag = (b: boolean) => (b ? "■" : "□");

export function buildRecordAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    ["", "コード", "絞り込み", "種類", "閲覧", "編集", "削除", "継承"],
  ];

  data.recordAcl.rights.forEach((r) => {
    r.entities.forEach((e) => {
      rows.push([
        "",
        e.entity.code,
        r.filterCond,
        e.entity.type,
        flag(e.viewable),
        flag(e.editable),
        flag(e.deletable),
        flag(e.includeSubs),
      ]);
    });
  });
  return { rows, headerIndex: [1] };
}
