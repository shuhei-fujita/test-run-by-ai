# プロジェクトルール

## playwright-cli テスト実行ルール

### テスト結果の保存

- 結果は `test-results/{YYYYMMDDHHmm}_{テストスイート名}/` に保存する
  - 例: `test-results/202602142307_youtube-search/`
- スクリーンショットのファイル名は `{scenario名}.png` とする
- テストスイート名はファイル名（拡張子なし）を使う

### テストシナリオ

- テストシナリオは `test-suites/` に `.md` 形式で配置する
- 実行は `/playwright-cli @test-suites/{ファイル名}.md` で行う
