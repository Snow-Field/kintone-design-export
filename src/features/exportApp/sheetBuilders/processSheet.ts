import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const STATUS_COLUMNS: ColumnDef[] = [
  { group: 'ステータス', header: 'No.', width: 6 },
  { group: 'ステータス', header: 'ステータス名', width: 26 },
  { group: '作業者', header: '指定方法', width: 12 },
  { group: '作業者', header: 'コード', width: 24 },
  { group: '作業者', header: '種類', width: 16 },
  { group: '作業者', header: '下位組織にも適用', width: 15 },
];

const ACTION_COLUMNS: ColumnDef[] = [
  { group: 'アクション', header: 'アクション名', width: 26 },
  { group: 'ステータスの遷移', header: '実行前', width: 22 },
  { group: 'ステータスの遷移', header: '実行後', width: 22 },
  { group: '実行できる条件', header: '条件', width: 44 },
];

export function buildProcessSheet(data: AppSettings): SheetResult {
  const statusRows: ExcelData = [];

  Object.values(data.status.states ?? {})
    .sort((a, b) => Number(a.index) - Number(b.index))
    .forEach((state, index) => {
      const entities = state.assignee?.entities ?? [];
      if (entities.length === 0) {
        statusRows.push([
          index + 1,
          state.name,
          state.assignee?.type ?? '',
          '',
          '',
          '',
        ]);
        return;
      }
      entities.forEach((entity) => {
        statusRows.push([
          index + 1,
          state.name,
          state.assignee?.type ?? '',
          entity.entity.code,
          entity.entity.type,
          checkMark(entity.includeSubs),
        ]);
      });
    });

  const actionRows: ExcelData = (data.status.actions ?? []).map((action) => [
    action.name,
    action.from,
    action.to,
    action.filterCond,
  ]);

  return {
    blocks: [
      {
        title: 'ステータスと作業者',
        columns: STATUS_COLUMNS,
        rows: statusRows,
      },
      { title: 'アクション', columns: ACTION_COLUMNS, rows: actionRows },
    ],
  };
}
