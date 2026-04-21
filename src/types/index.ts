import { KintoneRestAPIClient } from "@kintone/rest-api-client";

type ClientApp = KintoneRestAPIClient["app"];

export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelData = ExcelCell[][];

/** シート生成の戻り値 */
export type SheetResult = {
  rows: ExcelData;
  headerIndex: number[];
};

export type AppStatusResponse = {
  enable: boolean;
  states?: Record<
    string,
    {
      name: string;
      index: string;
      assignee?: {
        type: "ONE" | "ALL" | "ANY";
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
  app: Awaited<ReturnType<ClientApp["getApp"]>>;
  fields: Awaited<ReturnType<ClientApp["getFormFields"]>>;
  layout: Awaited<ReturnType<ClientApp["getFormLayout"]>>;
  actions: Awaited<ReturnType<ClientApp["getAppActions"]>>;
  views: Awaited<ReturnType<ClientApp["getViews"]>>;
  appAcl: Awaited<ReturnType<ClientApp["getAppAcl"]>>;
  recordAcl: Awaited<ReturnType<ClientApp["getRecordAcl"]>>;
  fieldAcl: Awaited<ReturnType<ClientApp["getFieldAcl"]>>;
  status: AppStatusResponse;
};
