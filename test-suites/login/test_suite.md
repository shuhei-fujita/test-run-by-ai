Feature: ログイン機能

  ユーザーがアプリケーションにログインできることを確認する

  Scenario: 有効な認証情報でログインする
    Given ブラウザで "$TEST_BASE_URL/login" を開く
    When メールアドレス欄に "$TEST_USER_EMAIL" を入力する
    And パスワード欄に "$TEST_USER_PASSWORD" を入力する
    And ログインボタンをクリックする
    Then ダッシュボードページが表示される
    And 認証状態を "auth.json" に保存する

  Scenario: 保存済みの認証状態でログインをスキップする
    Given 認証状態 "auth.json" を読み込む
    When ブラウザで "$TEST_BASE_URL/dashboard" を開く
    Then ログイン画面にリダイレクトされずダッシュボードが表示される
