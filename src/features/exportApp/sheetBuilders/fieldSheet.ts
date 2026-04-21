import type {
  KintoneFormFieldProperty,
  KintoneFormLayout,
} from "@kintone/rest-api-client";
import type { ExcelData, SheetResult, AppSettings } from "@/types";
import { getFieldProp } from "@/utils/field";

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

export function buildFieldSheet(data: AppSettings): SheetResult {
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
    // GROUP/SUBTABLE のヘッダー行を出力
    if (l.type === "GROUP_HEADER" || l.type === "SUBTABLE_HEADER") {
      const fieldType = l.type === "GROUP_HEADER" ? "GROUP" : "SUBTABLE";
      rows.push([
        "",
        l.code,
        "",
        fieldType,
        idx,
        l.type === "SUBTABLE_HEADER" ? (l.tableName ?? "") : "",
        l.type === "GROUP_HEADER" ? (l.groupName ?? "") : "",
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
    const f: FieldProperty | undefined = data.fields.properties[l.code];
    if (!f) return;

    const spec: string[] = [];
    // 選択肢の並び
    const align = getFieldProp(f, "align");
    if (align) {
      if (align === "HORIZONTAL") spec.push("水平");
      else if (align === "VERTICAL") spec.push("垂直");
    }
    // 選択肢名
    const options = getFieldProp(f, "options");
    if (options)
      spec.push(`options=[${Object.keys(options as object).join(",")}]`);
    // 自動計算式
    const expression = getFieldProp(f, "expression");
    if (expression) spec.push(`expression=${expression}`);
    // 計算フィールドの計算式を非表示にするかどうか
    const hideExpression = getFieldProp(f, "hideExpression");
    if (hideExpression === false) spec.push("計算フィールドの計算式を表示");
    // 数値の桁区切り
    const digit = getFieldProp(f, "digit");
    if (digit !== undefined) {
      if (digit === false) spec.push("桁区切りを非表示");
      else if (digit === true) spec.push("桁区切りを表示");
    }
    // 画像のサムネイルの大きさ
    const thumbnailSize = getFieldProp(f, "thumbnailSize");
    if (thumbnailSize) spec.push(`thumbnailSize=${thumbnailSize}`);
    // リンクの種類
    const protocol = getFieldProp(f, "protocol");
    if (protocol) spec.push(String(protocol));
    // 計算フィールドの表示形式
    const format = getFieldProp(f, "format");
    if (format) spec.push(String(format));
    // 小数点以下の表示桁数
    const displayScale = getFieldProp(f, "displayScale");
    if (displayScale) spec.push(String(displayScale));
    // 単位記号
    const unit = getFieldProp(f, "unit");
    if (unit) spec.push(`unit=${unit}`);
    // 単位記号の表示位置
    const unitPosition = getFieldProp(f, "unitPosition");
    if (unitPosition) spec.push(`unitPosition=${unitPosition}`);
    // 選択肢のユーザーの一覧
    const entities = getFieldProp(f, "entities");
    if (entities && Array.isArray(entities))
      spec.push(
        `entities=[${(entities as Array<{ code: string; type: string }>).map((e) => e.code).join(",")}]`,
      );
    // グループ内のフィールドを表示するかどうか
    const openGroup = getFieldProp(f, "openGroup");
    if (openGroup === false) spec.push("グループ閉");
    // 機能が有効かどうか
    const enabled = getFieldProp(f, "enabled");
    if (enabled === true) spec.push("有効");

    // defaultValue は配列の場合があるため文字列化
    let defaultValueStr = "";
    const defaultValue = getFieldProp(f, "defaultValue");
    if (defaultValue) {
      defaultValueStr = Array.isArray(defaultValue)
        ? defaultValue
            .map((v) =>
              typeof v === "object" && v !== null && "code" in v
                ? (v as { code: string }).code
                : String(v),
            )
            .join(",")
        : String(defaultValue);
    }

    rows.push([
      "",
      f.code,
      f.label,
      f.type,
      idx,
      l.table ? (l.tableName ?? "") : "",
      l.group ? (l.groupName ?? "") : "",
      getFieldProp(f, "noLabel") !== undefined
        ? getFieldProp(f, "noLabel")
          ? "非表示"
          : "表示"
        : "表示",
      getFieldProp(f, "required") ? "必須" : "任意",
      getFieldProp(f, "unique") ? "禁止" : "許可",
      (getFieldProp(f, "maxLength") as string | undefined) || "",
      (getFieldProp(f, "minLength") as string | undefined) || "",
      (getFieldProp(f, "maxValue") as string | undefined) || "",
      (getFieldProp(f, "minValue") as string | undefined) || "",
      defaultValueStr,
      spec.join(","),
    ]);
  });
  return { rows, headerIndex: [1] };
}
