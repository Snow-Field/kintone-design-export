import type { SheetResult, AppSettings } from '@/types';

export function buildGeneralSheet(data: AppSettings): SheetResult {
  return {
    blocks: [
      {
        title: '一般情報',
        columns: [
          { header: '項目', width: 22 },
          { header: '値', width: 70 },
        ],
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
