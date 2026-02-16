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
├── test-suites/                   # 案件ごとにフォルダを分けて管理
│   └── {案件名}/
│       ├── {案件名}.md            # テストシナリオ
│       ├── .env                   # 案件固有の環境変数（任意、ルート .env を上書き）
│       └── *.csv                  # テストデータ（任意）
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

### 環境変数の優先順位

1. `test-suites/{案件名}/.env` （案件固有、あれば上書き）
2. `.env` （グローバルのデフォルト値）

案件ごとにテスト環境が異なる場合、案件フォルダに `.env` を置いて `TEST_BASE_URL` 等を上書きできる。

## 使い方

Claude Code で `/playwright-cli` スキルと `@` でファイルを指定してテストを実行する：

```
# テストシナリオを渡して実行（ヘッドレスモード）
> /playwright-cli @test-suites/{案件名}/{案件名}.md --headless で実行して

# 個別のブラウザ操作も可能
> /playwright-cli playwright.dev で "locator" を検索してスクリーンショットを撮って
```

内部的には `playwright-cli open` 時の `--headed` フラグで制御される：

```bash
playwright-cli open https://example.com           # ブラウザ画面表示（デフォルト：ヘッドデッドモード）
playwright-cli open https://example.com --headless   # ヘッドレスモード
```

### テスト結果の管理

テスト結果は `test-results/{YYYYMMDDHHmm}_{案件名}/` に保存される：

```
test-results/
└── {YYYYMMDDHHmm}_{案件名}/
    ├── {シナリオ名}.png
    └── ...
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
