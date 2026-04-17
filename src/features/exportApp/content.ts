import * as XLSX from "xlsx-js-style";
import { fetchAllSettings } from "@/api/kintoneClient";
import { addStyledSheet, saveExcelFile, SHEET_NAMES } from "@/utils/excel";
import {
  buildGeneralSheet,
  buildFieldSheet,
  buildLookupSheet,
  buildReferenceSheet,
  buildViewSheet,
  buildAppAclSheet,
  buildRecordAclSheet,
  buildFieldAclSheet,
  buildProcessSheet,
  buildCalcInfoSheet,
} from "./sheetBuilders";

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "START_EXPORT") {
    exportAppDesign().then((res) => sendResponse(res));
    return true;
  }
});

async function exportAppDesign() {
  const match = window.location.pathname.match(/\/k\/(\d+)/);
  if (!match)
    return { success: false, message: "Kintoneアプリの画面で実行してください" };
  const appId = match[1];

  try {
    const data = await fetchAllSettings(appId);
    const wb = XLSX.utils.book_new();

    addStyledSheet(wb, SHEET_NAMES.GENERAL, buildGeneralSheet(data));
    addStyledSheet(wb, SHEET_NAMES.FIELD, buildFieldSheet(data));
    addStyledSheet(wb, SHEET_NAMES.LOOKUP, buildLookupSheet(data));
    addStyledSheet(wb, SHEET_NAMES.REFERENCE, buildReferenceSheet(data));
    addStyledSheet(wb, SHEET_NAMES.VIEW, buildViewSheet(data));
    addStyledSheet(wb, SHEET_NAMES.APP_ACL, buildAppAclSheet(data));
    addStyledSheet(wb, SHEET_NAMES.RECORD_ACL, buildRecordAclSheet(data));
    addStyledSheet(wb, SHEET_NAMES.FIELD_ACL, buildFieldAclSheet(data));
    addStyledSheet(wb, SHEET_NAMES.PROCESS, buildProcessSheet(data));
    addStyledSheet(wb, SHEET_NAMES.CALC_INFO, buildCalcInfoSheet(data));

    saveExcelFile(
      wb,
      `${location.hostname.split(".")[0]}-${appId}-design.xlsx`,
    );
    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    const message =
      e instanceof Error ? e.message : "不明なエラーが発生しました";
    return { success: false, message };
  }
}
