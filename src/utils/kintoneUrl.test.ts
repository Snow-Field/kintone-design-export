import { describe, expect, it } from 'vitest';
import { parseAppLocation } from './kintoneUrl';

describe('parseAppLocation', () => {
  it('通常のアプリ画面からアプリIDを取り出す', () => {
    expect(parseAppLocation('/k/123/')).toEqual({ appId: '123' });
  });

  it('末尾のスラッシュが無くても解釈できる', () => {
    expect(parseAppLocation('/k/123')).toEqual({ appId: '123' });
  });

  it('レコード一覧や詳細画面でも解釈できる', () => {
    expect(parseAppLocation('/k/123/show')).toEqual({ appId: '123' });
    expect(parseAppLocation('/k/123/edit')).toEqual({ appId: '123' });
  });

  it('ゲストスペースのアプリからスペースIDとアプリIDを取り出す', () => {
    expect(parseAppLocation('/k/guest/45/123/')).toEqual({
      guestSpaceId: '45',
      appId: '123',
    });
  });

  it('ゲストスペースでも末尾のスラッシュや後続パスを許容する', () => {
    expect(parseAppLocation('/k/guest/45/123')).toEqual({
      guestSpaceId: '45',
      appId: '123',
    });
    expect(parseAppLocation('/k/guest/45/123/show')).toEqual({
      guestSpaceId: '45',
      appId: '123',
    });
  });

  it('アプリ画面でないパスは undefined を返す', () => {
    expect(parseAppLocation('/k/')).toBeUndefined();
    expect(parseAppLocation('/')).toBeUndefined();
    expect(parseAppLocation('/k/admin/app/index')).toBeUndefined();
  });

  it('ゲストスペースのポータルは undefined を返す', () => {
    expect(parseAppLocation('/k/guest/45/')).toBeUndefined();
  });

  it('パスの途中に現れる /k/ の並びを誤って拾わない', () => {
    expect(parseAppLocation('/other/k/123/')).toBeUndefined();
  });
});
