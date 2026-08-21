# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

kintone アプリの設計情報を Excel（.xlsx）として出力する Chrome 拡張機能（Manifest V3）。
React + TypeScript + Vite + @crxjs/vite-plugin で構成。詳細な機能仕様は `README.md` を参照。

設計判断の経緯・確定した前提・進捗は `docs/` にある。**Excel の出力仕様を変更する前に `docs/ai/decisions/excel-output.md` と `docs/constraints.md` を読むこと。**過去に検討して却下した選択肢が記録されている。

## コマンド

```bash
npm run dev           # vite（crxjs の HMR。popup の UI 調整はこちらが速い）
npm run build         # tsc -b && vite build → dist/ を生成
npm run lint          # eslint .
npm test              # vitest run
npm run test:watch    # vitest（監視モード）
npm run format        # prettier --write .
npm run format:check  # prettier --check .
```

- 単一のテストを実行する場合は `npx vitest run -t "選択肢を index の昇順で並べる"`（`-t` はテスト名の部分一致）。ファイル単位なら `npx vitest run src/features/exportApp/sheetBuilders/sheetBuilders.test.ts`。
- スナップショットを意図的に更新する場合は `npx vitest run -u`。**出力仕様を変えたつもりが無いのに差分が出た場合は、更新せず原因を確認する。**
- 拡張機能として動かす場合は `npm run build` 後、`chrome://extensions` で「パッケージ化されていない拡張機能を読み込む」から `dist/` を読み込む。
- 拡張機能のバージョンは `public/manifest.json` の `version` が実体。`package.json` の `version` は使われていない。
- `build` / `test` / `lint` / `format:check` / `audit` はいずれもエラー0の状態を維持している。lint エラーを残したまま次の作業に進まない。

## アーキテクチャ

### 実行フロー

```
popup (React)                content script (kintone ページ内)
src/app/popup/App.tsx  ──►  src/features/exportApp/content.ts
  chrome.tabs.sendMessage       ├─ URL から /k/(\d+) で appId 抽出
  ({action:"START_EXPORT"})     ├─ fetchAllSettings(appId)   … src/api/kintoneClient.ts
                                ├─ sheetBuilders 各関数で行データ生成
                                ├─ addStyledSheet でスタイル適用    … src/utils/excel.ts
                                └─ saveExcelFile で Blob ダウンロード
                          ◄──  {success, message?} を sendResponse
```

- popup は UI と結果表示のみ。**kintone API 呼び出しは必ず content script 側**で行う。`KintoneRestAPIClient` を引数なしで生成しており、kintone ページのオリジン・セッションクッキーに依存しているため、popup / background から呼んでも認証が通らない。
- popup 側では `Could not establish connection` を「kintoneのページで実行してください」に読み替えている（content script 未注入のタブ）。
- `fetchAppStatus` のみ REST API Client ではなく生の `fetch` を使う。同一オリジン API のため `X-Requested-With: XMLHttpRequest` ヘッダが必須。

### シート生成の規約

各シートビルダーは `src/features/exportApp/sheetBuilders/*.ts` に 1 ファイル 1 関数で置き、`SheetResult`（`{ rows: ExcelCell[][]; headerIndex: number[] }`）を返す。

行データの共通ルール:

- 行 0 は空行、ヘッダー行は行 1（`headerIndex: [1]`）が基本。`processSheet.ts` のようにヘッダーが複数ある場合は `headerIndex` に全て列挙する。
- **各行の先頭セル（A 列）は必ず空文字**。A 列は余白扱いで、`addStyledSheet` は `C === 0` のセルにスタイルを適用しない。
- 一般情報シートだけ `applyGeneralInfoStyle` で B1（タイトル）と B3〜B7 に個別スタイルを当てている（`src/utils/excel.ts`）。

値の整形は既存シートの表記に合わせる:

- 真偽値のチェック表現: `■` / `□`（`appAclSheet.ts` の `flag`）
- 複数値の連結: `,`、フィールドマッピング: `src->dest`、セル内改行: `\n`
- エンティティの種別区切りは**全角スラッシュ `／`**（半角だと Excel 上で見づらいため意図的に変更されている）

### 新しいシートを追加する手順

1. `src/utils/excel.ts` の `SHEET_NAMES` にシート名を追加
2. 同ファイルの `COL_WIDTHS` に列幅（px 配列、先頭は A 列ぶんの `13`）を追加
3. `sheetBuilders/` に `buildXxxSheet(data: AppSettings): SheetResult` を作成
4. `sheetBuilders/index.ts` で re-export
5. `content.ts` の `sheetDefinitions` に `{ name, builder }` を登録（この配列の順序＝シートの並び順）
6. `sheetBuilders.test.ts` の `builders` 配列に追加し、`npm test` でスナップショットを生成する

### テスト

- `src/features/exportApp/sheetBuilders/sheetBuilders.test.ts` に集約。sheetBuilder は `AppSettings` を受け取り行データを返す純粋関数なので、モックを渡すだけで検証できる。
- モックは `src/test/fixtures/appSettings.ts`。**kintone REST API の実レスポンス構造に忠実に作ること**（例: サブテーブル内のフィールドは `properties` 直下ではなく `properties[サブテーブルコード].fields` に入る）。構造を崩すとテストが通っても実環境で壊れる。
- 型は fixture 内の `asAppSettings` で一度だけキャストする。テスト本体ではキャストしない。
- 実行環境は `node`。一般情報シートが `location.hostname` を参照するため、テスト側で `vi.stubGlobal("location", ...)` を行っている。ブラウザ API に依存する処理を増やす場合は同様にスタブする。
- `vitest.config.ts` は `vite.config.ts` とは別に用意している。crxjs プラグインをテスト実行時に読み込ませないため。

**ゲストスペース**: アプリの所在は `parseAppLocation`（`src/utils/kintoneUrl.ts`）が URL から解決し、`AppLocation`（`appId` と任意の `guestSpaceId`）として扱う。ゲストスペースでは REST API のパスが `/k/guest/<スペースID>/v1/...` に変わるため、`KintoneRestAPIClient` には `guestSpaceId` を渡し、`app/status.json` の生 fetch も `apiBasePath` でパスを切り替えている。**URL からアプリを特定する処理を増やす場合は正規表現を直書きせず `parseAppLocation` を使うこと。**

### 型の扱い

- `src/types/index.ts` の `AppSettings` は `Awaited<ReturnType<ClientApp["getApp"]>>` のように **REST API Client の戻り値型から導出**する。API を追加するときも手書き型を足さずこの方式に揃える。例外は `AppStatusResponse`（`app/status.json` を生 fetch しているため手書き）。
- フィールドプロパティは union 型（`KintoneFormFieldProperty.OneOf`）なので、型ごとに存在有無が変わるプロパティは `getFieldProp(f, "key")`（`src/utils/field.ts`）経由で参照する。`in` 演算子でのガードを毎回書かないための共通関数。

## その他

- パスエイリアス `@/` → `src/`。`vite.config.ts` の `resolve.alias` と `tsconfig.app.json` の `paths` の**両方**に定義があるため、変更時は両方を更新する。
- UI 文言・シート見出し・エラーメッセージはすべて日本語。
- content script の対象は `https://*.cybozu.com/k/*`（`public/manifest.json`）。権限は `activeTab` / `scripting` と `host_permissions` のみ。
