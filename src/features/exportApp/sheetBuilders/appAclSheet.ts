import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '対象', header: 'コード', width: 24 },
  { group: '対象', header: '種類', width: 16 },
  { group: '対象', header: '下位組織にも適用', width: 15 },
  { group: 'レコード', header: '閲覧', width: 7 },
  { group: 'レコード', header: '追加', width: 7 },
  { group: 'レコード', header: '編集', width: 7 },
  { group: 'レコード', header: '削除', width: 7 },
  { group: 'レコード', header: '読込', width: 7 },
  { group: 'レコード', header: '書出', width: 7 },
  { group: 'アプリ', header: '管理', width: 7 },
];

export function buildAppAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = data.appAcl.rights.map((right) => [
    right.entity.code ?? '',
    right.entity.type,
    checkMark(right.includeSubs),
    checkMark(right.recordViewable),
    checkMark(right.recordAddable),
    checkMark(right.recordEditable),
    checkMark(right.recordDeletable),
    checkMark(right.recordImportable),
    checkMark(right.recordExportable),
    checkMark(right.appEditable),
  ]);

  return { blocks: [{ columns: COLUMNS, rows }] };
}
