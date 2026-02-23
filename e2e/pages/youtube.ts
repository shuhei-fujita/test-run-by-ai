import { type Page, type Locator } from "@playwright/test";

export class YouTubePage {
  readonly searchBox: Locator;
  readonly firstThumbnail: Locator;
  readonly firstVideoTitle: Locator;
  readonly watchTitle: Locator;

  constructor(private page: Page) {
    this.searchBox = page
      .getByRole("searchbox", { name: /search/i })
      .or(page.locator('input[name="search_query"]'));
    this.firstThumbnail = page
      .locator("ytd-video-renderer")
      .first()
      .or(page.locator("ytm-video-with-context-renderer").first());
    this.firstVideoTitle = page
      .locator("ytd-video-renderer a#video-title")
      .first()
      .or(page.locator("ytm-video-with-context-renderer a").first());
    this.watchTitle = page.locator("#above-the-fold h1").first();
  }

  async goto() {
    await this.page.goto("https://www.youtube.com/");
  }

  async search(query: string) {
    await this.searchBox.fill(query);
    await this.searchBox.press("Enter");
  }

  async clickFirstVideo() {
    await this.firstVideoTitle.waitFor({ state: "visible" });
    await this.firstVideoTitle.click();
  }
}
