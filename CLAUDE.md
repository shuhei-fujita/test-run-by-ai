# プロジェクトルール

## テストID運用ルール

- テストID（`@TC-X-Y`）は **必ずシナリオ名とセットで表記する**。ID単独での使用は禁止
  - 例: `TC-1-3: カテゴリフィルター(技術)の適用` / `TC-1-3_カテゴリフィルター(技術)の適用.png`
  - NG: `TC-1-3` だけ、`01_検索結果.png` のような連番プレフィックス

## playwright-cli テスト実行ルール

### テスト結果の保存

- 結果は `test-results/{YYYYMMDDHHmm}_{テストスイート名}/` に保存する
  - 例: `test-results/202602142307_youtube-search/`
- スクリーンショットのファイル名は `TC-X-Y_{scenario名}.png` とする
  - 例: `TC-1-3_カテゴリフィルター(技術)の適用.png`
  - テストIDがないシナリオは `{scenario名}.png` のままでよい
- テストスイート名はファイル名（拡張子なし）を使う

### テストシナリオ

- テストシナリオは `test-suites/{案件名}/` フォルダに `.md` 形式で配置する
- テストデータ（CSV等）も同じフォルダに配置する
- 実行は `/playwright-cli @test-suites/{案件名}/{ファイル名}.md` で行う

### 環境変数

- グローバルのデフォルト値はルートの `.env` に定義する
- 案件固有の環境変数は `test-suites/{案件名}/.env` に定義し、ルートの値を上書きする
- テスト実行時は案件フォルダの `.env` → ルート `.env` の優先順位で読み込む

### テスト実行ワークフロー

1. テスト設計を `test-suites/{案件名}/test_suite.md` に配置
2. `/plan-test {案件名}` でテスト計画を生成（`task.md`）
3. `/playwright-cli @test-suites/{案件名}/test_suite.md` でテスト実行
4. `/plan-test {案件名}` で進捗確認・HITL
5. 全シナリオ完了後、`task.md` が最終結果レポートになる

詳細ルール: `.claude/rules/test-workflow.md`
