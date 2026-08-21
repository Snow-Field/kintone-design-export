import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createMinimalAppSettings,
  createMockAppSettings,
} from '@/test/fixtures/appSettings';
import { SHEET_NAMES } from '@/utils/excel';
import type { AppSettings, SheetBlock, SheetResult } from '@/types';
import {
  buildGeneralSheet,
  buildFieldSheet,
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
  [SHEET_NAMES.ACTION, buildActionSheet],
  [SHEET_NAMES.LOOKUP, buildLookupSheet],
  [SHEET_NAMES.REFERENCE, buildReferenceSheet],
  [SHEET_NAMES.VIEW, buildViewSheet],
  [SHEET_NAMES.APP_ACL, buildAppAclSheet],
  [SHEET_NAMES.RECORD_ACL, buildRecordAclSheet],
  [SHEET_NAMES.FIELD_ACL, buildFieldAclSheet],
  [SHEET_NAMES.PROCESS, buildProcessSheet],
];

/** 先頭の表。ほとんどのシートは表を1つだけ持つ */
function firstBlock(result: SheetResult): SheetBlock {
  const block = result.blocks[0];
  if (!block) throw new Error('表が1つも無い');
  return block;
}

/** 指定した見出しの列に入っている値を取り出す */
function column(block: SheetBlock, header: string): unknown[] {
  const index = block.columns.findIndex((c) => c.header === header);
  if (index < 0) throw new Error(`列が見つからない: ${header}`);
  return block.rows.map((row) => row[index]);
}

describe.each(builders)('%s シート', (_name, build) => {
  it('標準構成の出力が変化しない', () => {
    expect(build(createMockAppSettings())).toMatchSnapshot();
  });

  it('最小構成でも例外を投げない', () => {
    expect(() => build(createMinimalAppSettings())).not.toThrow();
  });

  it('少なくとも1つの表を持つ', () => {
    expect(build(createMockAppSettings()).blocks.length).toBeGreaterThan(0);
  });

  it('各列に見出しが定義されている', () => {
    for (const block of build(createMockAppSettings()).blocks) {
      expect(block.columns.length).toBeGreaterThan(0);
      for (const col of block.columns) {
        expect(col.header).not.toBe('');
      }
    }
  });

  it('行の要素数が列数を超えない', () => {
    for (const block of build(createMockAppSettings()).blocks) {
      for (const row of block.rows) {
        expect(row.length).toBeLessThanOrEqual(block.columns.length);
      }
    }
  });
});

describe('buildGeneralSheet', () => {
  it('ドメインに location.hostname を出力する', () => {
    const block = firstBlock(buildGeneralSheet(createMockAppSettings()));
    expect(block.rows).toContainEqual(['ドメイン', 'example.cybozu.com']);
  });
});

describe('buildFieldSheet', () => {
  const block = () => firstBlock(buildFieldSheet(createMockAppSettings()));
  const rowOf = (code: string) =>
    block().rows.find((row) => row[1] === code) ?? [];
  const valueOf = (code: string, header: string) => {
    const b = block();
    const index = b.columns.findIndex((c) => c.header === header);
    return rowOf(code)[index];
  };

  it('選択肢を index の昇順でカンマ区切りにする', () => {
    expect(valueOf('ステータス種別', '選択肢')).toBe('進行中,保留,完了');
  });

  it('選択肢の並びを API の値のまま出力する', () => {
    expect(valueOf('ステータス種別', '選択肢の並び')).toBe('HORIZONTAL');
  });

  it('フィールド型を API の値のまま出力する', () => {
    expect(valueOf('案件名', 'タイプ')).toBe('SINGLE_LINE_TEXT');
  });

  it('必須と重複禁止を日本語表記にする', () => {
    expect(valueOf('案件名', '必須')).toBe('必須');
    expect(valueOf('案件名', '重複禁止')).toBe('禁止');
  });

  it('計算式を専用の列に出力する', () => {
    expect(valueOf('税込金額', '計算式')).toBe('金額 * 1.1');
    expect(valueOf('案件名', '計算式')).toBe('');
  });

  it('単位と単位の位置を分けて出力する', () => {
    expect(valueOf('金額', '単位')).toBe('円');
    expect(valueOf('金額', '単位の位置')).toBe('AFTER');
  });

  it('真偽値の属性をチェック記号で表す', () => {
    expect(valueOf('金額', '桁区切り')).toBe('■');
    expect(valueOf('数量', '桁区切り')).toBe('□');
    expect(valueOf('備考', 'ラベル表示')).toBe('□');
    expect(valueOf('案件名', 'ラベル表示')).toBe('■');
  });

  it('未設定の真偽値は空欄にする', () => {
    expect(valueOf('案件名', '桁区切り')).toBe('');
  });

  it('対象ユーザーをカンマ区切りにする', () => {
    expect(valueOf('担当者', '対象ユーザー')).toBe('sales,user1');
  });

  it('配列のデフォルト値をコードの連結にする', () => {
    expect(valueOf('担当者', 'デフォルト値')).toBe('user1');
  });

  it('サブテーブル内のフィールドをテーブル名付きで出力する', () => {
    expect(valueOf('商品名', 'テーブル')).toBe('明細');
    expect(valueOf('数量', 'タイプ')).toBe('NUMBER');
  });

  it('グループ内フィールドにグループ名を付ける', () => {
    expect(valueOf('社内メモ', 'グループ')).toBe('社内情報');
  });

  it('GROUP と SUBTABLE の見出し行を出力する', () => {
    expect(valueOf('社内情報', 'タイプ')).toBe('GROUP');
    expect(valueOf('明細', 'タイプ')).toBe('SUBTABLE');
  });

  it('LABEL・SPACER・HR を種別付きで出力する', () => {
    const types = column(block(), 'タイプ');
    expect(types).toContain('LABEL');
    expect(types).toContain('SPACER');
    expect(types).toContain('HR');
  });
});

describe('buildLookupSheet', () => {
  const block = () => firstBlock(buildLookupSheet(createMockAppSettings()));

  it('コピー元とコピー先を別々の列に展開する', () => {
    const rows = block().rows.filter(
      (row) => row[4] === 'ほかのフィールドのコピー',
    );
    expect(rows.map((row) => [row[5], row[6]])).toEqual([
      ['顧客住所', '住所'],
      ['顧客電話番号', '電話番号'],
    ]);
  });

  it('表示フィールドを1件ずつ行に展開する', () => {
    const rows = block().rows.filter((row) => row[4] === '表示フィールド');
    expect(rows.map((row) => row[6])).toEqual(['顧客コード', '顧客名']);
  });

  it('どの行にもルックアップ元の情報が入る', () => {
    for (const value of column(block(), 'コピー元アプリコード')) {
      expect(value).toBe('CUSTOMER');
    }
  });
});

describe('buildReferenceSheet', () => {
  it('表示フィールドを1件ずつ行に展開する', () => {
    const block = firstBlock(buildReferenceSheet(createMockAppSettings()));
    expect(block.rows.map((row) => row[5])).toEqual(['案件名', '金額']);
  });
});

describe('buildViewSheet', () => {
  const block = () => firstBlock(buildViewSheet(createMockAppSettings()));

  it('一覧を index の昇順で並べる', () => {
    expect([...new Set(column(block(), '一覧名'))]).toEqual([
      '一覧',
      'カレンダー',
    ]);
  });

  it('表示フィールドを1件ずつ行に展開する', () => {
    const rows = block().rows.filter((row) => row[0] === '一覧');
    expect(rows.map((row) => row[4])).toEqual([
      '案件名',
      '金額',
      'ステータス種別',
    ]);
  });

  it('表示フィールドを持たない一覧種別でも1行は出力する', () => {
    const rows = block().rows.filter((row) => row[0] === 'カレンダー');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[4]).toBe('');
  });
});

describe('buildActionSheet', () => {
  const block = () => firstBlock(buildActionSheet(createMockAppSettings()));

  it('関連付けと利用者を行数の多い方に合わせて展開する', () => {
    expect(block().rows).toHaveLength(2);
  });

  it('関連付けの種別とコピー元・コピー先を列に分ける', () => {
    expect(block().rows.map((row) => [row[5], row[6], row[7]])).toEqual([
      ['FIELD', '案件名', '案件名'],
      ['RECORD_URL', '', '参照元'],
    ]);
  });

  it('利用者のコードと種類を列に分ける', () => {
    expect(block().rows.map((row) => [row[8], row[9]])).toEqual([
      ['sales', 'GROUP'],
      ['user1', 'USER'],
    ]);
  });
});

describe('buildAppAclSheet', () => {
  it('権限の有無をチェック記号で表す', () => {
    const block = firstBlock(buildAppAclSheet(createMockAppSettings()));
    const row = block.rows.find((r) => r[0] === 'everyone');
    expect(row?.slice(2)).toEqual(['■', '■', '■', '■', '□', '□', '□', '□']);
  });
});

describe('buildFieldAclSheet', () => {
  it('accessibility を閲覧と編集の可否に展開する', () => {
    const block = firstBlock(buildFieldAclSheet(createMockAppSettings()));
    const byCode = (code: string) => block.rows.find((row) => row[1] === code);
    expect(byCode('sales')?.slice(4)).toEqual(['■', '■']); // WRITE
    expect(byCode('everyone')?.slice(4)).toEqual(['■', '□']); // READ
    expect(byCode('temp')?.slice(4)).toEqual(['□', '□']); // NONE
  });
});

describe('buildRecordAclSheet', () => {
  it('条件ごとに通し番号を振る', () => {
    const block = firstBlock(buildRecordAclSheet(createMockAppSettings()));
    expect(column(block, 'No.')).toEqual([1]);
  });
});

describe('buildProcessSheet', () => {
  const result = () => buildProcessSheet(createMockAppSettings());

  it('ステータスとアクションを別々の表にする', () => {
    const { blocks } = result();
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.title)).toEqual([
      'ステータスと作業者',
      'アクション',
    ]);
  });

  it('作業者を1件ずつ行に展開する', () => {
    const block = result().blocks[0]!;
    const rows = block.rows.filter((row) => row[1] === '未対応');
    expect(rows.map((row) => [row[3], row[4], row[5]])).toEqual([
      ['sales', 'GROUP', '■'],
      ['user1', 'USER', '□'],
    ]);
  });

  it('作業者がいないステータスも1行出力する', () => {
    const block = result().blocks[0]!;
    const rows = block.rows.filter((row) => row[1] === '完了');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[3]).toBe('');
  });

  it('プロセス管理が無効でも表の構成は保つ', () => {
    const { blocks } = buildProcessSheet(createMinimalAppSettings());
    expect(blocks).toHaveLength(2);
    expect(blocks.every((b) => b.rows.length === 0)).toBe(true);
  });
});
