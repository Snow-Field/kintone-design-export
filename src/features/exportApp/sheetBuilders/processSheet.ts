import type {
  ColumnDef,
  ExcelData,
  SheetResult,
  AppSettings,
  StatusEntity,
} from '@/types';
import { formatEntity, joinValues, NOT_APPLICABLE } from '@/utils/format';

const STATUS_COLUMNS: ColumnDef[] = [
  { group: 'ステータス', header: 'No.' },
  { group: 'ステータス', header: 'ステータス名' },
  { group: '作業者', header: '指定方法' },
  { group: '作業者', header: '作業者' },
];

const ACTION_COLUMNS: ColumnDef[] = [
  { group: 'アクション', header: '実行前' },
  { group: 'アクション', header: 'アクション名' },
  { group: 'アクション', header: '実行後' },
  { group: 'アクション', header: '種類' },
  { group: '実行できる条件', header: '実行できるユーザー' },
  { group: '実行できる条件', header: '条件' },
];

function formatEntities(entities: StatusEntity[]): string {
  return joinValues(entities.map((e) => formatEntity(e.entity, e.includeSubs)));
}

export function buildProcessSheet(data: AppSettings): SheetResult {
  const states = Object.values(data.status.states ?? {}).toSorted(
    (a, b) => Number(a.index) - Number(b.index),
  );

  const statusRows: ExcelData = states.map((state, index) => [
    index + 1,
    state.name,
    state.assignee?.type ?? '',
    formatEntities(state.assignee?.entities ?? []),
  ]);

  // 同じステータスから出るアクションが連続するよう、実行前ステータスの順に並べる。
  // toSorted は安定ソートのため、同じステータス内では kintone の設定順が保たれる
  const order = new Map(states.map((state, index) => [state.name, index]));
  const position = (name: string) => order.get(name) ?? states.length;

  const actionRows: ExcelData = (data.status.actions ?? [])
    .toSorted((a, b) => position(a.from) - position(b.from))
    .map((action) => [
      action.from,
      action.name,
      action.to,
      action.type,
      action.type === 'SECONDARY'
        ? formatEntities(action.executableUser?.entities ?? [])
        : NOT_APPLICABLE,
      action.filterCond,
    ]);

  // 左がステータスと作業者、右がアクション。表題は持たないため、
  // 上段の見出しでどちらの表かが分かるようにしている
  return {
    blocks: [
      { columns: STATUS_COLUMNS, rows: statusRows },
      { columns: ACTION_COLUMNS, rows: actionRows },
    ],
  };
}
