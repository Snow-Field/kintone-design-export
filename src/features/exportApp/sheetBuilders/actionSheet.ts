import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { formatEntity, formatMapping, joinValues } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: 'アクション', header: 'アクション名' },
  { group: 'アクション', header: 'アクションID' },
  { group: 'アクション', header: 'No.' },
  { group: 'コピー先', header: 'アプリID' },
  { group: 'コピー先', header: 'アプリコード' },
  { group: 'フィールドの関連付け', header: 'コピー元 → コピー先' },
  { group: '実行できる条件', header: '利用者' },
  { group: '実行できる条件', header: '実行条件' },
];

export function buildActionSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = Object.values(data.actions.actions).map((action) => [
    action.name,
    action.id,
    action.index,
    action.destApp.app,
    action.destApp.code,
    joinValues(
      action.mappings.map((m) =>
        // レコード URL はコピー元のフィールドを持たないため種別を書く
        formatMapping(
          m.srcType === 'FIELD' ? m.srcField : m.srcType,
          m.destField,
        ),
      ),
    ),
    joinValues(action.entities.map((entity) => formatEntity(entity))),
    action.filterCond,
  ]);

  return { blocks: [{ columns: COLUMNS, rows }] };
}
