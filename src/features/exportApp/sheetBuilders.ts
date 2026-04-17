import type { ExcelData, AppSettings } from "@/types";
import type {
  KintoneFormFieldProperty,
  KintoneFormLayout,
} from "@kintone/rest-api-client";

/** フィールドプロパティの型エイリアス */
type FieldProperty = KintoneFormFieldProperty.OneOf;

/** GROUP/SUBTABLE のヘッダー行として layoutList に挿入するプレースホルダー */
type LayoutPlaceholder = {
  type: "GROUP_HEADER" | "SUBTABLE_HEADER";
  code: string;
  table?: boolean;
  tableName?: string;
  group?: boolean;
  groupName?: string;
};

/** レイアウトフィールドに table/group メタ情報を付加した型 */
type LayoutItem =
  | (KintoneFormLayout.Field.OneOf & {
      table?: boolean;
      tableName?: string;
      group?: boolean;
      groupName?: string;
    })
  | LayoutPlaceholder;

const flag = (b: boolean) => (b ? "■" : "□");

export function buildGeneralSheet(data: AppSettings): ExcelData {
  return [
    ["", "一般情報"],
    [],
    ["", "ドメイン", location.hostname],
    ["", "アプリ名", data.app.name],
    ["", "アプリID", data.app.appId],
    ["", "アプリの説明", data.app.description],
  ];
}

export function buildFieldSheet(data: AppSettings): ExcelData {
  const rows: ExcelData = [
    [],
    [
      "",
      "フィールドコード",
      "フィールド名",
      "タイプ",
      "表示順",
      "テーブル",
      "グループ",
      "ラベル",
      "必須",
      "重複",
      "最大長",
      "最小長",
      "最大値",
      "最小値",
      "デフォルト値",
      "仕様",
    ],
  ];
  const layoutList: LayoutItem[] = [];
  data.layout.layout.forEach((l) => {
    if (l.type === "ROW") {
      layoutList.push(...l.fields);
    } else if (l.type === "GROUP") {
      layoutList.push({
        type: "GROUP_HEADER" as const,
        code: l.code,
        group: true,
        groupName: l.code,
      });
      l.layout.forEach((row) => {
        row.fields.forEach((f) => {
          layoutList.push({ ...f, group: true, groupName: l.code });
        });
      });
    } else if (l.type === "SUBTABLE") {
      layoutList.push({
        type: "SUBTABLE_HEADER" as const,
        code: l.code,
        table: true,
        tableName: l.code,
      });
      l.fields.forEach((f) => {
        layoutList.push({ ...f, table: true, tableName: l.code });
      });
    }
  });

  layoutList.forEach((l, idx) => {
    if (l.type === "LABEL" || l.type === "SPACER" || l.type === "HR") {
      rows.push([
        "",
        ("elementId" in l && l.elementId) || ("label" in l && l.label) || "",
        "",
        l.type,
        idx,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      return;
    }
    if (l.type === "GROUP_HEADER" || l.type === "SUBTABLE_HEADER") {
      return;
    }
    const f: FieldProperty | undefined = data.fields.properties[l.code];
    if (!f) return;
    const spec: string[] = [];
    if ("options" in f && f.options)
      spec.push(`options=[${Object.keys(f.options).join(",")}]`);
    if ("expression" in f && f.expression)
      spec.push(`expression=${f.expression}`);

    // defaultValue は配列の場合があるため文字列化
    let defaultValueStr = "";
    if ("defaultValue" in f && f.defaultValue) {
      defaultValueStr = Array.isArray(f.defaultValue)
        ? f.defaultValue
            .map((v) => (typeof v === "object" ? v.code : v))
            .join(",")
        : String(f.defaultValue);
    }

    rows.push([
      "",
      f.code,
      f.label,
      f.type,
      idx,
      l.table ? (l.tableName ?? "") : "",
      l.group ? (l.groupName ?? "") : "",
      "noLabel" in f ? (f.noLabel ? "非表示" : "表示") : "表示",
      "required" in f && f.required ? "必須" : "任意",
      "unique" in f && f.unique ? "禁止" : "許可",
      ("maxLength" in f && f.maxLength) || "",
      ("minLength" in f && f.minLength) || "",
      ("maxValue" in f && f.maxValue) || "",
      ("minValue" in f && f.minValue) || "",
      defaultValueStr,
      spec.join(","),
    ]);
  });
  return rows;
}

export function buildLookupSheet(data: AppSettings): ExcelData {
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
    if (!("lookup" in f) || !f.lookup) return;
    const mappings = f.lookup.fieldMappings
      .map((m) => `${m.field}->${m.relatedField}`)
      .join(",");
    rows.push([
      "",
      f.code,
      f.lookup.relatedApp.app,
      f.lookup.relatedApp.code,
      f.lookup.relatedKeyField,
      mappings,
      f.lookup.lookupPickerFields.join(","),
      f.lookup.filterCond,
      f.lookup.sort,
    ]);
  });
  return rows;
}

export function buildReferenceSheet(data: AppSettings): ExcelData {
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
    if (!("referenceTable" in f) || !f.referenceTable) return;
    const r = f.referenceTable;
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
  return rows;
}

export function buildViewSheet(data: AppSettings): ExcelData {
  const rows: ExcelData = [
    [],
    [
      "",
      "一覧名",
      "index",
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
  return rows;
}

export function buildAppAclSheet(data: AppSettings): ExcelData {
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
  return rows;
}

export function buildRecordAclSheet(data: AppSettings): ExcelData {
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
  return rows;
}

export function buildFieldAclSheet(data: AppSettings): ExcelData {
  const rows: ExcelData = [
    [],
    ["", "", "設定対象", "", "設定内容", "", ""],
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
  return rows;
}

export function buildProcessSheet(data: AppSettings): ExcelData {
  const rows: ExcelData = [
    ["", data.status.enable ? "プロセス管理有効" : "プロセス管理無効"],
    [],
    ["", "ステータス名", "作業者", ""],
  ];
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
  rows.push(
    [],
    ["", "アクション", "実行前ステータス", "実行後ステータス"],
    ["", "", "条件", ""],
  );
  if (data.status.actions) {
    data.status.actions.forEach((a) =>
      rows.push(["", a.name, a.from, a.to], ["", "", a.filterCond || "", ""]),
    );
  }
  return rows;
}

export function buildCalcInfoSheet(data: AppSettings): ExcelData {
  const rows: ExcelData = [
    [],
    ["", "対象フィールド名", "フィールドコード", "自動計算式"],
  ];
  Object.values(data.fields.properties).forEach((p) => {
    // kintoneRestAPIClientの型推論により、p.typeなどで型チェックが可能
    if ("expression" in p && p.expression) {
      rows.push(["", p.label, p.code, p.expression]);
    }
  });
  return rows;
}
