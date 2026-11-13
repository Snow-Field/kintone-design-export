/**
 * 生成した .xlsx を読み戻して、行データのスナップショットでは
 * 検出できない設定（見出しの固定・オートフィルタ・セル結合・配色・列幅）を確認する。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Workbook, type Worksheet } from 'exceljs';
import { addStyledSheet, createWorkbook, displayWidth } from './excel';
import { THEME } from './theme';
import type { SheetResult } from '@/types';

const TWO_TIER: SheetResult = {
  blocks: [
    {
      columns: [
        { group: '基本', header: 'コード' },
        { group: '基本', header: '名称' },
        { group: '権限', header: '閲覧' },
        { header: '備考' },
      ],
      rows: [
        ['A', 'あ', '■', ''],
        ['B', 'い', '□', 'メモ'],
        ['C', 'う', '■', ''],
      ],
    },
  ],
};

const SINGLE_TIER: SheetResult = {
  blocks: [
    {
      columns: [{ header: '項目' }, { header: '値' }],
      rows: [['ドメイン', 'example.cybozu.com']],
    },
  ],
};

const TWO_BLOCKS: SheetResult = {
  blocks: [
    {
      columns: [{ header: 'ステータス名' }, { header: '作業者' }],
      rows: [
        ['未対応', 'sales'],
        ['完了', ''],
      ],
    },
    {
      columns: [{ header: 'アクション名' }],
      rows: [['担当者を割り当てる']],
    },
  ],
};

async function render(name: string, result: SheetResult): Promise<Worksheet> {
  const wb = createWorkbook();
  addStyledSheet(wb, name, result);
  const buffer = await wb.xlsx.writeBuffer();
  const read = new Workbook();
  await read.xlsx.load(buffer as ArrayBuffer);
  const ws = read.getWorksheet(name);
  if (!ws) throw new Error('シートが見つからない');
  return ws;
}

describe('displayWidth', () => {
  it('半角を1、全角を2.2として数える', () => {
    expect(displayWidth('abc')).toBe(3);
    expect(displayWidth('あいう')).toBeCloseTo(6.6);
    expect(displayWidth('ab漢字')).toBeCloseTo(6.4);
  });

  it('太字はさらに広く見積もる', () => {
    expect(displayWidth('あいう', true)).toBeCloseTo(6.93);
    expect(displayWidth('abc', true)).toBeCloseTo(3.15);
  });

  it('セル内改行がある場合は最も長い行で測る', () => {
    expect(displayWidth('abc\nあいうえお')).toBeCloseTo(11);
  });

  it('値を持たない場合は 0 にする', () => {
    expect(displayWidth(null)).toBe(0);
    expect(displayWidth(undefined)).toBe(0);
    expect(displayWidth('')).toBe(0);
  });

  it('数値も文字数で数える', () => {
    expect(displayWidth(1234)).toBe(4);
  });
});

describe('addStyledSheet（2段見出し）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('two', TWO_TIER);
  });

  it('表を左上から始める', () => {
    expect(ws.getCell('A1').value).toBe('基本');
    expect(ws.getCell('A2').value).toBe('コード');
    expect(ws.getCell('A3').value).toBe('A');
  });

  it('上段に group、下段に header を書く', () => {
    expect(ws.getCell('C1').value).toBe('権限');
    expect(ws.getCell('C2').value).toBe('閲覧');
  });

  it('同じ group が続く列の上段を結合する', () => {
    expect(ws.getCell('A1').isMerged).toBe(true);
    expect(ws.getCell('B1').isMerged).toBe(true);
    // 単独の group は結合しない
    expect(ws.getCell('C1').isMerged).toBe(false);
  });

  it('group を持たない列の上段は空にする', () => {
    expect(ws.getCell('D1').value).toBeNull();
    expect(ws.getCell('D2').value).toBe('備考');
  });

  it('見出しの2行を固定する', () => {
    const view = ws.views[0];
    expect(view?.state).toBe('frozen');
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(2);
  });

  it('見出し行にオートフィルタを設定する', () => {
    // 読み戻すと範囲は文字列で表される。A2 が見出し、D5 が明細の末尾
    expect(ws.autoFilter).toBe('A2:D5');
  });

  it('見出しにテーマの配色を適用する', () => {
    expect(ws.getCell('A1').fill).toMatchObject({
      fgColor: { argb: THEME.color.groupHeaderBg },
    });
    const header = ws.getCell('A2');
    expect(header.fill).toMatchObject({
      fgColor: { argb: THEME.color.headerBg },
    });
    expect(header.font?.color?.argb).toBe(THEME.color.headerText);
    expect(header.font?.bold).toBe(true);
  });

  it('偶数行に背景色を敷く', () => {
    expect(ws.getCell('A3').fill).toMatchObject({ pattern: 'none' });
    expect(ws.getCell('A4').fill).toMatchObject({
      fgColor: { argb: THEME.color.stripeBg },
    });
  });

  it('折り返して全体を表示しない', () => {
    expect(ws.getCell('A2').alignment?.wrapText).toBeFalsy();
    expect(ws.getCell('D4').alignment?.wrapText).toBeFalsy();
  });

  it('列幅を内容の表示幅から決め、フィルタボタンぶんを見込む', () => {
    // 見出し「コード」= 3字 × 2.2 × 1.05 ≒ 6.93 にボタン3を足して 9.93、
    // 切り上げて 10、余白2を加えて 12
    expect(ws.getColumn(1).width).toBe(12);
    // 見出し「備考」= 2字 × 2.2 × 1.05 ≒ 4.62 にボタン3で 7.62、
    // 切り上げて 8、余白2で 10
    expect(ws.getColumn(4).width).toBe(10);
  });
});

describe('addStyledSheet（1段見出し）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('single', SINGLE_TIER);
  });

  it('表題を持たない表は見出しから始まる', () => {
    expect(ws.getCell('A1').value).toBe('項目');
    expect(ws.getCell('A2').value).toBe('ドメイン');
  });

  it('見出しの1行だけを固定する', () => {
    const view = ws.views[0];
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(1);
  });

  it('最も長い値に列幅を合わせる', () => {
    // example.cybozu.com = 18、余白2を足して 20
    expect(ws.getColumn(2).width).toBe(20);
  });
});

describe('addStyledSheet（表が2つ）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('blocks', TWO_BLOCKS);
  });

  it('表を1列だけ空けて横に並べる', () => {
    // 1つ目の表は A〜B 列
    expect(ws.getCell('A1').value).toBe('ステータス名');
    expect(ws.getCell('B1').value).toBe('作業者');
    expect(ws.getCell('A2').value).toBe('未対応');
    expect(ws.getCell('A3').value).toBe('完了');
    // C 列を空けて、2つ目の表は D 列から
    expect(ws.getCell('C1').value).toBeNull();
    expect(ws.getCell('D1').value).toBe('アクション名');
    expect(ws.getCell('D2').value).toBe('担当者を割り当てる');
  });

  it('表が複数あるシートにはオートフィルタを設定しない', () => {
    expect(ws.autoFilter).toBeUndefined();
  });

  it('どちらの表の見出しも固定する', () => {
    const view = ws.views[0];
    expect(view?.state).toBe('frozen');
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(1);
  });

  it('表ごとに列が分かれるため列幅が影響し合わない', () => {
    // 「ステータス名」= 6字 × 2.2 × 1.05 ≒ 13.86 → 切り上げ14 + 余白2 = 16
    expect(ws.getColumn(1).width).toBe(16);
    // 2つ目の表の長い値は1つ目の表の列幅に影響しない
    // 「担当者を割り当てる」= 9字 × 2.2 = 19.8 → 切り上げ20 + 余白2 = 22
    expect(ws.getColumn(4).width).toBe(22);
  });

  it('表と表の間の列を狭くする', () => {
    expect(ws.getColumn(3).width).toBe(2);
  });
});
