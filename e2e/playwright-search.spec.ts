import { test, expect } from "@playwright/test";

// Feature: Playwrightドキュメント検索
//   Playwrightの公式サイトで検索機能が正しく動作することを確認する

test("ドキュメントサイトで locator を検索する", async ({ page }) => {
  // Given ブラウザで "https://playwright.dev" を開く
  await page.goto("https://playwright.dev");

  // When 検索ボタンをクリックする
  await page.getByRole("button", { name: "Search" }).click();

  // And 検索ボックスに "locator" と入力する
  await page.getByPlaceholder("Search docs").fill("locator");

  // Then "locator" に関連する検索結果が表示される
  const results = page.getByRole("link", { name: /locator/i });
  await expect(results.first()).toBeVisible();
});
