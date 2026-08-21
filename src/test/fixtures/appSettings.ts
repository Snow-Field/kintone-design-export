import type { AppSettings } from '@/types';

/**
 * kintone REST API のレスポンス構造に沿ったテスト用データ。
 *
 * AppSettings は REST API Client の戻り値型から導出されており、
 * 全プロパティを手で満たすと本質でない記述が大半を占めるため、
 * 構造を API のレスポンスに合わせたうえでここで一度だけキャストする。
 * テスト本体ではキャストを行わない。
 */
function asAppSettings(value: unknown): AppSettings {
  return value as AppSettings;
}

/** 各シートが反応する要素を一通り含んだ、標準的なアプリ設定 */
export function createMockAppSettings(): AppSettings {
  return asAppSettings({
    app: {
      appId: '123',
      code: 'SAMPLE',
      name: 'サンプル案件管理',
      description: '案件の進捗を管理するアプリ',
      spaceId: null,
      threadId: null,
      createdAt: '2026-01-01T00:00:00Z',
      creator: { code: 'user1', name: '作成者' },
      modifiedAt: '2026-02-01T00:00:00Z',
      modifier: { code: 'user1', name: '作成者' },
      revision: '10',
    },
    fields: {
      revision: '10',
      properties: {
        案件名: {
          type: 'SINGLE_LINE_TEXT',
          code: '案件名',
          label: '案件名',
          noLabel: false,
          required: true,
          unique: true,
          maxLength: '100',
          minLength: '1',
          defaultValue: '',
          expression: '',
          hideExpression: false,
        },
        金額: {
          type: 'NUMBER',
          code: '金額',
          label: '金額',
          noLabel: false,
          required: false,
          unique: false,
          maxValue: '1000000',
          minValue: '0',
          defaultValue: '0',
          digit: true,
          unit: '円',
          unitPosition: 'AFTER',
          displayScale: '0',
        },
        税込金額: {
          type: 'CALC',
          code: '税込金額',
          label: '税込金額',
          noLabel: false,
          required: false,
          expression: '金額 * 1.1',
          hideExpression: false,
          format: 'NUMBER',
          displayScale: '0',
          unit: '円',
          unitPosition: 'AFTER',
        },
        ステータス種別: {
          type: 'RADIO_BUTTON',
          code: 'ステータス種別',
          label: 'ステータス種別',
          noLabel: false,
          required: true,
          defaultValue: '進行中',
          align: 'HORIZONTAL',
          // index は登録順と一致させず、ソートされることを検証する
          options: {
            完了: { label: '完了', index: '2' },
            進行中: { label: '進行中', index: '0' },
            保留: { label: '保留', index: '1' },
          },
        },
        担当者: {
          type: 'USER_SELECT',
          code: '担当者',
          label: '担当者',
          noLabel: false,
          required: false,
          entities: [
            { code: 'sales', type: 'GROUP' },
            { code: 'user1', type: 'USER' },
          ],
          defaultValue: [{ code: 'user1', type: 'USER' }],
        },
        顧客名: {
          type: 'SINGLE_LINE_TEXT',
          code: '顧客名',
          label: '顧客名',
          noLabel: false,
          required: false,
          lookup: {
            relatedApp: { app: '200', code: 'CUSTOMER' },
            relatedKeyField: '顧客コード',
            fieldMappings: [
              { field: '顧客住所', relatedField: '住所' },
              { field: '顧客電話番号', relatedField: '電話番号' },
            ],
            lookupPickerFields: ['顧客コード', '顧客名'],
            filterCond: '状態 in ("有効")',
            sort: '顧客コード asc',
          },
        },
        関連案件: {
          type: 'REFERENCE_TABLE',
          code: '関連案件',
          label: '関連案件',
          noLabel: false,
          referenceTable: {
            relatedApp: { app: '300', code: 'DEAL' },
            condition: { field: '顧客名', relatedField: '顧客名' },
            displayFields: ['案件名', '金額'],
            filterCond: '状態 not in ("削除")',
            sort: 'レコード番号 desc',
            size: '5',
          },
        },
        備考: {
          type: 'MULTI_LINE_TEXT',
          code: '備考',
          label: '備考',
          noLabel: true,
          required: false,
          defaultValue: '',
        },
        // グループ内に配置されるフィールド
        社内メモ: {
          type: 'MULTI_LINE_TEXT',
          code: '社内メモ',
          label: '社内メモ',
          noLabel: false,
          required: false,
          defaultValue: '',
        },
        // サブテーブル。kintone は明細内フィールドを properties 直下ではなく
        // サブテーブルの fields 配下に入れる
        明細: {
          type: 'SUBTABLE',
          code: '明細',
          label: '明細',
          noLabel: false,
          fields: {
            商品名: {
              type: 'SINGLE_LINE_TEXT',
              code: '商品名',
              label: '商品名',
              noLabel: false,
              required: true,
              defaultValue: '',
            },
            数量: {
              type: 'NUMBER',
              code: '数量',
              label: '数量',
              noLabel: false,
              required: false,
              defaultValue: '1',
              digit: false,
            },
          },
        },
      },
    },
    layout: {
      revision: '10',
      layout: [
        {
          type: 'ROW',
          fields: [
            {
              type: 'SINGLE_LINE_TEXT',
              code: '案件名',
              size: { width: '200' },
            },
            { type: 'NUMBER', code: '金額', size: { width: '150' } },
          ],
        },
        {
          type: 'ROW',
          fields: [
            { type: 'CALC', code: '税込金額', size: { width: '150' } },
            { type: 'RADIO_BUTTON', code: 'ステータス種別' },
          ],
        },
        {
          type: 'ROW',
          fields: [
            { type: 'USER_SELECT', code: '担当者' },
            { type: 'SINGLE_LINE_TEXT', code: '顧客名' },
          ],
        },
        {
          type: 'ROW',
          fields: [
            { type: 'LABEL', label: '補足情報', size: { width: '200' } },
            { type: 'SPACER', elementId: 'spacer1', size: { width: '50' } },
            { type: 'HR', size: { width: '100' } },
          ],
        },
        {
          type: 'ROW',
          fields: [
            { type: 'REFERENCE_TABLE', code: '関連案件' },
            { type: 'MULTI_LINE_TEXT', code: '備考' },
          ],
        },
        {
          type: 'GROUP',
          code: '社内情報',
          layout: [
            {
              type: 'ROW',
              fields: [{ type: 'MULTI_LINE_TEXT', code: '社内メモ' }],
            },
          ],
        },
        {
          type: 'SUBTABLE',
          code: '明細',
          fields: [
            { type: 'SINGLE_LINE_TEXT', code: '商品名' },
            { type: 'NUMBER', code: '数量' },
          ],
        },
      ],
    },
    actions: {
      revision: '10',
      actions: {
        請求書作成: {
          name: '請求書作成',
          id: '1001',
          index: '0',
          destApp: { app: '400', code: 'INVOICE' },
          mappings: [
            { srcType: 'FIELD', srcField: '案件名', destField: '案件名' },
            { srcType: 'RECORD_URL', srcField: '', destField: '参照元' },
          ],
          entities: [
            { code: 'sales', type: 'GROUP' },
            { code: 'user1', type: 'USER' },
          ],
          filterCond: 'ステータス種別 in ("完了")',
        },
      },
    },
    views: {
      revision: '10',
      // index の昇順に並べ替えられることを検証するため、あえて逆順で定義する
      views: {
        カレンダー: {
          type: 'CALENDAR',
          name: 'カレンダー',
          id: '20',
          index: '1',
          date: '作成日時',
          title: '案件名',
          filterCond: '',
          sort: 'レコード番号 desc',
        },
        一覧: {
          type: 'LIST',
          name: '一覧',
          id: '10',
          index: '0',
          fields: ['案件名', '金額', 'ステータス種別'],
          filterCond: 'ステータス種別 not in ("保留")',
          sort: 'レコード番号 desc',
        },
      },
    },
    appAcl: {
      revision: '10',
      rights: [
        {
          entity: { code: 'Administrators', type: 'GROUP' },
          includeSubs: false,
          appEditable: true,
          recordViewable: true,
          recordAddable: true,
          recordEditable: true,
          recordDeletable: true,
          recordImportable: true,
          recordExportable: true,
        },
        {
          entity: { code: 'everyone', type: 'GROUP' },
          includeSubs: true,
          appEditable: false,
          recordViewable: true,
          recordAddable: true,
          recordEditable: true,
          recordDeletable: false,
          recordImportable: false,
          recordExportable: false,
        },
      ],
    },
    recordAcl: {
      revision: '10',
      rights: [
        {
          filterCond: 'ステータス種別 in ("完了")',
          entities: [
            {
              entity: { code: 'sales', type: 'GROUP' },
              viewable: true,
              editable: false,
              deletable: false,
              includeSubs: true,
            },
          ],
        },
      ],
    },
    fieldAcl: {
      revision: '10',
      rights: [
        {
          code: '金額',
          entities: [
            {
              entity: { code: 'sales', type: 'GROUP' },
              accessibility: 'WRITE',
              includeSubs: false,
            },
            {
              entity: { code: 'everyone', type: 'GROUP' },
              accessibility: 'READ',
              includeSubs: true,
            },
            {
              entity: { code: 'temp', type: 'GROUP' },
              accessibility: 'NONE',
              includeSubs: false,
            },
          ],
        },
      ],
    },
    status: {
      enable: true,
      states: {
        未対応: {
          name: '未対応',
          index: '0',
          assignee: {
            type: 'ONE',
            entities: [
              {
                entity: { type: 'GROUP', code: 'sales' },
                includeSubs: true,
              },
              {
                entity: { type: 'USER', code: 'user1' },
                includeSubs: false,
              },
            ],
          },
        },
        完了: {
          name: '完了',
          index: '1',
          assignee: { type: 'ALL', entities: [] },
        },
      },
      actions: [
        {
          name: '対応する',
          from: '未対応',
          to: '完了',
          filterCond: '金額 > "0"',
        },
      ],
    },
  });
}

/** プロセス管理・アクション・アクセス権が未設定の最小構成 */
export function createMinimalAppSettings(): AppSettings {
  return asAppSettings({
    app: {
      appId: '999',
      code: '',
      name: '最小アプリ',
      description: '',
    },
    fields: { revision: '1', properties: {} },
    layout: { revision: '1', layout: [] },
    actions: { revision: '1', actions: {} },
    views: { revision: '1', views: {} },
    appAcl: { revision: '1', rights: [] },
    recordAcl: { revision: '1', rights: [] },
    fieldAcl: { revision: '1', rights: [] },
    status: { enable: false },
  });
}
