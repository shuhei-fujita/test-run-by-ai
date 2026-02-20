---
paths:
  - "test-suites/**"
---

# playwright-cli テスト実施のベストプラクティス

## 1. 実行速度の改善

### `run-code` で複数操作をまとめる

1コマンドずつ実行するとスナップショット取得・応答待ちで遅くなる。定型的な操作（フォーム入力、連続クリック等）は `run-code` で一括実行する。

```bash
# 悪い例: 1操作ずつ（各コマンドでスナップショット取得が発生）
playwright-cli click e226
playwright-cli click e337
playwright-cli click e239

# 良い例: run-codeで一括
playwright-cli run-code "async page => {
  await page.getByRole('button', { name: '対象ボタン' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('checkbox', { name: '対象項目' }).click();
  await page.getByRole('button', { name: '決定' }).click();
}"
```

### ページロード待ちは最小限に

- `goto` 後にスナップショットが空（6行程度）なら `waitForTimeout(2000〜3000)` を入れる
- スナップショットが正常に取得できれば待機不要
- 不必要な `waitForTimeout` はテスト全体を遅くする

### スナップショットの読み込みは必要な範囲だけ

スナップショットは200〜300行になることがある。ref番号の確認だけなら `offset` で必要な部分だけ読む。

## 2. 結果確認が難しいテストの工夫

### トースト（フラッシュメッセージ）のキャプチャ

トーストは数秒で消えるため、`run-code` 内で **操作→即スクリーンショット** をまとめる。

```bash
playwright-cli run-code "async page => {
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);  // トースト表示待ち（1500msが目安）
  await page.screenshot({ path: 'path/to/screenshot.png', scale: 'css' });
}"
```

- 短すぎるとトースト表示前、長すぎると消えた後になる
- スナップショット（テキスト）でもトーストのテキストは取得可能

### ローディング状態のキャプチャ

API応答が速い環境ではローディング表示の撮影が困難。以下の手法を使う。

**手法1: `route` でAPIレスポンスを遅延させる（推奨）**
```bash
playwright-cli run-code "async page => {
  await page.route('**/api/対象エンドポイント', async route => {
    await new Promise(r => setTimeout(r, 3000));
    await route.continue();
  });
  await page.reload({ waitUntil: 'commit' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'loading.png', scale: 'css' });
}"
```

**手法2: CDP Network Throttling**
```bash
playwright-cli run-code "async page => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, downloadThroughput: 50000, uploadThroughput: 50000, latency: 2000
  });
}"
```

注意:
- mutation中のローディング（isPending）は応答が速すぎて実質撮影不可。SKIP判定で問題ない
- `run-code` 内の `page.goto()` + `route` の組み合わせはセッションクラッシュの原因になる。`reload` を使うか、`route` は別コマンドで設定してから `goto` する

### 件数変化の確認

`eval` で素早くテキストから件数を取得できる:
```bash
playwright-cli eval "document.body.innerText.match(/\\d+件/g)"
```

## 3. APIモック（エラーハンドリングテスト）

### `route` コマンドでステータスコードを差し替え

```bash
# エラーモック設定
playwright-cli route "**/api/対象エンドポイント" --status=500
playwright-cli route "**/api/対象エンドポイント" --status=400

# モック解除
playwright-cli unroute "**/api/対象エンドポイント"
```

### URLパターンの注意点

- RESTful APIのパスパラメータには `*` でワイルドカードを使う（例: `**/resources/*/update`）
- `run-code` 内で設定した route は `playwright-cli unroute` では解除できない。`run-code` 内で `page.unroute('**/*')` するか、ブラウザを再起動する

### ネットワークエラーテスト

```bash
playwright-cli run-code "async page => {
  await page.context().setOffline(true);
  try { await page.reload({ timeout: 5000 }); } catch(e) {}
  await page.screenshot({ path: 'offline.png', scale: 'css' });
  await page.context().setOffline(false);  // 必ず復旧する
}"
```

## 4. テストデータの後片付け

テストで作成したデータは **必ず削除する**。`run-code` でまとめると速い。

```bash
playwright-cli run-code "async page => {
  // 検索で対象を特定 → 選択 → 削除の流れ
  await page.getByRole('cell', { name: 'テストデータ名' }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: '削除' }).click();
  await page.waitForTimeout(500);
  // 確認ダイアログ内のボタンを押す（同名ボタンが複数ある場合は nth で指定）
  await page.getByRole('button', { name: '削除' }).nth(1).click();
  await page.waitForTimeout(2000);
}"
```

## 5. デバッグ用スクリーンショットの撮影

### 各ステップでスクリーンショットを残す

テスト失敗時の原因特定を容易にするため、操作の要所でスクリーンショットを撮影する。

**撮影すべきタイミング:**
- ページ遷移直後（画面が正しくロードされたことの確認）
- フォーム入力完了後（入力値が反映されたことの確認）
- ボタンクリック等の操作後（操作結果の確認）
- エラー発生時（エラー状態の記録）
- テストシナリオの最終確認時（期待結果の証跡）

**命名規則:**
```bash
# test-results/{timestamp}_{テストスイート名}/ 配下に保存
# ファイル名は TC-X-Y_{scenario名}.png（IDがないシナリオは {scenario名}.png）
# 連番プレフィックス（01_, 02_ 等）は使用禁止
playwright-cli screenshot test-results/202602160300_案件名/TC-1-1_初期表示確認.png
playwright-cli screenshot test-results/202602160300_案件名/TC-1-2_フォーム入力後の確認.png
playwright-cli screenshot test-results/202602160300_案件名/TC-1-3_保存結果の確認.png
```

**viewport / fullPage の使い分け:**

スクリーンショットはデフォルトでviewport（表示領域）のみ撮影する。`--full-page`（fullPage）はスクロール可能なページ全体を撮影する。検証対象に応じて使い分ける:

| 検証対象                      | 撮影方法               | 理由                                           |
| ----------------------------- | ---------------------- | ---------------------------------------------- |
| 一覧テーブルの全行確認        | `--full-page`          | テーブル下部が見切れるため                     |
| 画面全体のレイアウト確認      | `--full-page`          | ヘッダー〜フッターまで検証対象                 |
| トースト/フラッシュメッセージ | viewport（デフォルト） | 画面上部に表示されるのでviewportで十分         |
| ダイアログ/モーダル           | viewport（デフォルト） | 画面中央に表示される。fullPageだと余白が増える |
| フォーム入力・ボタン操作後    | viewport（デフォルト） | 操作対象がフォーカス範囲内                     |
| エラー表示の確認              | viewport（デフォルト） | エラーUI（トースト等）は画面上部               |

```bash
# CLI: --full-page オプション
playwright-cli screenshot --full-page --filename=test-results/.../TC-6-1_一覧全体.png

# run-code: fullPage: true
await page.screenshot({ path: dir + '/TC-6-1_一覧全体.png', scale: 'css', fullPage: true });
```

**run-code 内での連続撮影（推奨）:**
```bash
playwright-cli run-code "async page => {
  const dir = 'test-results/202602160300_案件名';

  // 操作1 → スクショ
  await page.getByRole('textbox', { name: '名前' }).fill('テスト太郎');
  await page.screenshot({ path: dir + '/TC-1-2_フォーム入力後の確認.png', scale: 'css' });

  // 操作2 → スクショ
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: dir + '/TC-1-3_保存結果の確認.png', scale: 'css' });
}"
```

**最低限の撮影ルール:**
- PASS判定の根拠となるスクリーンショットは **必須**
- FAIL時は失敗時の画面状態を **必ず** 撮影
- 長い操作フローでは **3ステップに1回以上** 撮影する

### 動画録画（`--video` オプション）

`/playwright-cli` 起動時に `--video` を指定すると、テスト実行全体を動画（WebM）で録画する。

```
> /playwright-cli --video @test-suites/youtube-search/test_suite.md
```

**動作:**
1. ブラウザ起動後に `playwright-cli video-start` を実行
2. 通常通りテストシナリオを実行（スクリーンショットも併用可）
3. テスト完了時に `playwright-cli video-stop` で保存

**出力先:** `test-results/{timestamp}_{案件名}/video.webm`

**注意:**
- 録画中はオーバーヘッドが発生し、テスト実行が若干遅くなる
- 長時間のテストではファイルサイズが大きくなる
- トークン消費量はスクリーンショットのみの場合と変わらない（動画の開始・停止コマンドが増えるだけ）

### トレース（全シナリオで常時ON）

全テストシナリオでトレースを記録する。DOMスナップショット・ネットワーク・コンソールログが残るため、FAIL時の原因調査に使える。スクリーンショットの代わりにはならないので併用する。

**粒度の選択（運用比較中）:**

現在、以下の2方式を試行中。運用してみて片方に絞る。

#### 方式A: シナリオ単位

シナリオごとに `tracing.start()` / `tracing.stop()` する。FAILのトレースだけピンポイントで開ける。

```bash
playwright-cli run-code "async page => {
  const dir = 'test-results/202602160300_案件名';
  const context = page.context();

  // TC-1-1 開始
  await context.tracing.start({ screenshots: true, snapshots: true });

  // テスト操作...
  await page.getByRole('button', { name: '保存' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: dir + '/TC-1-1_保存結果.png', scale: 'css' });

  // TC-1-1 終了
  await context.tracing.stop({ path: dir + '/traces/TC-1-1_保存結果.trace.zip' });
}"
```

**出力先:** `test-results/{timestamp}_{案件名}/traces/TC-X-Y_{scenario名}.trace.zip`

#### 方式B: セッション単位

テスト実行の最初に `tracing.start()`、最後に `tracing.stop()` で1ファイル。管理が楽。

```bash
# テスト開始時
playwright-cli run-code "async page => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });
}"

# ... 全シナリオ実行 ...

# テスト終了時
playwright-cli run-code "async page => {
  await page.context().tracing.stop({ path: 'test-results/202602160300_案件名/trace.zip' });
}"
```

**出力先:** `test-results/{timestamp}_{案件名}/trace.zip`

#### 閲覧方法

```bash
npx playwright show-trace test-results/202602160300_案件名/traces/TC-6-3_APIエラー表示.trace.zip
# または
npx playwright show-trace test-results/202602160300_案件名/trace.zip
```

#### 比較表

| | シナリオ単位 | セッション単位 |
|---|---|---|
| ファイル数 | シナリオ数と同じ（例: 47個） | 1個 |
| FAIL調査 | 該当ファイルを直接開ける | タイムラインから該当箇所を探す |
| 実装コスト | 各シナリオ前後でstart/stop | テスト開始/終了の2回だけ |
| ファイルサイズ | 個々は小さい | 1ファイルが大きい |

## 6. セッション管理

### 案件ごとに名前付きセッションを使う（必須）

複数の案件（テストスイート）を同時に実行する場合、**必ず案件ごとに名前付きセッション (`-s=`) を使う**。`default` セッションの共有は禁止。

```bash
# 良い例: 案件ごとにセッションを分離
playwright-cli -s=customItem open https://example.com   # カスタム項目テスト用
playwright-cli -s=driver open https://example.com        # ドライバーマスタテスト用

# 悪い例: default セッションを共有（干渉する）
playwright-cli open https://example.com
```

**理由:**
- 同一セッション内では route 設定・ページ遷移・スナップショットが共有され干渉する
- 別セッションなら完全に独立したブラウザで動作するため安全

**セッション名の規則:**
- 案件フォルダ名から簡潔な英字名を付ける（例: `customItem`, `driver`, `paymentCondition`）
- 単一案件のみ実行する場合でも名前付きセッションを使う

**全コマンドにセッション指定が必要:**
```bash
playwright-cli -s=customItem snapshot
playwright-cli -s=customItem click e5
playwright-cli -s=customItem screenshot --filename=path/to/file.png
playwright-cli -s=customItem run-code "async page => { ... }"
playwright-cli -s=customItem close
```

### セッション操作前の確認（必須）

`close` や `close-all` を実行する前に、**必ず `playwright-cli list` で稼働中セッションを確認する**。他の案件が使用中のセッションを誤って閉じないこと。

```bash
# 必ず先に確認
playwright-cli list

# 自分のセッションだけを閉じる
playwright-cli -s=customItem close
```

### クラッシュ対策

- `run-code` で複雑な操作（`page.goto` + `route` の組み合わせ等）を行うとセッションがクラッシュすることがある
- クラッシュ時は `playwright-cli -s={セッション名} open` で再起動し、ログインからやり直す
- 長時間テストではセッション切れが起こり得るため、定期的に `snapshot` で生存確認する

## 7. ファイル出力先の注意

### YAML・ログ等の中間ファイルは必ず `.playwright-cli/` に配置する

playwright-cli が生成するページスナップショット（`.yml`）、コンソールログ（`.log`）、ネットワークログ等の中間ファイルは **すべて `.playwright-cli/` ディレクトリ内** に出力される。

**注意: プロジェクトルート直下や `test-suites/` 配下に YAML ファイルを出力してはならない。**

万が一ルート等に `page-*.yml` や `console-*.log` が生成された場合は、業務データと混在するリスクがあるため即座に削除すること。

```bash
# 誤配置チェック（プロジェクトルートに page-*.yml がないか確認）
ls *.yml 2>/dev/null && echo "WARNING: YAMLファイルがルートに存在します"
```

**スクリーンショットの出力先:**
- テスト結果のスクリーンショット → `test-results/{timestamp}_{案件名}/`
- 一時的なデバッグ用スクリーンショット → `.playwright-cli/` 内

`run-code` 内で `page.screenshot()` を使う際は、必ずパスを `test-results/` または `.playwright-cli/` 配下に指定する。相対パスで `screenshot.png` のようにルート直下に出力しないこと。

## 8. 画面固有の操作メモ（テスト実施後に追記）

テスト実施で判明した画面固有の注意点は、テストスイートのルールファイルにまとめる。

記載すべき項目:
- ダイアログ/モーダル内の同名ボタンの区別方法（`.nth()` の使用）
- 検索条件のリセット方法（URLパラメータの扱い）
- ファイルアップロードの形式（CSV/XLSX等の実際の形式）
- 一覧操作と個別画面操作の違い（例: 一括削除の有無）
