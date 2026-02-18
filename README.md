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
│   ├── commands/                  # カスタムコマンド（/plan-test 等）
│   ├── rules/                     # テスト運用ルール
│   └── skills/
│       └── playwright-cli/        # playwright-cli スキル定義
├── test-suites/                   # 案件ごとにフォルダを分けて管理
│   └── {案件名}/
│       ├── test_suite.md          # テストシナリオ（Gherkin形式）
│       ├── task.md                # テスト実行計画・進捗管理（/plan-test が生成）
│       ├── .env                   # 案件固有の環境変数（任意、ルート .env を上書き）
│       └── *.csv                  # テストデータ（任意）
├── test-results/                  # テスト実行結果（スクリーンショット等）
├── .env                           # グローバルの環境変数
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

案件ごとにテスト環境が異なる場合、案件フォルダに `.env` を置いて `BASE_URL` 等を上書きできる。

## 使い方

### テスト実行ワークフロー

```
1. テスト設計を test-suites/{案件名}/test_suite.md に配置
2. /plan-test {案件名}  → テスト計画を生成（task.md）
3. /playwright-cli @test-suites/{案件名}/test_suite.md  → テスト実行
4. /plan-test {案件名}  → 進捗確認
```

### 個別のブラウザ操作

```
> /playwright-cli playwright.dev で "locator" を検索してスクリーンショットを撮って
```

playwright-cli はデフォルトでヘッドレスモード。ブラウザ画面を表示したい場合は `--headed` を付ける：

```bash
playwright-cli open https://example.com           # ヘッドレスモード（デフォルト）
playwright-cli open https://example.com --headed   # ブラウザ画面を表示
```

### テスト結果の管理

テスト結果は `test-results/{YYYYMMDDHHmm}_{案件名}/` に保存される。
スクリーンショットのファイル名にはテストIDがあればプレフィックスとして付与される：

```
test-results/
└── {YYYYMMDDHHmm}_{案件名}/
    ├── TC-X-Y_{シナリオ名}.png   # テストIDありの場合
    ├── {シナリオ名}.png           # テストIDなしの場合
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
