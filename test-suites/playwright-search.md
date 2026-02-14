Feature: Playwrightドキュメント検索

  Playwrightの公式サイトで検索機能が正しく動作することを確認する

  Scenario: ドキュメントサイトで "locator" を検索する
    Given ブラウザで "https://playwright.dev" を開く
    When 検索ボタンをクリックする
    And 検索ボックスに "locator" と入力する
    Then "locator" に関連する検索結果が表示される
