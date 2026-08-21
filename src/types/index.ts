import { KintoneRestAPIClient } from '@kintone/rest-api-client';

type ClientApp = KintoneRestAPIClient['app'];

export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelData = ExcelCell[][];

/**
 * 列の定義。
 * 隣り合う列で group が同じ場合、上段の見出しが結合される。
 */
export type ColumnDef = {
  /** 上段の見出し。全列で省略した表は見出しが1段になる */
  group?: string;
  /** 下段の見出し */
  header: string;
  /** 列幅（Excel の文字数単位） */
  width: number;
};

/**
 * シートに載せる1つの表。
 * プロセス管理のように1シートへ複数の表を並べる場合がある。
 */
export type SheetBlock = {
  /** 表の上に置く見出し。省略すると見出し行から始まる */
  title?: string;
  columns: ColumnDef[];
  /** 各行は columns と同じ並び。余白のA列は描画側が付ける */
  rows: ExcelData;
};

/** シート生成の戻り値 */
export type SheetResult = {
  blocks: SheetBlock[];
};

/** 対象アプリの所在。guestSpaceId があればゲストスペースのアプリを指す */
export type AppLocation = {
  appId: string;
  guestSpaceId?: string;
};

export type AppStatusResponse = {
  enable: boolean;
  states?: Record<
    string,
    {
      name: string;
      index: string;
      assignee?: {
        type: 'ONE' | 'ALL' | 'ANY';
        entities: Array<{
          entity: { type: string; code: string };
          includeSubs: boolean;
        }>;
      };
    }
  >;
  actions?: Array<{
    name: string;
    from: string;
    to: string;
    filterCond: string;
  }>;
};

export type AppSettings = {
  app: Awaited<ReturnType<ClientApp['getApp']>>;
  fields: Awaited<ReturnType<ClientApp['getFormFields']>>;
  layout: Awaited<ReturnType<ClientApp['getFormLayout']>>;
  actions: Awaited<ReturnType<ClientApp['getAppActions']>>;
  views: Awaited<ReturnType<ClientApp['getViews']>>;
  appAcl: Awaited<ReturnType<ClientApp['getAppAcl']>>;
  recordAcl: Awaited<ReturnType<ClientApp['getRecordAcl']>>;
  fieldAcl: Awaited<ReturnType<ClientApp['getFieldAcl']>>;
  status: AppStatusResponse;
};
