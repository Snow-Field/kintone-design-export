import type {
  KintoneFormFieldProperty,
  KintoneFormLayout,
} from '@kintone/rest-api-client';
import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { getFieldProp } from '@/utils/field';
import { checkMark, joinValues, NOT_APPLICABLE } from '@/utils/format';

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
  { group: '基本', header: 'No.' },
  { group: '基本', header: 'フィールドコード' },
  { group: '基本', header: 'フィールド名' },
  { group: '基本', header: 'タイプ' },
  { group: '基本', header: 'テーブル' },
  { group: '基本', header: 'グループ' },
  { group: '入力制約', header: '必須' },
  { group: '入力制約', header: '重複禁止' },
  { group: '入力制約', header: '最大長' },
  { group: '入力制約', header: '最小長' },
  { group: '入力制約', header: '最大値' },
  { group: '入力制約', header: '最小値' },
  { group: '初期値・選択肢', header: 'デフォルト値' },
  { group: '初期値・選択肢', header: '選択肢' },
  { group: '初期値・選択肢', header: '選択肢の並び' },
  { group: '初期値・選択肢', header: '対象ユーザー' },
  { group: '計算・表示形式', header: '計算式' },
  { group: '計算・表示形式', header: '計算式を表示' },
  { group: '計算・表示形式', header: '表示形式' },
  { group: '計算・表示形式', header: '小数桁' },
  { group: '計算・表示形式', header: '単位' },
  { group: '計算・表示形式', header: '単位の位置' },
  { group: '計算・表示形式', header: '桁区切り' },
  { group: '表示', header: 'ラベル表示' },
  { group: '表示', header: 'リンク種別' },
  { group: '表示', header: 'サムネイルサイズ' },
  { group: '表示', header: 'グループ初期表示' },
  { group: '表示', header: '機能の有効' },
];

/** 属性列の開始位置。これより左は行の種類を問わず値を持つ基本情報 */
const ATTRIBUTE_START = COLUMNS.findIndex((c) => c.group === '入力制約');

/** 属性を持たない行（ラベル・グループなど）の属性列 */
function noAttributes(): string[] {
  return Array<string>(COLUMNS.length - ATTRIBUTE_START).fill(NOT_APPLICABLE);
}

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
  if (!options) return NOT_APPLICABLE;
  return joinValues(
    Object.values(options)
      .toSorted((a, b) => Number(a.index) - Number(b.index))
      .map((option) => option.label),
  );
}

/** 選択肢に指定されたユーザー・グループ・組織のコード */
function entityCodes(field: FieldProperty): string {
  const entities = getFieldProp(field, 'entities');
  if (!Array.isArray(entities)) return NOT_APPLICABLE;
  return joinValues(
    (entities as Array<{ code: string }>).map((entity) => entity.code),
  );
}

/** デフォルト値。ユーザー選択などは配列で返るためコードを連結する */
function defaultValue(field: FieldProperty): string {
  const value = getFieldProp(field, 'defaultValue');
  if (value === undefined) return NOT_APPLICABLE;
  if (value === null || value === '') return '';
  if (!Array.isArray(value)) return String(value);
  return joinValues(
    value.map((v) =>
      typeof v === 'object' && v !== null && 'code' in v
        ? String((v as { code: string }).code)
        : String(v),
    ),
  );
}

/** 属性を文字列にする。型に存在しない属性は -、未設定は空欄 */
function attr(field: FieldProperty, key: string): string {
  const value = getFieldProp(field, key);
  if (value === undefined) return NOT_APPLICABLE;
  return value === null ? '' : String(value);
}

/** 真偽値の属性をチェック記号にする。invert は「〜しない」を表す属性に使う */
function flag(field: FieldProperty, key: string, invert = false): string {
  const value = getFieldProp(field, key);
  if (value === undefined) return NOT_APPLICABLE;
  return checkMark(invert ? !value : value);
}

/** 真偽値の属性を2択の語にする */
function choice(
  field: FieldProperty,
  key: string,
  on: string,
  off: string,
): string {
  const value = getFieldProp(field, key);
  if (value === undefined) return NOT_APPLICABLE;
  return value ? on : off;
}

export function buildFieldSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  flattenLayout(data).forEach((l, index) => {
    if (l.type === 'LABEL' || l.type === 'SPACER' || l.type === 'HR') {
      const label =
        ('elementId' in l && l.elementId) || ('label' in l && l.label) || '';
      rows.push([index, label, '', l.type, '', '', ...noAttributes()]);
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
        ...noAttributes(),
      ]);
      return;
    }

    const f = resolveFieldProperty(data, l);
    if (!f) return;

    rows.push([
      index,
      f.code,
      f.label,
      f.type,
      l.table ? (l.tableName ?? '') : '',
      l.group ? (l.groupName ?? '') : '',
      choice(f, 'required', '必須', '任意'),
      choice(f, 'unique', '禁止', '許可'),
      attr(f, 'maxLength'),
      attr(f, 'minLength'),
      attr(f, 'maxValue'),
      attr(f, 'minValue'),
      defaultValue(f),
      optionLabels(f),
      attr(f, 'align'),
      entityCodes(f),
      attr(f, 'expression'),
      // 「計算式を表示」は API では「隠す」で返る
      flag(f, 'hideExpression', true),
      attr(f, 'format'),
      attr(f, 'displayScale'),
      attr(f, 'unit'),
      attr(f, 'unitPosition'),
      flag(f, 'digit'),
      // 「ラベル表示」は API では「表示しない」で返る
      flag(f, 'noLabel', true),
      attr(f, 'protocol'),
      attr(f, 'thumbnailSize'),
      flag(f, 'openGroup'),
      flag(f, 'enabled'),
    ]);
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
