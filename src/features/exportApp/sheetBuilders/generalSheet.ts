import type { SheetResult, AppSettings } from '@/types';

export function buildGeneralSheet(data: AppSettings): SheetResult {
  return {
    blocks: [
      {
        columns: [{ header: '項目' }, { header: '値' }],
        rows: [
          ['ドメイン', location.hostname],
          ['アプリ名', data.app.name],
          ['アプリID', data.app.appId],
          ['アプリの説明', data.app.description],
        ],
      },
    ],
  };
}
