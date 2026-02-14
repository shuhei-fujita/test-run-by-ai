# test-run-by-ai

Claude Code の `playwright-cli` スキルを使ったブラウザ自動テストのサンプルプロジェクト。

## 概要

自然言語で書かれた Feature ファイル（Gherkin形式）を Claude Code + `playwright-cli` で実行し、ブラウザ操作を自動化する。

## 前提条件

- [playwright-cli](https://github.com/anthropics/claude-code-playwright) がインストール済みであること
- Claude Code がセットアップ済みであること

### playwright-cli のインストール

```bash
playwright-cli install --skills
playwright-cli install-browser
```

## プロジェクト構成

```
.
├── .claude/
│   └── skills/
│       └── playwright-cli/    # playwright-cli スキル定義
├── features/
│   ├── login.feature          # ログイン機能のテストシナリオ
│   └── playwright-search.feature  # Playwright ドキュメント検索のテストシナリオ
├── .env.example               # 環境変数のテンプレート
└── .gitignore
```

## セットアップ

```bash
# 環境変数を設定
cp .env.example .env
# .env を編集して実際の値を入力
```

## テストシナリオ

### 1. Playwright ドキュメント検索 (`features/playwright-search.feature`)

Playwright 公式サイトで検索機能が動作することを確認する。

```
Scenario: ドキュメントサイトで "locator" を検索する
  Given ブラウザで "https://playwright.dev" を開く
  When 検索ボタンをクリックする
  And 検索ボックスに "locator" と入力する
  Then "locator" に関連する検索結果が表示される
```

### 2. ログイン機能 (`features/login.feature`)

アプリケーションへのログインと認証状態の保存・復元を確認する。

```
Scenario: 有効な認証情報でログインする
  Given ブラウザで "$TEST_BASE_URL/login" を開く
  When メールアドレス欄とパスワード欄に認証情報を入力する
  And ログインボタンをクリックする
  Then ダッシュボードページが表示される
  And 認証状態を "auth.json" に保存する

Scenario: 保存済みの認証状態でログインをスキップする
  Given 認証状態 "auth.json" を読み込む
  When ブラウザで "$TEST_BASE_URL/dashboard" を開く
  Then ログイン画面にリダイレクトされずダッシュボードが表示される
```

## 使い方

Claude Code で `/playwright-cli` スキルと `@` でファイルを指定してテストを実行する：

```
# Feature ファイルを渡してテストを実行
> /playwright-cli @features/playwright-search.feature を実行して

# ログインテストの場合
> /playwright-cli @features/login.feature を実行して

# 個別のブラウザ操作も可能
> /playwright-cli playwright.dev で "locator" を検索してスクリーンショットを撮って
```

### playwright-cli 主要コマンド

| コマンド | 説明 |
|---------|------|
| `playwright-cli open <url>` | ブラウザを起動してURLに遷移 |
| `playwright-cli snapshot` | ページの要素構造を取得 |
| `playwright-cli click <ref>` | 要素をクリック |
| `playwright-cli fill <ref> "text"` | テキスト入力 |
| `playwright-cli screenshot` | スクリーンショット撮影 |
| `playwright-cli state-save <file>` | 認証状態の保存 |
| `playwright-cli state-load <file>` | 認証状態の復元 |
| `playwright-cli close` | ブラウザを閉じる |

詳細は `.claude/skills/playwright-cli/SKILL.md` を参照。
