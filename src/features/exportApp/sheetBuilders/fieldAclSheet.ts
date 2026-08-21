import type { ColumnDef, ExcelData, SheetResult, AppSettings } from '@/types';
import { checkMark } from '@/utils/format';

const COLUMNS: ColumnDef[] = [
  { group: '対象フィールド', header: 'フィールドコード', width: 26 },
  { group: '対象', header: 'コード', width: 24 },
  { group: '対象', header: '種類', width: 16 },
  { group: '対象', header: '下位組織にも適用', width: 15 },
  { group: '権限', header: '閲覧', width: 7 },
  { group: '権限', header: '編集', width: 7 },
];

export function buildFieldAclSheet(data: AppSettings): SheetResult {
  const rows: ExcelData = [];

  data.fieldAcl.rights.forEach((right) => {
    right.entities.forEach((entity) => {
      rows.push([
        right.code,
        entity.entity.code,
        entity.entity.type,
        checkMark(entity.includeSubs),
        checkMark(entity.accessibility !== 'NONE'),
        checkMark(entity.accessibility === 'WRITE'),
      ]);
    });
  });

  return { blocks: [{ columns: COLUMNS, rows }] };
}
