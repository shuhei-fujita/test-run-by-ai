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

  @TC-1-2 @P0
  Scenario: 検索結果から動画ページに遷移する
    Given ブラウザで "https://www.youtube.com/" を開く
    When 検索ボックスに "Playwright tutorial" と入力する
    And Enterキーを押して検索を実行する
    And 検索結果の最初の動画をクリックする
    Then 動画再生ページに遷移する
    And 動画タイトルが表示される
    And スクリーンショットを撮影する
