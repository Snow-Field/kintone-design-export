import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { getFieldProp } from '@/utils/field';

type Lookup = {
  relatedApp: { app: string; code: string };
  relatedKeyField: string;
  fieldMappings: Array<{ field: string; relatedField: string }>;
  lookupPickerFields: string[];
  filterCond: string;
  sort: string;
};

const COLUMNS: ColumnDef[] = [
  { group: 'ルックアップ', header: 'フィールドコード' },
  { group: 'ルックアップ', header: 'コピー元アプリID' },
  { group: 'ルックアップ', header: 'コピー元アプリコード' },
  { group: 'ルックアップ', header: 'コピー元のフィールド' },
  { group: 'コピーする値', header: '種別' },
  { group: 'コピーする値', header: 'コピー先フィールド' },
  { group: 'コピーする値', header: 'コピー元フィールド' },
  { group: '取得条件', header: '絞り込み' },
  { group: '取得条件', header: 'ソート' },
];

export function buildLookupSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  Object.values(data.fields.properties).forEach((f) => {
    const lookup = getFieldProp(f, 'lookup') as Lookup | undefined;
    if (!lookup) return;

    // 1件も紐づけが無い場合でもルックアップの存在は示す
    const entries: Array<[string, string, string]> = [
      ...lookup.fieldMappings.map((m): [string, string, string] => [
        'ほかのフィールドのコピー',
        m.field,
        m.relatedField,
      ]),
      ...lookup.lookupPickerFields.map((field): [string, string, string] => [
        '表示フィールド',
        '',
        field,
      ]),
    ];
    if (entries.length === 0) entries.push(['', '', '']);

    entries.forEach(([kind, dest, src]) => {
      rows.push([
        f.code,
        lookup.relatedApp.app,
        lookup.relatedApp.code,
        lookup.relatedKeyField,
        kind,
        dest,
        src,
        lookup.filterCond,
        lookup.sort,
      ]);
    });
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
