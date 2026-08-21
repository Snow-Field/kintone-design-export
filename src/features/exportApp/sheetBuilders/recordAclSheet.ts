import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '対象レコード', header: 'No.', width: 6 },
  { group: '対象レコード', header: '絞り込み条件', width: 44 },
  { group: '対象', header: 'コード', width: 24 },
  { group: '対象', header: '種類', width: 16 },
  { group: '対象', header: '下位組織にも適用', width: 15 },
  { group: '権限', header: '閲覧', width: 7 },
  { group: '権限', header: '編集', width: 7 },
  { group: '権限', header: '削除', width: 7 },
];

export function buildRecordAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  data.recordAcl.rights.forEach((right, index) => {
    right.entities.forEach((entity) => {
      rows.push([
        index + 1,
        right.filterCond,
        entity.entity.code,
        entity.entity.type,
        checkMark(entity.includeSubs),
        checkMark(entity.viewable),
        checkMark(entity.editable),
        checkMark(entity.deletable),
      ]);
    });
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
