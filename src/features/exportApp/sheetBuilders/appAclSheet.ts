import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '対象', header: 'コード' },
  { group: '対象', header: '種類' },
  { group: '対象', header: '下位組織にも適用' },
  { group: 'レコード', header: '閲覧' },
  { group: 'レコード', header: '追加' },
  { group: 'レコード', header: '編集' },
  { group: 'レコード', header: '削除' },
  { group: 'レコード', header: '読込' },
  { group: 'レコード', header: '書出' },
  { group: 'アプリ', header: '管理' },
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
