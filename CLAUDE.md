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
  chrome.tabs.sendMessage       ├─ parseAppLocation でアプリの所在を解決
  ({action:"START_EXPORT"})     ├─ fetchAllSettings(appLocation) … src/api/kintoneClient.ts
                                ├─ sheetBuilders 各関数で行データ生成
                                ├─ addStyledSheet でスタイル適用    … src/utils/excel.ts
                                └─ await saveExcelFile で Blob ダウンロード
                          ◄──  {success, message?} を sendResponse
```

- Excel の生成には **ExcelJS** を使う。`saveExcelFile` は `wb.xlsx.writeBuffer()` を待つため **非同期**で、呼び出し側で `await` が要る。

- popup は UI と結果表示のみ。**kintone API 呼び出しは必ず content script 側**で行う。`KintoneRestAPIClient` を引数なしで生成しており、kintone ページのオリジン・セッションクッキーに依存しているため、popup / background から呼んでも認証が通らない。
- popup 側では `Could not establish connection` を「kintoneのページで実行してください」に読み替えている（content script 未注入のタブ）。
- `fetchAppStatus` のみ REST API Client ではなく生の `fetch` を使う。同一オリジン API のため `X-Requested-With: XMLHttpRequest` ヘッダが必須。

### シート生成の規約

各シートビルダーは `src/features/exportApp/sheetBuilders/*.ts` に 1 ファイル 1 関数で置き、`SheetResult`（`{ blocks: SheetBlock[] }`）を返す。`SheetBlock` は 1 つの表を表し、`title` / `columns` / `rows` を持つ。プロセス管理のように 1 シートへ表を 2 つ並べる場合は `blocks` を複数返す。

**シートビルダーは行データだけを返し、見た目には関与しない。** 見出し・罫線・配色・A 列の余白・列幅の適用はすべて `addStyledSheet`（`src/utils/excel.ts`）が行う。

- `rows` の各行は `columns` と同じ並び。**A 列の余白は描画側が付けるので、行の先頭に空文字を入れない。**
- `columns[].group` は上段の見出し。隣り合う列で同じ値なら結合される。1 列でも `group` があれば見出しは 2 段になる。
- 見出し行は自動で固定される。表が 1 つだけのシートにはオートフィルタも設定される（Excel の仕様上シートあたり 1 つまでのため、表が複数のシートには付かない）。
- 列幅は **Excel の文字数単位**（ピクセルではない）。

値の整形は既存シートの表記に合わせる:

- 真偽値は `■` / `□`（`src/utils/format.ts` の `checkMark`）。未設定と `false` を区別したい列は、未設定なら空文字にする。
- kintone REST API の値は**日本語に変換せずそのまま出す**（`SINGLE_LINE_TEXT`、`AFTER`、`GROUP` など）。理由は `docs/ai/decisions/excel-output.md` の D-04。
- 1 対多の紐づけ（マッピング・表示フィールドなど）は**行方向に展開**し、対応元と対応先を別の列に置く（D-02）。単一フィールドが複数値を持つだけの属性（選択肢・対象ユーザー）は列内でカンマ区切り（D-03）。

### 新しいシートを追加する手順

1. `src/utils/excel.ts` の `SHEET_NAMES` にシート名を追加
2. `sheetBuilders/` に `buildXxxSheet(data: AppSettings): SheetResult` を作成（`columns` に見出しと幅を定義する）
3. `sheetBuilders/index.ts` で re-export
4. `content.ts` の `sheetDefinitions` に `{ name, builder }` を登録（この配列の順序＝シートの並び順）
5. `sheetBuilders.test.ts` の `builders` 配列に追加し、`npm test` でスナップショットを生成する

### 配色を変える

`src/utils/theme.ts` の値だけを差し替える。色は ARGB 8 桁。**見出しの背景色を変えるときは文字色とのコントラスト比を 4.5:1 以上に保つこと**（現在の値と根拠は `docs/specs/excel-layout.md`）。

### テスト

- `src/features/exportApp/sheetBuilders/sheetBuilders.test.ts` に集約。sheetBuilder は `AppSettings` を受け取り行データを返す純粋関数なので、モックを渡すだけで検証できる。
- **見出しの固定・オートフィルタ・セル結合・配色は行データのスナップショットでは検出できない。** これらは `src/utils/excel.test.ts` が、生成した .xlsx を読み戻して検証している。描画の挙動を変えたらこちらも確認する。
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
