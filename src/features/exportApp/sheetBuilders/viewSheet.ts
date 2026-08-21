import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';

const COLUMNS: ColumnDef[] = [
  { group: '一覧', header: '一覧名' },
  { group: '一覧', header: '一覧ID' },
  { group: '一覧', header: 'No.' },
  { group: '一覧', header: 'タイプ' },
  { group: '表示するフィールド', header: 'フィールド' },
  { group: '絞り込みとソート', header: '絞り込み' },
  { group: '絞り込みとソート', header: 'ソート' },
];

export function buildViewSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  Object.values(data.views.views)
    .sort((a, b) => Number(a.index) - Number(b.index))
    .forEach((view) => {
      // 一覧形式以外は表示フィールドを持たない
      const fields = 'fields' in view ? (view.fields ?? []) : [];
      const displayFields = fields.length > 0 ? fields : [''];

      displayFields.forEach((field) => {
        rows.push([
          view.name,
          view.id,
          view.index,
          view.type,
          field,
          view.filterCond,
          view.sort,
        ]);
      });
    });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
