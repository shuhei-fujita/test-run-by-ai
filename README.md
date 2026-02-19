# gherkin-player

Gherkin シナリオ（Markdown）を **Claude Code + playwright-cli** でブラウザ上に再生し、テスト実行を自動化するツールキット。

## どういうもの？

```
[人間]  テストシナリオを用意 (Gherkin)
           │
[AI]    Claude Code が解釈・実行
        playwright-cli でブラウザ操作
           │
[人間]  スクリーンショット・動画で結果を確認・合否判定
```

- テストコードを書かずに、**日本語のシナリオ**でブラウザテストを実行できる
- テスト計画の生成・進捗管理・結果レポートまで Claude Code 上で完結する
- 認証状態の保存/復元、APIモック、スクリーンショット撮影などの機能を備える

## なぜこのアプローチか？

**定型テストの実行を自動化し、人間は探索的テストに集中する**

テストには、事前に手順と期待結果が決まっている定型的なもの（主要フローの確認、優先度の高い業務シナリオ等）と、人間の直感と判断で未知の不具合を探す探索的テストがある。現実には定型テストの実行に時間を取られ、探索的テストに十分な時間を割けないことが多い。

このプロジェクトは **AIがテストを実行し、人間が判断する** 体制で、定型テストを効率化する：

1. **Gherkin シナリオをAIが解釈・実行する** — 事前に用意された Given/When/Then のシナリオを Claude Code が読み取り、ブラウザ操作・スクリーンショット撮影・結果レポート生成までを行う
2. **テスト準備の煩雑さも吸収する** — 実際のプロジェクトでは、テスト環境の構築に複雑な手順が必要だったり、テストデータが欠損していたりする。AIがそうした障害に遭遇した際にも、手順書に沿った対処やデータ不足の報告をファシリテートする
3. **実行結果は必ず人間が判定する（テストオラクル）** — AIの解釈にはハルシネーション（もっともらしい誤認）のリスクがあるため、合否の最終判定（JSTQB でいうテストオラクル）は人間が担う。スクリーンショットと結果レポートを証跡として確認する
4. **安定したシナリオはテストコードに昇華する** — playwright-cli は操作ごとに対応する [Playwright コードを生成する](.claude/skills/playwright-cli/references/test-generation.md)ため、AI実行の結果をテストコードに組み立てやすい。テストコードにすることで、実行結果の安定性向上・ハルシネーションリスクの排除・LLM利用のランニングコスト削減が得られる

> **Note:** JSTQB のテストプロセスでいえば、本プロジェクトが自動化するのは**テスト実行**である。テスト分析・テスト設計（何をどうテストするか）はスコープ外で、Gherkin シナリオが事前に用意されている前提で動く。
>
> AI駆動のテスト実行は、同じシナリオでも実行ごとに操作パスが異なる可能性がある。テストの再現性が求められるリグレッションテストは、テストコードへの変換を推奨する。

## 前提条件

| ツール                                                                       | バージョン                      | 用途                       |
| ---------------------------------------------------------------------------- | ------------------------------- | -------------------------- |
| [Node.js](https://nodejs.org/)                                               | 22.x（`.tool-versions` で指定） | playwright-cli の実行環境  |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code)                | 最新版                          | テストシナリオの解釈・実行 |
| [playwright-cli](https://www.npmjs.com/package/@anthropic-ai/playwright-cli) | 最新版                          | ブラウザ操作の実行         |

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/shuhei-fujita/gherkin-player.git
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

実行の様子をリアルタイムで見たい場合は `--headed` を付けるとブラウザが表示される：

```
> /playwright-cli --headed @test-suites/youtube-search/test_suite.md
```

> テスト結果の確認は `test-results/` 配下のスクリーンショットで行える。headed モードは実行中の動作を目視で追いたい場合に使う。

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
