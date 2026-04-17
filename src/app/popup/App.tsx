import React, { useState } from "react";

const App: React.FC = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleExport = async () => {
    setLoading(true);
    setStatus("実行中...");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) throw new Error("タブが見つかりません");

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "START_EXPORT",
      });

      if (chrome.runtime.lastError) {
        setStatus("エラー: Kintoneのページで実行してください");
      } else if (response?.success) {
        setStatus("出力が完了しました！");
      } else {
        setStatus(`失敗: ${response?.message || "不明なエラー"}`);
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "不明なエラーが発生しました";
      setStatus(`エラー: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "250px", padding: "16px", fontFamily: "sans-serif" }}>
      <h3 style={{ fontSize: "14px", marginTop: 0 }}>設計書出力ツール</h3>
      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: "#3498db",
          color: "white",
          border: "none",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "処理中..." : "設計書を出力する"}
      </button>
      {status && (
        <p style={{ fontSize: "12px", color: "#555", marginTop: "10px" }}>
          {status}
        </p>
      )}
    </div>
  );
};

export default App;
