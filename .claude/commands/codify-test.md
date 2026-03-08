---
name: "Codify Test"
description: PASS済みGherkinシナリオをPlaywrightテストコードに昇華する
category: Testing
tags: [testing, codification, playwright, e2e]
---

Gherkin シナリオの AI 実行結果を Playwright テストコード（`.spec.ts` + Page Object）に変換するコマンド。

**Input**: `$ARGUMENTS` — `test-suites/` 配下のフォルダ名（案件名）を指定

## 参照すべきルール・リファレンス

- `README.md`「テストコードへの昇華」セクション — 手順概要、POM 分解ルール、Gherkin → コード対応表
- `.claude/skills/playwright-cli/references/test-generation.md` — playwright-cli のコード生成の仕組み
- `.claude/rules/gherkin-notation.md` — Gherkin 記法ルール（タグ、構造）
- 既存の昇華済みコード（リファレンス実装）:
  - `e2e/pages/youtube.ts` + `e2e/tests/youtube-search.spec.ts`
  - `e2e/pages/playwright-docs.ts` + `e2e/tests/playwright-search.spec.ts`

## 実行手順

### Step 1: 案件フォルダの確認

- `test-suites/$ARGUMENTS/task.md` の存在を確認する
- 存在しない場合:
  - エラーメッセージを表示
  - `test-suites/` 配下のフォルダ一覧を提示して案件名の選択を促す
  - 処理を終了する
- `test-suites/$ARGUMENTS/test_suite.md` も読み込む（Gherkin シナリオの原文として使用）

### Step 2: PASS シナリオの抽出と提示

task.md からステータスを集計し、昇華候補を一覧表示する。

```
## 昇華候補: {案件名}

| TC-ID  | シナリオ名                       | ステータス | 昇華候補 |
| ------ | -------------------------------- | ---------- | -------- |
| TC-1-1 | トップページから動画を検索する   | PASS       | ○        |
| TC-1-2 | 検索結果から動画ページに遷移する | PASS       | ○        |
| TC-2-1 | エラーメッセージが表示される     | FAIL       | —        |
| TC-3-1 | ...                              | BLOCKED    | —        |

PASS: N件 / FAIL: N件 / BLOCKED: N件 / 未実行: N件
昇華候補: N件
```

PASS 以外のシナリオは昇華候補から除外する。

### Step 3: 昇華対象の選定（HITL）

AskUserQuestion で以下を確認する:

- 昇華候補のうち、**どれをテストコードにするか**
- 全候補を昇華する場合は「全部」で可
- 個別に選ぶ場合は TC-ID を列挙してもらう

**判断の参考情報として以下を提示する:**

```
判断のポイント:
- 繰り返し実行する？ → リグレッション確認で毎回使うなら昇華する価値がある
- 外部依存は安定している？ → CAPTCHA・ロボット検知等があると昇華しても不安定になる
- AI実行で十分？ → 一度きりの確認なら昇華不要
```

ユーザーが選定した結果を記録して次のステップに進む。

### Step 4: 画面グルーピング

選定されたシナリオを、操作対象の画面（URL のホスト + パス）でグルーピングする。

```
■ グループ1: YouTube（https://www.youtube.com/）
  - TC-1-1: トップページから動画を検索する
  - TC-1-2: 検索結果から動画ページに遷移する

■ グループ2: ...
```

1グループ = 1 Page Object + 1 spec ファイルの単位になる。
AskUserQuestion でグルーピングの確認を取る。ファイル名も提案する:

```
生成ファイル:
  e2e/pages/youtube.ts              ← Page Object
  e2e/tests/youtube-search.spec.ts  ← spec
```

既存の Page Object / spec がある場合は**新規作成ではなく追記**を提案する。

### Step 5: Page Object の生成

1画面 = 1 Page Object。ファイルは `e2e/pages/{画面名}.ts` に配置する。
既存の Page Object がある場合は、不足しているロケーター・メソッドのみ追加する。

**生成ルール:**

1. ロケーターは `readonly` プロパティで定義する
2. playwright-cli が生成したセマンティックロケーター（`getByRole`, `getByPlaceholder` 等）を使う。CSS セレクタの直書きは避ける
3. ページ遷移は `goto()` メソッドで定義する
4. 複数ステップの操作フローはメソッドにまとめる（`search()`, `login()` 等）
5. アサーション（`expect()`）は Page Object に含めない

**Page Object に入れるもの / 入れないもの：**

| 要素                                    | Page Object | spec  |
| --------------------------------------- | :---------: | :---: |
| ロケーター定義（`readonly` プロパティ） |    **○**    |       |
| ページ遷移（`goto()`）                  |    **○**    |       |
| 操作フロー（`search()`, `login()` 等）  |    **○**    |       |
| アサーション（`expect()`）              |             | **○** |
| テスト固有の値（検索ワード等）          |             | **○** |

**コード例:**

```typescript
// e2e/pages/login.ts
import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.signInButton = page.getByRole("button", { name: "Sign In" });
  }

  async goto() {
    await this.page.goto("https://example.com/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

**ロケーターの情報源:**
- playwright-cli 実行時の生成コード（task.md の備考や実施メモに記録されている場合）
- test_suite.md のシナリオ記述から推測
- 情報が不足する場合は AskUserQuestion で確認するか、playwright-cli で対象ページを開いて snapshot から取得する

### Step 6: spec ファイルの生成

ファイルは `e2e/tests/{機能名}.spec.ts` に配置する。Gherkin の構造をコメントで残す。
既存の spec がある場合は、不足しているテストケースのみ追加する。

**Gherkin → コード対応表:**

| Gherkin        | テストコード                                 |
| -------------- | -------------------------------------------- |
| `Feature:`     | ファイル先頭コメント + `test.describe()`     |
| `Scenario:`    | `test("TC-X-Y: シナリオ名", ...)`            |
| `Given`        | セットアップ（`goto()`、前提操作）           |
| `When` / `And` | アクション（Page Object のメソッド呼び出し） |
| `Then` / `And` | アサーション（`expect()` 文）                |
| `@TC-X-Y @P0`  | テスト直前のコメント                         |

**コード例:**

```typescript
// e2e/tests/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login";

// Feature: ログイン機能
//   ユーザーがメールアドレスとパスワードでログインできることを確認する

test.describe("ログイン機能", () => {
  // @TC-1-1 @P0
  test("TC-1-1: 有効な認証情報でログインできる", async ({ page }) => {
    const login = new LoginPage(page);

    // Given ブラウザで "https://example.com/login" を開く
    await login.goto();

    // When メールアドレスとパスワードを入力する
    // And 「Sign In」ボタンをクリックする
    await login.login("user@example.com", "password123");

    // Then ダッシュボードに遷移する
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

### Step 7: 実行確認

生成したテストを実行する:

```bash
npx playwright test {生成したspecファイル}
```

**結果に応じた対応:**

- **全 PASS**: 完了メッセージを表示し、生成ファイル一覧を提示する
- **一部 FAIL**:
  - トレースを確認する: `npx playwright show-trace playwright-results/*/trace.zip`
  - ロケーターの不一致が原因の場合: playwright-cli で snapshot を取り直してロケーターを修正する
  - 外部要因（ロボット検知等）の場合: `test.skip` の追加を提案する
  - 修正後に再実行する
- **全 FAIL**: 根本的な問題がある可能性。AskUserQuestion でユーザーに状況を報告し、方針を相談する

### Step 8: 完了レポート

生成結果のサマリを表示する:

```
## 昇華完了: {案件名}

### 生成ファイル
- e2e/pages/{画面名}.ts（新規 / 更新）
- e2e/tests/{機能名}.spec.ts（新規 / 更新）

### テスト実行結果
| TC-ID  | シナリオ名                       | 結果 |
| ------ | -------------------------------- | ---- |
| TC-1-1 | トップページから動画を検索する   | PASS |
| TC-1-2 | 検索結果から動画ページに遷移する | PASS |

### 次のステップ
- `npx playwright test` で全テスト実行
- CI に組み込む場合は `playwright.config.ts` の reporter 設定を確認
```

## ガードレール

- **test_suite.md と task.md は読み取り専用**。絶対に変更しない
- **既存の e2e コードは確認なく上書きしない**。追記の場合もユーザー承認を得る
- FAIL / BLOCKED のシナリオは昇華対象にしない
- ロケーターは playwright-cli のセマンティックロケーターを優先する。CSS セレクタの直書きは避ける
- Page Object にアサーション（`expect()`）を含めない
- テスト固有の値（検索ワード、テストデータ等）は spec 側に記述する
