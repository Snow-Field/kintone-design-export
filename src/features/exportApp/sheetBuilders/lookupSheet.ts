import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { getFieldProp } from '@/utils/field';
import { formatMapping, joinValues } from '@/utils/format';

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
  { group: 'ほかのフィールドのコピー', header: 'コピー元 → コピー先' },
  { group: 'ルックアップ選択時', header: '表示するフィールド' },
  { group: '取得条件', header: '絞り込み' },
  { group: '取得条件', header: 'ソート' },
];

export function buildLookupSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  Object.values(data.fields.properties).forEach((f) => {
    const lookup = getFieldProp(f, 'lookup') as Lookup | undefined;
    if (!lookup) return;

    rows.push([
      f.code,
      lookup.relatedApp.app,
      lookup.relatedApp.code,
      lookup.relatedKeyField,
      joinValues(
        lookup.fieldMappings.map((m) => formatMapping(m.relatedField, m.field)),
      ),
      joinValues(lookup.lookupPickerFields),
      lookup.filterCond,
      lookup.sort,
    ]);
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
