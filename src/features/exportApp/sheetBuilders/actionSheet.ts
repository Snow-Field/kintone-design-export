import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';

const COLUMNS: ColumnDef[] = [
  { group: 'アクション', header: 'アクション名', width: 22 },
  { group: 'アクション', header: 'アクションID', width: 14 },
  { group: 'アクション', header: 'No.', width: 6 },
  { group: 'コピー先', header: 'アプリID', width: 12 },
  { group: 'コピー先', header: 'アプリコード', width: 20 },
  { group: 'フィールドの関連付け', header: '種別', width: 14 },
  { group: 'フィールドの関連付け', header: 'コピー元フィールド', width: 26 },
  { group: 'フィールドの関連付け', header: 'コピー先フィールド', width: 26 },
  { group: '実行できる条件', header: '利用者コード', width: 20 },
  { group: '実行できる条件', header: '利用者の種類', width: 16 },
  { group: '実行できる条件', header: '実行条件', width: 36 },
];

export function buildActionSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  Object.values(data.actions.actions).forEach((action) => {
    // 関連付けと利用者はどちらも複数あり得るため、行数の多い方に合わせて展開する
    const mappings = action.mappings.map((m) => ({
      kind: m.srcType,
      src: m.srcType === 'FIELD' ? m.srcField : '',
      dest: m.destField,
    }));
    const entities = action.entities.map((e) => ({
      code: e.code,
      type: e.type,
    }));
    const lines = Math.max(mappings.length, entities.length, 1);

    for (let i = 0; i < lines; i++) {
      const mapping = mappings[i];
      const entity = entities[i];
      rows.push([
        action.name,
        action.id,
        action.index,
        action.destApp.app,
        action.destApp.code,
        mapping?.kind ?? '',
        mapping?.src ?? '',
        mapping?.dest ?? '',
        entity?.code ?? '',
        entity?.type ?? '',
        action.filterCond,
      ]);
    }
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
