import { test, expect } from "@playwright/test";

// Feature: YouTube動画検索
//   YouTubeで検索機能が正しく動作することを確認する
//
// NOTE: YouTube はロボット検知でブロックされる場合がある。
// CI で常時失敗する場合は test.skip に切り替えること。

test.describe("YouTube動画検索", () => {
  // @TC-1-1 @P0
  test("TC-1-1: トップページから動画を検索する", async ({ page }) => {
    // Given ブラウザで "https://www.youtube.com/" を開く
    await page.goto("https://www.youtube.com/");

    // When 検索ボックスに "Playwright tutorial" と入力する
    const searchBox = page
      .getByRole("searchbox", { name: /search/i })
      .or(page.locator('input[name="search_query"]'));
    await searchBox.fill("Playwright tutorial");

    // And Enterキーを押して検索を実行する
    await searchBox.press("Enter");

    // Then 検索結果ページに遷移する
    await expect(page).toHaveURL(/search_query/);

    // And 動画のサムネイルが一覧表示される
    const thumbnail = page
      .locator("ytd-video-renderer")
      .first()
      .or(page.locator("ytm-video-with-context-renderer").first());
    await expect(thumbnail).toBeVisible();
  });

  // @TC-1-2 @P0
  test("TC-1-2: 検索結果から動画ページに遷移する", async ({ page }) => {
    // CI ヘッドレス環境では YouTube の動画ページタイトルが hidden のまま表示されないためスキップ
    test.skip(!!process.env.CI, "YouTube watch page title hidden in CI headless");

    // Given ブラウザで "https://www.youtube.com/" を開く
    await page.goto("https://www.youtube.com/");

    // When 検索ボックスに "Playwright tutorial" と入力する
    const searchBox = page
      .getByRole("searchbox", { name: /search/i })
      .or(page.locator('input[name="search_query"]'));
    await searchBox.fill("Playwright tutorial");

    // And Enterキーを押して検索を実行する
    await searchBox.press("Enter");

    // And 検索結果の最初の動画をクリックする
    const firstVideo = page
      .locator("ytd-video-renderer a#video-title")
      .first()
      .or(page.locator("ytm-video-with-context-renderer a").first());
    await firstVideo.waitFor({ state: "visible" });
    await firstVideo.click();

    // Then 動画再生ページに遷移する
    await expect(page).toHaveURL(/watch/);

    // And 動画タイトルが表示される
    const title = page.locator("#above-the-fold h1").first();
    await expect(title).toBeVisible();
  });
});
