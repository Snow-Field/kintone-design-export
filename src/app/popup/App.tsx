import { useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/utils/error";
import "@/index.css";

type StatusType = "idle" | "loading" | "success" | "error";

export const App = () => {
  const [status, setStatus] = useState<StatusType>("idle");
  const [message, setMessage] = useState<string>("");

  const handleExport = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) throw new Error("タブが見つかりません");

      await chrome.tabs.sendMessage(tab.id, {
        action: "START_EXPORT",
      });
    } catch (e: unknown) {
      setStatus("error");
      if (
        e instanceof Error &&
        e.message.includes("Could not establish connection")
      ) {
        setMessage("kintoneのページで実行してください");
      } else {
        setMessage(getErrorMessage(e));
      }
    }
  };

  const statusConfig = {
    idle: null,
    loading: null,
    success: {
      icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 shrink-0" />,
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="w-64 p-4 font-sans bg-white">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          kintone設計書出力ツール
        </h3>
      </div>

      <Button
        onClick={handleExport}
        disabled={status === "loading"}
        className="w-full"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            処理中...
          </>
        ) : (
          <>設計書出力</>
        )}
      </Button>

      {currentStatus && message && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-xs ${currentStatus.className}`}
        >
          {currentStatus.icon}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
