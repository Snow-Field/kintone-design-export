import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import type { AppLocation, AppSettings, AppStatusResponse } from '../types';

/** ゲストスペースでは REST API のパスが /k/guest/{スペースID}/v1/... になる */
function apiBasePath(guestSpaceId?: string): string {
  return guestSpaceId ? `/k/guest/${guestSpaceId}/v1` : '/k/v1';
}

// プロセス管理をfetchで取得する関数
async function fetchAppStatus({
  appId,
  guestSpaceId,
}: AppLocation): Promise<AppStatusResponse> {
  const base = apiBasePath(guestSpaceId);
  const url = `${location.origin}${base}/app/status.json?app=${appId}`;
  const res = await fetch(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  if (!res.ok) {
    throw new Error(`プロセス管理の取得に失敗しました: ${res.statusText}`);
  }
  return res.json() as Promise<AppStatusResponse>;
}

export async function fetchAllSettings(
  appLocation: AppLocation,
): Promise<AppSettings> {
  const { appId, guestSpaceId } = appLocation;
  // guestSpaceId は実行時にしか決まらないため、ここでクライアントを生成する
  const client = new KintoneRestAPIClient(guestSpaceId ? { guestSpaceId } : {});
  const p = { app: appId };

  const [
    app,
    fields,
    layout,
    actions,
    views,
    appAcl,
    recordAcl,
    fieldAcl,
    status,
  ] = await Promise.all([
    client.app.getApp({ id: appId }),
    client.app.getFormFields(p),
    client.app.getFormLayout(p),
    client.app.getAppActions(p),
    client.app.getViews(p),
    client.app.getAppAcl(p),
    client.app.getRecordAcl(p),
    client.app.getFieldAcl(p),
    fetchAppStatus(appLocation),
  ]);

  return {
    app,
    fields,
    layout,
    actions,
    views,
    appAcl,
    recordAcl,
    fieldAcl,
    status,
  };
}
