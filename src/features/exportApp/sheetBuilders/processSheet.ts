import type { ExcelData, SheetResult, AppSettings } from "@/types";

export function buildProcessSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [[], ["", "ステータス名", "作業者", ""]];
  const headerIndex: number[] = [1];

  if (data.status.states) {
    Object.values(data.status.states).forEach((s) => {
      rows.push(["", s.name, s.assignee?.type || "", ""]);
      if (s.assignee?.entities)
        s.assignee.entities.forEach((e) =>
          rows.push([
            "",
            "",
            `${e.entity.type}:${e.entity.code}`,
            e.includeSubs ? "" : "継承しない",
          ]),
        );
    });
  }

  rows.push([]);
  const actionHeaderRow = rows.length;
  rows.push(["", "アクション", "実行前ステータス", "実行後ステータス"]);
  headerIndex.push(actionHeaderRow);

  const condHeaderRow = rows.length;
  rows.push(["", "", "条件", ""]);
  headerIndex.push(condHeaderRow);

  if (data.status.actions) {
    data.status.actions.forEach((a) =>
      rows.push(["", a.name, a.from, a.to], ["", "", a.filterCond || "", ""]),
    );
  }
  return { rows, headerIndex };
}
