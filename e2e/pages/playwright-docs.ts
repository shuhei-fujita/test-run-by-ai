import { type Page, type Locator } from "@playwright/test";

export class PlaywrightDocsPage {
  readonly searchButton: Locator;
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.searchInput = page.getByPlaceholder("Search docs");
  }

  async goto() {
    await this.page.goto("https://playwright.dev");
  }

  async search(query: string) {
    await this.searchButton.click();
    await this.searchInput.fill(query);
  }

  resultLinks(name: RegExp) {
    return this.page.getByRole("link", { name });
  }
}
