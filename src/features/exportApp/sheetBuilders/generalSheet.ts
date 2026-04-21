import type { SheetResult, AppSettings } from "@/types";

export function buildGeneralSheet(data: AppSettings): SheetResult {
  return {
    rows: [
      ["", "一般情報"],
      [],
      ["", "項目", "値"],
      ["", "ドメイン", location.hostname],
      ["", "アプリ名", data.app.name],
      ["", "アプリID", data.app.appId],
      ["", "アプリの説明", data.app.description],
    ],
    headerIndex: [1],
  };
}
