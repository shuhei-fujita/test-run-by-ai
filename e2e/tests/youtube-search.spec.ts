import { test, expect } from "@playwright/test";
import { YouTubePage } from "../pages/youtube";

// Feature: YouTube動画検索
//   YouTubeで検索機能が正しく動作することを確認する
//
// NOTE: YouTube はロボット検知でブロックされる場合がある。
// CI で常時失敗する場合は test.skip に切り替えること。

test.describe("YouTube動画検索", () => {
  // @TC-1-1 @P0
  test("TC-1-1: トップページから動画を検索する", async ({ page }) => {
    const youtube = new YouTubePage(page);

    // Given ブラウザで "https://www.youtube.com/" を開く
    await youtube.goto();

    // When 検索ボックスに "Playwright tutorial" と入力する
    // And Enterキーを押して検索を実行する
    await youtube.search("Playwright tutorial");

    // Then 検索結果ページに遷移する
    await expect(page).toHaveURL(/search_query/);

    // And 動画のサムネイルが一覧表示される
    await expect(youtube.firstThumbnail).toBeVisible();
  });

  // @TC-1-2 @P0
  test("TC-1-2: 検索結果から動画ページに遷移する", async ({ page }) => {
    test.skip(
      !!process.env.CI,
      "YouTube watch page title hidden in CI headless",
    );
    const youtube = new YouTubePage(page);

    // Given ブラウザで "https://www.youtube.com/" を開く
    await youtube.goto();

    // When 検索ボックスに "Playwright tutorial" と入力する
    // And Enterキーを押して検索を実行する
    await youtube.search("Playwright tutorial");

    // And 検索結果の最初の動画をクリックする
    await youtube.clickFirstVideo();

    // Then 動画再生ページに遷移する
    await expect(page).toHaveURL(/watch/);

    // And 動画タイトルが表示される
    await expect(youtube.watchTitle).toBeVisible();
  });
});
