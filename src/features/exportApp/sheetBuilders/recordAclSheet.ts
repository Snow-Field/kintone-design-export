import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '対象レコード', header: 'No.' },
  { group: '対象レコード', header: '絞り込み条件' },
  { group: '対象', header: 'コード' },
  { group: '対象', header: '種類' },
  { group: '対象', header: '下位組織にも適用' },
  { group: '権限', header: '閲覧' },
  { group: '権限', header: '編集' },
  { group: '権限', header: '削除' },
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
