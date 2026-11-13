import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { joinValues, NOT_APPLICABLE } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '一覧', header: '一覧名' },
  { group: '一覧', header: '一覧ID' },
  { group: '一覧', header: 'No.' },
  { group: '一覧', header: 'タイプ' },
  { group: '表示', header: '表示するフィールド' },
  { group: '絞り込みとソート', header: '絞り込み' },
  { group: '絞り込みとソート', header: 'ソート' },
];

export function buildViewSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = Object.values(data.views.views)
    .toSorted((a, b) => Number(a.index) - Number(b.index))
    .map((view) => [
      view.name,
      view.id,
      view.index,
      view.type,
      // 一覧形式以外は表示フィールドを持たない
      'fields' in view ? joinValues(view.fields ?? []) : NOT_APPLICABLE,
      view.filterCond,
      view.sort,
    ]);

  return { blocks: [{ columns: COLUMNS, rows }] };
}
