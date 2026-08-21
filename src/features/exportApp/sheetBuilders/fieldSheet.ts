import type {
  KintoneFormFieldProperty,
  KintoneFormLayout,
} from '@kintone/rest-api-client';
import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { getFieldProp } from '@/utils/field';
import { checkMark, joinValues } from '@/utils/format';

/** フィールドプロパティの型エイリアス */
type FieldProperty = KintoneFormFieldProperty.OneOf;

/** GROUP/SUBTABLE のヘッダー行として layoutList に挿入するプレースホルダー */
type LayoutPlaceholder = {
  type: 'GROUP_HEADER' | 'SUBTABLE_HEADER';
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

const COLUMNS: ColumnDef[] = [
  { group: '基本', header: 'No.', width: 6 },
  { group: '基本', header: 'フィールドコード', width: 26 },
  { group: '基本', header: 'フィールド名', width: 26 },
  { group: '基本', header: 'タイプ', width: 20 },
  { group: '基本', header: 'テーブル', width: 16 },
  { group: '基本', header: 'グループ', width: 16 },
  { group: '入力制約', header: '必須', width: 8 },
  { group: '入力制約', header: '重複禁止', width: 10 },
  { group: '入力制約', header: '最大長', width: 9 },
  { group: '入力制約', header: '最小長', width: 9 },
  { group: '入力制約', header: '最大値', width: 11 },
  { group: '入力制約', header: '最小値', width: 11 },
  { group: '初期値・選択肢', header: 'デフォルト値', width: 26 },
  { group: '初期値・選択肢', header: '選択肢', width: 32 },
  { group: '初期値・選択肢', header: '選択肢の並び', width: 13 },
  { group: '初期値・選択肢', header: '対象ユーザー', width: 26 },
  { group: '計算・表示形式', header: '計算式', width: 38 },
  { group: '計算・表示形式', header: '計算式を表示', width: 13 },
  { group: '計算・表示形式', header: '表示形式', width: 13 },
  { group: '計算・表示形式', header: '小数桁', width: 8 },
  { group: '計算・表示形式', header: '単位', width: 8 },
  { group: '計算・表示形式', header: '単位の位置', width: 11 },
  { group: '計算・表示形式', header: '桁区切り', width: 10 },
  { group: '表示', header: 'ラベル表示', width: 11 },
  { group: '表示', header: 'リンク種別', width: 12 },
  { group: '表示', header: 'サムネイルサイズ', width: 15 },
  { group: '表示', header: 'グループ初期表示', width: 15 },
  { group: '表示', header: '機能の有効', width: 11 },
];

/**
 * レイアウト項目に対応するフィールドプロパティを取得する。
 *
 * getFormFields は明細内のフィールドを properties 直下ではなく
 * サブテーブルの fields 配下に返すため、テーブル内の項目は
 * サブテーブル経由で解決する。
 */
function resolveFieldProperty(
  data: AppSettings,
  item: { code: string; table?: boolean; tableName?: string },
): FieldProperty | undefined {
  if (!item.table || !item.tableName) {
    return data.fields.properties[item.code];
  }
  const subtable = data.fields.properties[item.tableName];
  if (!subtable) return undefined;
  const fields = getFieldProp(subtable, 'fields') as
    Record<string, FieldProperty> | undefined;
  return fields?.[item.code];
}

/** レイアウトを、表示順に並んだ1次元の一覧へ展開する */
function flattenLayout(data: AppSettings): LayoutItem[] {
  const layoutList: LayoutItem[] = [];

  data.layout.layout.forEach((l) => {
    if (l.type === 'ROW') {
      layoutList.push(...l.fields);
      return;
    }
    if (l.type === 'GROUP') {
      layoutList.push({
        type: 'GROUP_HEADER',
        code: l.code,
        group: true,
        groupName: l.code,
      });
      l.layout.forEach((row) => {
        row.fields.forEach((f) => {
          layoutList.push({ ...f, group: true, groupName: l.code });
        });
      });
      return;
    }
    if (l.type === 'SUBTABLE') {
      layoutList.push({
        type: 'SUBTABLE_HEADER',
        code: l.code,
        table: true,
        tableName: l.code,
      });
      l.fields.forEach((f) => {
        layoutList.push({ ...f, table: true, tableName: l.code });
      });
    }
  });

  return layoutList;
}

/** 選択肢を index の昇順で並べたラベルの一覧 */
function optionLabels(field: FieldProperty): string {
  const options = getFieldProp(field, 'options') as
    Record<string, { label: string; index: string }> | undefined;
  if (!options) return '';
  return joinValues(
    Object.values(options)
      .toSorted((a, b) => Number(a.index) - Number(b.index))
      .map((option) => option.label),
  );
}

/** 選択肢に指定されたユーザー・グループ・組織のコード */
function entityCodes(field: FieldProperty): string {
  const entities = getFieldProp(field, 'entities');
  if (!Array.isArray(entities)) return '';
  return joinValues(
    (entities as Array<{ code: string }>).map((entity) => entity.code),
  );
}

/** デフォルト値。ユーザー選択などは配列で返るためコードを連結する */
function defaultValue(field: FieldProperty): string {
  const value = getFieldProp(field, 'defaultValue');
  if (value === undefined || value === null || value === '') return '';
  if (!Array.isArray(value)) return String(value);
  return joinValues(
    value.map((v) =>
      typeof v === 'object' && v !== null && 'code' in v
        ? String((v as { code: string }).code)
        : String(v),
    ),
  );
}

/** 値を持つ場合だけ文字列にする。未設定と false を区別したい列で使う */
function optional(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

export function buildFieldSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  flattenLayout(data).forEach((l, index) => {
    if (l.type === 'LABEL' || l.type === 'SPACER' || l.type === 'HR') {
      const label =
        ('elementId' in l && l.elementId) || ('label' in l && l.label) || '';
      rows.push([index, label, '', l.type]);
      return;
    }

    if (l.type === 'GROUP_HEADER' || l.type === 'SUBTABLE_HEADER') {
      const isTable = l.type === 'SUBTABLE_HEADER';
      rows.push([
        index,
        l.code,
        '',
        isTable ? 'SUBTABLE' : 'GROUP',
        isTable ? (l.tableName ?? '') : '',
        isTable ? '' : (l.groupName ?? ''),
      ]);
      return;
    }

    const f = resolveFieldProperty(data, l);
    if (!f) return;

    const hideExpression = getFieldProp(f, 'hideExpression');
    const digit = getFieldProp(f, 'digit');
    const openGroup = getFieldProp(f, 'openGroup');
    const enabled = getFieldProp(f, 'enabled');
    const noLabel = getFieldProp(f, 'noLabel');

    rows.push([
      index,
      f.code,
      f.label,
      f.type,
      l.table ? (l.tableName ?? '') : '',
      l.group ? (l.groupName ?? '') : '',
      getFieldProp(f, 'required') ? '必須' : '任意',
      getFieldProp(f, 'unique') ? '禁止' : '許可',
      optional(getFieldProp(f, 'maxLength')),
      optional(getFieldProp(f, 'minLength')),
      optional(getFieldProp(f, 'maxValue')),
      optional(getFieldProp(f, 'minValue')),
      defaultValue(f),
      optionLabels(f),
      optional(getFieldProp(f, 'align')),
      entityCodes(f),
      optional(getFieldProp(f, 'expression')),
      hideExpression === undefined ? '' : checkMark(!hideExpression),
      optional(getFieldProp(f, 'format')),
      optional(getFieldProp(f, 'displayScale')),
      optional(getFieldProp(f, 'unit')),
      optional(getFieldProp(f, 'unitPosition')),
      digit === undefined ? '' : checkMark(digit),
      checkMark(!noLabel),
      optional(getFieldProp(f, 'protocol')),
      optional(getFieldProp(f, 'thumbnailSize')),
      openGroup === undefined ? '' : checkMark(openGroup),
      enabled === undefined ? '' : checkMark(enabled),
    ]);
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
