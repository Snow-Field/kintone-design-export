import type { ExcelData, SheetResult, AppSettings } from "@/types";

export function buildActionSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [
    [],
    [
      "",
      "アクション名",
      "アクションID",
      "Index",
      "コピー先アプリID",
      "コピー先アプリコード",
      "フィールドの関連付け",
      "利用者コード／利用者の種類",
      "実行条件",
    ],
  ];

  Object.values(data.actions.actions).forEach((a) => {
    const mappings = a.mappings
      .map((m) =>
        m.srcType === "FIELD" ? `${m.srcField}->${m.destField}` : "",
      )
      .join(",");
    const entities = a.entities.map((e) => `${e.code}/${e.type}`).join("\n");
    rows.push([
      "",
      a.name,
      a.id,
      a.index,
      a.destApp.app,
      a.destApp.code,
      mappings,
      entities,
      a.filterCond,
    ]);
  });
  return { rows, headerIndex: [1] };
}
