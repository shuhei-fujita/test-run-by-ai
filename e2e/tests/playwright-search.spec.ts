import { test, expect } from "@playwright/test";
import { PlaywrightDocsPage } from "../pages/playwright-docs";

// Feature: Playwrightドキュメント検索
//   Playwrightの公式サイトで検索機能が正しく動作することを確認する

test("ドキュメントサイトで locator を検索する", async ({ page }) => {
  const docs = new PlaywrightDocsPage(page);

  // Given ブラウザで "https://playwright.dev" を開く
  await docs.goto();

  // When 検索ボックスに "locator" と入力する
  await docs.search("locator");

  // Then "locator" に関連する検索結果が表示される
  await expect(docs.resultLinks(/locator/i).first()).toBeVisible();
});
