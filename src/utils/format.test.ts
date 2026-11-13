import { describe, expect, it } from 'vitest';
import { formatEntity, formatMapping } from './format';

describe('formatEntity', () => {
  it('種類とコードを : でつなぐ', () => {
    expect(formatEntity({ type: 'GROUP', code: 'sales' })).toBe('GROUP:sales');
  });

  it('コードを持たない作成者は種類だけにする', () => {
    expect(formatEntity({ type: 'CREATOR', code: null })).toBe('CREATOR');
  });

  it('下位組織にも適用する場合は添え字を付ける', () => {
    expect(formatEntity({ type: 'ORGANIZATION', code: 'dev' }, true)).toBe(
      'ORGANIZATION:dev(下位含む)',
    );
  });
});

describe('formatMapping', () => {
  it('元と先を矢印でつなぐ', () => {
    expect(formatMapping('住所', '顧客住所')).toBe('住所 → 顧客住所');
  });
});
