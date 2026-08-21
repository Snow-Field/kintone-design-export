import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createMinimalAppSettings,
  createMockAppSettings,
} from '@/test/fixtures/appSettings';
import { SHEET_NAMES } from '@/utils/excel';
import type { AppSettings, SheetResult } from '@/types';
import {
  buildGeneralSheet,
  buildFieldSheet,
  buildCalcSheet,
  buildActionSheet,
  buildLookupSheet,
  buildReferenceSheet,
  buildViewSheet,
  buildAppAclSheet,
  buildRecordAclSheet,
  buildFieldAclSheet,
  buildProcessSheet,
} from './index';

// 一般情報シートが location.hostname を参照するため、node 環境向けに用意する
beforeAll(() => {
  vi.stubGlobal('location', {
    hostname: 'example.cybozu.com',
    origin: 'https://example.cybozu.com',
    pathname: '/k/123/',
  });
});

const builders: Array<[string, (data: AppSettings) => SheetResult]> = [
  [SHEET_NAMES.GENERAL, buildGeneralSheet],
  [SHEET_NAMES.FIELD, buildFieldSheet],
  [SHEET_NAMES.CALC, buildCalcSheet],
  [SHEET_NAMES.ACTION, buildActionSheet],
  [SHEET_NAMES.LOOKUP, buildLookupSheet],
  [SHEET_NAMES.REFERENCE, buildReferenceSheet],
  [SHEET_NAMES.VIEW, buildViewSheet],
  [SHEET_NAMES.APP_ACL, buildAppAclSheet],
  [SHEET_NAMES.RECORD_ACL, buildRecordAclSheet],
  [SHEET_NAMES.FIELD_ACL, buildFieldAclSheet],
  [SHEET_NAMES.PROCESS, buildProcessSheet],
];

describe.each(builders)('%s シート', (_name, build) => {
  it('標準構成の出力が変化しない', () => {
    expect(build(createMockAppSettings())).toMatchSnapshot();
  });

  it('最小構成でも例外を投げない', () => {
    expect(() => build(createMinimalAppSettings())).not.toThrow();
  });

  it('行データの先頭列は常に空である', () => {
    const { rows } = build(createMockAppSettings());
    for (const row of rows) {
      if (row.length > 0) expect(row[0]).toBe('');
    }
  });

  it('ヘッダー行の索引が実在する行を指している', () => {
    const { rows, headerIndex } = build(createMockAppSettings());
    for (const index of headerIndex) {
      expect(index).toBeLessThan(rows.length);
    }
  });
});

describe('buildGeneralSheet', () => {
  it('ドメインに location.hostname を出力する', () => {
    const { rows } = buildGeneralSheet(createMockAppSettings());
    expect(rows).toContainEqual(['', 'ドメイン', 'example.cybozu.com']);
  });
});

describe('buildFieldSheet', () => {
  it('選択肢を index の昇順で並べる', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    const row = rows.find((r) => r[1] === 'ステータス種別');
    expect(row?.at(-1)).toContain('options=[進行中,保留,完了]');
  });

  it('必須・重複禁止の設定を日本語表記に変換する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    const row = rows.find((r) => r[1] === '案件名');
    expect(row?.[8]).toBe('必須');
    expect(row?.[9]).toBe('禁止');
  });

  it('noLabel が true のフィールドを非表示と出力する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '備考')?.[7]).toBe('非表示');
  });

  it('配列のデフォルト値をコードの連結に変換する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '担当者')?.[14]).toBe('user1');
  });

  it('GROUP と SUBTABLE の見出し行を出力する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '社内情報')?.[3]).toBe('GROUP');
    expect(rows.find((r) => r[1] === '明細')?.[3]).toBe('SUBTABLE');
  });

  it('グループ内フィールドにグループ名を付与する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '社内メモ')?.[6]).toBe('社内情報');
  });

  it('LABEL・SPACER・HR を種別付きで出力する', () => {
    const { rows } = buildFieldSheet(createMockAppSettings());
    const types = rows.map((r) => r[3]);
    expect(types).toContain('LABEL');
    expect(types).toContain('SPACER');
    expect(types).toContain('HR');
  });

  it('現状の仕様: サブテーブル内のフィールドは行として出力されない', () => {
    // kintone の getFormFields は明細内フィールドを properties 直下ではなく
    // サブテーブルの fields 配下に返すため、コードで引いても解決できない。
    // 現状の挙動を固定するテストであり、望ましい仕様を表すものではない。
    const { rows } = buildFieldSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '商品名')).toBeUndefined();
    expect(rows.find((r) => r[1] === '数量')).toBeUndefined();
  });
});

describe('buildCalcSheet', () => {
  it('計算式を持つフィールドだけを抽出する', () => {
    const { rows } = buildCalcSheet(createMockAppSettings());
    const codes = rows.slice(2).map((r) => r[2]);
    expect(codes).toEqual(['税込金額']);
  });
});

describe('buildViewSheet', () => {
  it('一覧を index の昇順で並べる', () => {
    const { rows } = buildViewSheet(createMockAppSettings());
    expect(rows.slice(2).map((r) => r[1])).toEqual(['一覧', 'カレンダー']);
  });

  it('fields を持たない一覧種別では表示フィールドを空にする', () => {
    const { rows } = buildViewSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === 'カレンダー')?.[4]).toBe('');
  });
});

describe('buildLookupSheet', () => {
  it('ルックアップ設定を持つフィールドだけを抽出する', () => {
    const { rows } = buildLookupSheet(createMockAppSettings());
    expect(rows.slice(2).map((r) => r[1])).toEqual(['顧客名']);
  });

  it('フィールドマッピングを矢印表記で連結する', () => {
    const { rows } = buildLookupSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '顧客名')?.[5]).toBe(
      '顧客住所->住所,顧客電話番号->電話番号',
    );
  });
});

describe('buildReferenceSheet', () => {
  it('関連レコード設定を持つフィールドだけを抽出する', () => {
    const { rows } = buildReferenceSheet(createMockAppSettings());
    expect(rows.slice(2).map((r) => r[1])).toEqual(['関連案件']);
  });
});

describe('buildActionSheet', () => {
  it('FIELD 以外のマッピング種別は空文字として連結する', () => {
    const { rows } = buildActionSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '請求書作成')?.[6]).toBe(
      '案件名->案件名,',
    );
  });

  it('利用者を全角スラッシュ区切りで出力する', () => {
    const { rows } = buildActionSheet(createMockAppSettings());
    expect(rows.find((r) => r[1] === '請求書作成')?.[7]).toBe(
      'sales／GROUP\nuser1／USER',
    );
  });
});

describe('buildAppAclSheet', () => {
  it('権限の有無を ■ と □ で表す', () => {
    const { rows } = buildAppAclSheet(createMockAppSettings());
    const row = rows.find((r) => r[1] === 'everyone');
    expect(row?.slice(3)).toEqual(['■', '■', '■', '□', '□', '□', '□', '■']);
  });
});

describe('buildFieldAclSheet', () => {
  it('accessibility を閲覧・編集の可否に展開する', () => {
    const { rows } = buildFieldAclSheet(createMockAppSettings());
    const byCode = (code: string) => rows.find((r) => r[2] === code);
    expect(byCode('sales')?.slice(4, 6)).toEqual(['■', '■']); // WRITE
    expect(byCode('everyone')?.slice(4, 6)).toEqual(['■', '□']); // READ
    expect(byCode('temp')?.slice(4, 6)).toEqual(['□', '□']); // NONE
  });
});

describe('buildProcessSheet', () => {
  it('ステータスと作業者、アクションの見出しを返す', () => {
    const { rows, headerIndex } = buildProcessSheet(createMockAppSettings());
    expect(headerIndex).toHaveLength(3);
    expect(rows.find((r) => r[1] === '未対応')?.[2]).toBe('ONE');
    expect(rows.find((r) => r[2] === 'GROUP:sales')?.[3]).toBe('');
    expect(rows.find((r) => r[2] === 'USER:user1')?.[3]).toBe('継承しない');
  });

  it('プロセス管理が無効でも見出しだけを返す', () => {
    const { rows } = buildProcessSheet(createMinimalAppSettings());
    expect(rows.find((r) => r[1] === 'アクション')).toBeDefined();
  });
});
