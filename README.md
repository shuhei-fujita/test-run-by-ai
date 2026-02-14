# test-run-by-ai

Claude Code の `playwright-cli` スキルを使ったブラウザ自動テストのサンプルプロジェクト。

## 概要

自然言語で書かれたテストシナリオ（Markdown）を Claude Code + `playwright-cli` で実行し、ブラウザ操作を自動化する。

## 前提条件

- [playwright-cli](https://github.com/microsoft/playwright-cli) がインストール済みであること
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
│       └── playwright-cli/        # playwright-cli スキル定義
├── test-suites/
│   ├── login.md                   # ログイン機能のテストシナリオ
│   ├── playwright-search.md       # Playwright ドキュメント検索のテストシナリオ
│   └── youtube-search.md          # YouTube 動画検索のテストシナリオ
├── test-results/                  # テスト実行結果（スクリーンショット等）
├── .env.example                   # 環境変数のテンプレート
└── .gitignore
```

## セットアップ

```bash
# 環境変数を設定
cp .env.example .env
# .env を編集して実際の値を入力
```

## テストシナリオ

### 1. Playwright ドキュメント検索 (`test-suites/playwright-search.md`)

Playwright 公式サイトで検索機能が動作することを確認する。

### 2. ログイン機能 (`test-suites/login.md`)

アプリケーションへのログインと認証状態の保存・復元を確認する。

### 3. YouTube 動画検索 (`test-suites/youtube-search.md`)

YouTube でキーワード検索し、動画一覧の表示と動画ページへの遷移を確認する。

## 使い方

Claude Code で `/playwright-cli` スキルと `@` でファイルを指定してテストを実行する：

```
# テストシナリオを渡して実行（ヘッドレスモード）
> /playwright-cli @test-suites/youtube-search.md

# ログインテストの場合
> /playwright-cli @test-suites/login.md

# 個別のブラウザ操作も可能
> /playwright-cli playwright.dev で "locator" を検索してスクリーンショットを撮って
```

### ヘッドレス / ヘッドデッドモードの切り替え

```
# ヘッドレスモード（デフォルト） - ブラウザ画面を表示しない
> /playwright-cli @test-suites/youtube-search.md

# ヘッドデッドモード - ブラウザ画面を表示して操作を目視確認
> /playwright-cli @test-suites/youtube-search.md --headed で実行して
```

内部的には `playwright-cli open` 時の `--headed` フラグで制御される：

```bash
playwright-cli open https://example.com           # ヘッドレス（デフォルト）
playwright-cli open https://example.com --headed   # ブラウザ画面表示
```

### テスト結果の管理

テスト結果は `test-results/{YYYYMMDDHHmm}_{テストスイート名}/` に保存される：

```
test-results/
└── 202602142307_youtube-search/
    ├── search-results.png
    └── video-page.png
```

### playwright-cli 主要コマンド

| コマンド                           | 説明                        |
| ---------------------------------- | --------------------------- |
| `playwright-cli open <url>`        | ブラウザを起動してURLに遷移 |
| `playwright-cli snapshot`          | ページの要素構造を取得      |
| `playwright-cli click <ref>`       | 要素をクリック              |
| `playwright-cli fill <ref> "text"` | テキスト入力                |
| `playwright-cli screenshot`        | スクリーンショット撮影      |
| `playwright-cli state-save <file>` | 認証状態の保存              |
| `playwright-cli state-load <file>` | 認証状態の復元              |
| `playwright-cli close`             | ブラウザを閉じる            |

詳細は `.claude/skills/playwright-cli/SKILL.md` を参照。
