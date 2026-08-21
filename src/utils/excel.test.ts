/**
 * 生成した .xlsx を読み戻して、行データのスナップショットでは
 * 検出できない設定（見出しの固定・オートフィルタ・セル結合・配色）を確認する。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Workbook, type Worksheet } from 'exceljs';
import { addStyledSheet, createWorkbook } from './excel';
import { THEME } from './theme';
import type { SheetResult } from '@/types';

const TWO_TIER: SheetResult = {
  blocks: [
    {
      columns: [
        { group: '基本', header: 'コード', width: 20 },
        { group: '基本', header: '名称', width: 20 },
        { group: '権限', header: '閲覧', width: 8 },
        { header: '備考', width: 30 },
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
      title: '一般情報',
      columns: [
        { header: '項目', width: 20 },
        { header: '値', width: 40 },
      ],
      rows: [['ドメイン', 'example.cybozu.com']],
    },
  ],
};

const TWO_BLOCKS: SheetResult = {
  blocks: [
    {
      title: 'ステータス',
      columns: [{ header: '名称', width: 20 }],
      rows: [['未対応'], ['完了']],
    },
    {
      title: 'アクション',
      columns: [{ header: '名称', width: 20 }],
      rows: [['対応する']],
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

describe('addStyledSheet（2段見出し）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('two', TWO_TIER);
  });

  it('A列を余白として空ける', () => {
    expect(ws.getCell('A2').value).toBeNull();
    expect(ws.getCell('A3').value).toBeNull();
  });

  it('上段に group、下段に header を書く', () => {
    expect(ws.getCell('B2').value).toBe('基本');
    expect(ws.getCell('B3').value).toBe('コード');
    expect(ws.getCell('D2').value).toBe('権限');
    expect(ws.getCell('D3').value).toBe('閲覧');
  });

  it('同じ group が続く列の上段を結合する', () => {
    expect(ws.getCell('B2').isMerged).toBe(true);
    expect(ws.getCell('C2').isMerged).toBe(true);
    // 単独の group は結合しない
    expect(ws.getCell('D2').isMerged).toBe(false);
  });

  it('group を持たない列の上段は空にする', () => {
    expect(ws.getCell('E2').value).toBeNull();
    expect(ws.getCell('E3').value).toBe('備考');
  });

  it('見出しの2行を固定する', () => {
    const view = ws.views[0];
    expect(view?.state).toBe('frozen');
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(3);
  });

  it('見出し行にオートフィルタを設定する', () => {
    // 読み戻すと範囲は文字列で表される。B3 が見出し、E6 が明細の末尾
    expect(ws.autoFilter).toBe('B3:E6');
  });

  it('見出しにテーマの配色を適用する', () => {
    const group = ws.getCell('B2');
    const header = ws.getCell('B3');
    expect(group.fill).toMatchObject({
      fgColor: { argb: THEME.color.groupHeaderBg },
    });
    expect(header.fill).toMatchObject({
      fgColor: { argb: THEME.color.headerBg },
    });
    expect(header.font?.color?.argb).toBe(THEME.color.headerText);
    expect(header.font?.bold).toBe(true);
  });

  it('偶数行に背景色を敷く', () => {
    // 明細1行目は素地、2行目に色が付く
    expect(ws.getCell('B4').fill).toMatchObject({ pattern: 'none' });
    expect(ws.getCell('B5').fill).toMatchObject({
      fgColor: { argb: THEME.color.stripeBg },
    });
  });

  it('本文にテーマのフォントを適用する', () => {
    expect(ws.getCell('B4').font?.name).toBe(THEME.font.name);
    expect(ws.getCell('B4').font?.size).toBe(THEME.font.size);
  });

  it('列幅を定義どおりに設定する', () => {
    expect(ws.getColumn(2).width).toBe(20);
    expect(ws.getColumn(4).width).toBe(8);
  });
});

describe('addStyledSheet（1段見出し）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('single', SINGLE_TIER);
  });

  it('表題を書いてから見出しを置く', () => {
    expect(ws.getCell('B2').value).toBe('一般情報');
    expect(ws.getCell('B4').value).toBe('項目');
    expect(ws.getCell('B5').value).toBe('ドメイン');
  });

  it('見出しの1行だけを固定する', () => {
    const view = ws.views[0];
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(4);
  });
});

describe('addStyledSheet（表が2つ）', () => {
  let ws: Worksheet;
  beforeAll(async () => {
    ws = await render('blocks', TWO_BLOCKS);
  });

  it('表を間隔を空けて縦に並べる', () => {
    expect(ws.getCell('B2').value).toBe('ステータス');
    expect(ws.getCell('B4').value).toBe('名称');
    expect(ws.getCell('B5').value).toBe('未対応');
    expect(ws.getCell('B6').value).toBe('完了');
    expect(ws.getCell('B9').value).toBe('アクション');
    expect(ws.getCell('B11').value).toBe('名称');
    expect(ws.getCell('B12').value).toBe('対応する');
  });

  it('表が複数あるシートにはオートフィルタを設定しない', () => {
    expect(ws.autoFilter).toBeUndefined();
  });

  it('先頭の表の見出しは固定する', () => {
    const view = ws.views[0];
    expect(view?.state).toBe('frozen');
    expect(view && 'ySplit' in view ? view.ySplit : undefined).toBe(4);
  });
});
