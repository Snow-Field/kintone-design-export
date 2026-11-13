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
  { group: '関連レコード', header: 'フィールドコード' },
  { group: '関連レコード', header: '参照先アプリID' },
  { group: '関連レコード', header: '参照先アプリコード' },
  { group: '表示するレコードの条件', header: 'フィールド' },
  { group: '表示するレコードの条件', header: '参照先のフィールド' },
  { group: '表示するフィールド', header: 'フィールド' },
  { group: '絞り込みとソート', header: '絞り込み' },
  { group: '絞り込みとソート', header: 'ソート' },
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
