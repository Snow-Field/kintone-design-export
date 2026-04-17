import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { AppSettings, AppStatusResponse } from "../types";

const client = new KintoneRestAPIClient({});

// プロセス管理をfetchで取得する関数
async function fetchAppStatus(appId: string): Promise<AppStatusResponse> {
  const url = `${location.origin}/k/v1/app/status.json?app=${appId}`;
  const res = await fetch(url, {
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  if (!res.ok) {
    throw new Error(`プロセス管理の取得に失敗しました: ${res.statusText}`);
  }
  return res.json() as Promise<AppStatusResponse>;
}

export async function fetchAllSettings(appId: string): Promise<AppSettings> {
  const p = { app: appId };

  const [app, fields, layout, views, appAcl, recordAcl, fieldAcl, status] =
    await Promise.all([
      client.app.getApp({ id: appId }),
      client.app.getFormFields(p),
      client.app.getFormLayout(p),
      client.app.getViews(p),
      client.app.getAppAcl(p),
      client.app.getRecordAcl(p),
      client.app.getFieldAcl(p),
      fetchAppStatus(appId),
    ]);

  return { app, fields, layout, views, appAcl, recordAcl, fieldAcl, status };
}
