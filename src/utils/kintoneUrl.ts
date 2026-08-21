import type { AppLocation } from '@/types';

/** 通常のアプリ画面: /k/{アプリID}/... */
const APP_PATH = /^\/k\/(\d+)(?:\/|$)/;

/** ゲストスペースのアプリ画面: /k/guest/{スペースID}/{アプリID}/... */
const GUEST_APP_PATH = /^\/k\/guest\/(\d+)\/(\d+)(?:\/|$)/;

/**
 * kintone の画面パスからアプリの所在を取り出す。
 *
 * ゲストスペースのアプリは REST API のパスが
 * /k/guest/{スペースID}/v1/... となり通常のアプリと異なるため、
 * スペースIDもあわせて返す。
 */
export function parseAppLocation(pathname: string): AppLocation | undefined {
  const guest = GUEST_APP_PATH.exec(pathname);
  if (guest?.[1] && guest[2]) {
    return { guestSpaceId: guest[1], appId: guest[2] };
  }

  const app = APP_PATH.exec(pathname);
  if (app?.[1]) {
    return { appId: app[1] };
  }

  return undefined;
}
