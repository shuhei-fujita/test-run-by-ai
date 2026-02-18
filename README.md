# test-run-by-ai

自然言語で書いたテストシナリオ（Markdown）を **Claude Code + playwright-cli** で実行し、ブラウザ操作を自動テストするフレームワーク。

## どういうもの？

```
テストシナリオ (Markdown/Gherkin)
        │
        ▼
  Claude Code が解釈
        │
        ▼
  playwright-cli でブラウザ操作
        │
        ▼
  スクリーンショット + 結果レポート
```

- テストコードを書かずに、**日本語のシナリオ**でブラウザテストを実行できる
- テスト計画の生成・進捗管理・結果レポートまで Claude Code 上で完結する
- 認証状態の保存/復元、APIモック、スクリーンショット撮影などの機能を備える

## なぜこのアプローチか？

**テストの「スピード」と「品質」のバランスを取る**

従来のE2Eテストは、セレクタの指定・待機処理・アサーションのコードを書くのに時間がかかり、テスト設計そのものより実装の保守コストが高くなりがちだった。一方、手動テストは柔軟だが属人的で再現性に乏しい。

このプロジェクトでは **Gherkin（自然言語）をAIとの共通インターフェース** にすることで、両者の間を取る：

- **書くのが速い** — Gherkin で「Given/When/Then」を日本語で書くだけ。テストコードの実装コストがゼロ
- **AIが操作を解釈・実行する** — セレクタの指定やページ遷移の待機は Claude Code が判断する。ただし AI の解釈にはハルシネーションのリスクがあるため、HITL（人間の判断介入）で品質を担保する
- **証跡が残る** — スクリーンショット + task.md（結果レポート）が自動生成され、テスト実施の記録として機能する
- **Playwright テストコードへの出口がある** — 繰り返し実行するリグレッションテストは、本プロジェクトで得たコンテキスト（シナリオ・操作手順・セレクタ知見）をもとに Playwright テストコードに変換できる。playwright-cli 自体が Playwright ベースなので親和性が高い

## 前提条件

| ツール                                                                       | バージョン                      | 用途                       |
| ---------------------------------------------------------------------------- | ------------------------------- | -------------------------- |
| [Node.js](https://nodejs.org/)                                               | 22.x（`.tool-versions` で指定） | playwright-cli の実行環境  |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code)                | 最新版                          | テストシナリオの解釈・実行 |
| [playwright-cli](https://www.npmjs.com/package/@anthropic-ai/playwright-cli) | 最新版                          | ブラウザ操作の実行         |

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/<your-org>/test-run-by-ai.git
cd test-run-by-ai
```

### 2. `/install` で一括セットアップ

Claude Code を起動して `/install` を実行するだけで、Node.js の確認・playwright-cli のインストール・ブラウザのインストールがまとめて行われる。

```bash
claude
```

```
> /install
```

<details>
<summary>手動でセットアップする場合</summary>

**Node.js のインストール**

[asdf](https://asdf-vm.com/) や [mise](https://mise.jdx.dev/) を使っている場合は `.tool-versions` から自動的にバージョンが解決される。

```bash
# asdf の場合
asdf install

# 手動の場合は Node.js 22.x をインストール
```

**playwright-cli のインストール**

```bash
npm install -g @playwright/cli
npx playwright install chromium
```

</details>

### 3. 環境変数の設定（任意）

```bash
cp .env.example .env
```

`.env` を編集し、テスト対象の URL や認証情報を設定する。
サンプルのテストスイート（`youtube-search`、`playwright-search`）は認証不要なため、この手順はスキップ可能。

## 動作確認（Quick Start）

clone 直後に以下を実行して、環境が正しくセットアップされたか確認できる。

### 方法 1: 対話的に試す

Claude Code を起動し、自然言語でブラウザ操作を指示する。

```bash
claude
```

```
> /playwright-cli playwright.dev を開いて "locator" で検索し、スクリーンショットを撮って
```

`test-results/` 配下にスクリーンショットが保存されれば成功。

### 方法 2: サンプルテストスイートを実行する

リポジトリに同梱されている `youtube-search` のテストスイートを使って、テスト実行ワークフロー全体を試す。

```bash
claude
```

```
# ステップ 1: テスト計画を生成
> /plan-test youtube-search

# ステップ 2: テストを実行
> /playwright-cli @test-suites/youtube-search/test_suite.md

# ステップ 3: 進捗・結果を確認
> /plan-test youtube-search
```

実行後、以下が生成される：

- `test-suites/youtube-search/task.md` — テスト計画と結果レポート
- `test-results/{YYYYMMDDHHmm}_youtube-search/` — スクリーンショット

## プロジェクト構成

```
.
├── .claude/
│   ├── commands/                  # カスタムコマンド（/plan-test 等）
│   ├── rules/                     # テスト運用ルール
│   └── skills/
│       └── playwright-cli/        # playwright-cli スキル定義
├── test-suites/                   # テストスイート（案件ごとにフォルダ管理）
│   ├── youtube-search/            # サンプル: YouTube検索テスト
│   ├── playwright-search/         # サンプル: Playwrightドキュメント検索テスト
│   └── {案件名}/
│       ├── test_suite.md          # テストシナリオ（Gherkin形式）
│       ├── task.md                # テスト計画・進捗管理（/plan-test が生成）
│       ├── .env                   # 案件固有の環境変数（任意、ルート .env を上書き）
│       └── *.csv                  # テストデータ（任意）
├── test-results/                  # テスト実行結果（自動生成、git管理外）
├── .env.example                   # 環境変数のテンプレート
└── .tool-versions                 # Node.js バージョン指定
```

## 使い方

### テスト実行ワークフロー

```
1. test-suites/{案件名}/test_suite.md にテストシナリオを配置
2. /plan-test {案件名}            → テスト計画を生成（task.md）
3. /playwright-cli @test-suites/{案件名}/test_suite.md  → テスト実行
4. /plan-test {案件名}            → 進捗確認・HITL（人の判断が必要な箇所で一時停止）
5. 全シナリオ完了後、task.md が最終結果レポートになる
```

### テストシナリオの書き方

Gherkin 形式の Markdown で記述する。サンプル（`test-suites/youtube-search/test_suite.md`）：

```gherkin
Feature: YouTube動画検索

  YouTubeで検索機能が正しく動作することを確認する

  @TC-1-1 @P0
  Scenario: トップページから動画を検索する
    Given ブラウザで "https://www.youtube.com/" を開く
    When 検索ボックスに "Playwright tutorial" と入力する
    And Enterキーを押して検索を実行する
    Then 検索結果ページに遷移する
    And 動画のサムネイルが一覧表示される
    And スクリーンショットを撮影する
```

### 環境変数の優先順位

1. `test-suites/{案件名}/.env` （案件固有、あれば上書き）
2. `.env` （グローバルのデフォルト値）

案件ごとにテスト環境が異なる場合、案件フォルダに `.env` を置いて `BASE_URL` 等を上書きできる。

### テスト結果の管理

テスト結果は `test-results/{YYYYMMDDHHmm}_{案件名}/` に自動保存される：

```
test-results/
└── 202602181430_youtube-search/
    ├── TC-1-1_トップページから動画を検索する.png
    ├── TC-1-2_検索結果から動画ページに遷移する.png
    └── ...
```

### 個別のブラウザ操作

テストスイートを使わず、自然言語で直接ブラウザを操作することもできる：

```
> /playwright-cli https://example.com を開いてタイトルのスクリーンショットを撮って
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

## トラブルシューティング

### `playwright-cli: command not found`

playwright-cli がインストールされていない。Claude Code で `/install` を実行するか、手動で以下を実行：

```bash
npm install -g @playwright/cli
npx playwright install chromium
```

### ブラウザが起動しない / クラッシュする

Chromium のインストールが不完全な可能性がある。再インストールを試す：

```bash
npx playwright install chromium
```

### スクリーンショットがルート直下に出力される

`run-code` 内で `page.screenshot()` を使う際にパスを指定していない。必ず `test-results/` 配下のフルパスを指定する。

### セッションがクラッシュした

`run-code` で複雑な操作を行うとセッションが切れることがある。`playwright-cli open` で再起動する。
