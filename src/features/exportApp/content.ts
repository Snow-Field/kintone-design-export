import * as XLSX from "xlsx-js-style";
import { fetchAllSettings } from "@/api/kintoneClient";
import { getFormattedDate } from "@/utils/date";
import { addStyledSheet, saveExcelFile, SHEET_NAMES } from "@/utils/excel";
import { getErrorMessage } from "@/utils/error";
import {
  buildGeneralSheet,
  buildFieldSheet,
  buildCalcSheet,
  buildActionSheet,
  buildLookupSheet,
  buildReferenceSheet,
  buildViewSheet,
  buildAppAclSheet,
  buildRecordAclSheet,
  buildFieldAclSheet,
  buildProcessSheet,
} from "./sheetBuilders";

const sheetDefinitions = [
  { name: SHEET_NAMES.GENERAL, builder: buildGeneralSheet },
  { name: SHEET_NAMES.FIELD, builder: buildFieldSheet },
  { name: SHEET_NAMES.CALC, builder: buildCalcSheet },
  { name: SHEET_NAMES.ACTION, builder: buildActionSheet },
  { name: SHEET_NAMES.LOOKUP, builder: buildLookupSheet },
  { name: SHEET_NAMES.REFERENCE, builder: buildReferenceSheet },
  { name: SHEET_NAMES.VIEW, builder: buildViewSheet },
  { name: SHEET_NAMES.APP_ACL, builder: buildAppAclSheet },
  { name: SHEET_NAMES.RECORD_ACL, builder: buildRecordAclSheet },
  { name: SHEET_NAMES.FIELD_ACL, builder: buildFieldAclSheet },
  { name: SHEET_NAMES.PROCESS, builder: buildProcessSheet },
] as const;

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "START_EXPORT") {
    exportAppDesign().then((res) => sendResponse(res));
    return true;
  }
});

async function exportAppDesign() {
  const match = window.location.pathname.match(/\/k\/(\d+)/);
  if (!match) {
    return { success: false, message: "Kintoneアプリの画面で実行してください" };
  }
  const appId = match[1];

  try {
    const data = await fetchAllSettings(appId);
    const wb = XLSX.utils.book_new();

    sheetDefinitions.forEach(({ name, builder }) => {
      addStyledSheet(wb, name, builder(data));
    });

    saveExcelFile(
      wb,
      `${location.hostname.split(".")[0]}-${appId}-${getFormattedDate()}.xlsx`,
    );
    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    const message = getErrorMessage(e);
    return { success: false, message };
  }
}
