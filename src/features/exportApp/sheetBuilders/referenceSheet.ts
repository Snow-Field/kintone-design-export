import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { getFieldProp } from '@/utils/field';

type ReferenceTable = {
  relatedApp: { app: string; code: string };
  condition: { field: string; relatedField: string };
  displayFields: string[];
  filterCond: string;
  sort: string;
};

const COLUMNS: ColumnDef[] = [
  { group: '関連レコード', header: 'フィールドコード', width: 26 },
  { group: '関連レコード', header: '参照先アプリID', width: 16 },
  { group: '関連レコード', header: '参照先アプリコード', width: 22 },
  { group: '表示するレコードの条件', header: 'フィールド', width: 24 },
  { group: '表示するレコードの条件', header: '参照先のフィールド', width: 26 },
  { group: '表示するフィールド', header: 'フィールド', width: 26 },
  { group: '絞り込みとソート', header: '絞り込み', width: 40 },
  { group: '絞り込みとソート', header: 'ソート', width: 24 },
];

export function buildReferenceSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  Object.values(data.fields.properties).forEach((f) => {
    const reference = getFieldProp(f, 'referenceTable') as
      ReferenceTable | undefined;
    if (!reference) return;

    const displayFields =
      reference.displayFields.length > 0 ? reference.displayFields : [''];

    displayFields.forEach((displayField) => {
      rows.push([
        f.code,
        reference.relatedApp.app,
        reference.relatedApp.code,
        reference.condition.field,
        reference.condition.relatedField,
        displayField,
        reference.filterCond,
        reference.sort,
      ]);
    });
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
