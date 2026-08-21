import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const STATUS_COLUMNS: ColumnDef[] = [
  { group: 'ステータス', header: 'No.' },
  { group: 'ステータス', header: 'ステータス名' },
  { group: '作業者', header: '指定方法' },
  { group: '作業者', header: 'コード' },
  { group: '作業者', header: '種類' },
  { group: '作業者', header: '下位組織にも適用' },
];

const ACTION_COLUMNS: ColumnDef[] = [
  { group: 'アクション', header: 'アクション名' },
  { group: 'ステータスの遷移', header: '実行前' },
  { group: 'ステータスの遷移', header: '実行後' },
  { group: '実行できる条件', header: '条件' },
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

  // 上がステータスと作業者、下がアクション。表題は持たないため、
  // 上段の見出しでどちらの表かが分かるようにしている
  return {
    blocks: [
      { columns: STATUS_COLUMNS, rows: statusRows },
      { columns: ACTION_COLUMNS, rows: actionRows },
    ],
  };
}
