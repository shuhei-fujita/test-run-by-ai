---
name: "Install"
description: playwright-cli と依存ツールをセットアップする
category: Setup
tags: [setup, install, playwright]
---

playwright-cli の環境セットアップを行うコマンド。

## 実行手順

### Step 1: 前提チェック

以下を順番に確認し、結果をまとめて表示する。

**Node.js:**
- `node --version` を実行
- v18 以上であることを確認
- 未インストールの場合 → エラー表示して終了。`.tool-versions` があれば `asdf install` を案内

**playwright-cli:**
- `playwright-cli --version` を実行
- インストール済みなら バージョンを表示して Step 2 はスキップ

結果を以下の形式で表示:

```
📋 環境チェック
  Node.js:        v22.14.0 ✓
  playwright-cli:  未インストール → Step 2 でインストールします
```

### Step 2: playwright-cli インストール

playwright-cli が未インストールの場合のみ実行する。

以下を実行する:

```bash
npm install -g @playwright/cli
```

### Step 3: Playwright ブラウザのインストール

`playwright-cli open` でブラウザ起動を試みる前に、Chromium がインストール済みか確認する。

```bash
npx playwright install --dry-run 2>&1
```

未インストールの場合:
```bash
npx playwright install chromium
```

既にインストール済みの場合はスキップする。

### Step 4: 動作確認

```bash
playwright-cli --version
```

バージョンが表示されたら成功。以下を表示する:

```
✅ セットアップ完了

  playwright-cli v{version}
  Chromium: インストール済み

🚀 使い方:
  1. テストスイートを用意:  test-suites/{案件名}/test_suite.md
  2. テスト計画を生成:     /plan-test {案件名}
  3. テストを実行:         /playwright-cli @test-suites/{案件名}/test_suite.md
```

## エラーハンドリング

- npm / brew コマンドが失敗した場合 → エラー内容を表示し、手動インストールの手順を案内
- ブラウザインストールが失敗した場合 → `npx playwright install --with-deps chromium` を案内（OS依存のライブラリ不足の可能性）
- 権限エラーの場合 → `sudo` の使用は案内せず、npm prefix の設定変更を案内
