import { test, expect, Page } from "@playwright/test";
import process from "process";

export const testAssetsPath = process.cwd().includes("packages")
  ? "tests/fixtures/" // for nx
  : "packages/studio-web/tests/fixtures/"; //for vscode
export const testText = `This is a test.
Sentence.

Paragraph.


Page.`;
export const testMp3Path =
  testAssetsPath + "test-sentence-paragraph-page-56k.mp3";
/**
 * Steps to recreate a readalong for tests
 */
export const testMakeAReadAlong = async (page: Page) => {
  await test.step("generate the readalong", async () => {
    await page.getByTestId("ras-text-input").fill(testText);

    await page
      .getByTestId("audio-btn-group")
      .getByRole("button", { name: "File" })
      .click();
    await page.getByTestId("ras-audio-fileselector").click({ force: true });
    await page.getByTestId("ras-audio-fileselector").setInputFiles(testMp3Path);
    await expect(async () => {
      await expect(
        page.getByTestId("next-step"),
        "model is loaded",
      ).not.toBeDisabled();

      //create the readalong
      await page.getByTestId("next-step").click();
    }).toPass();

    //wait for edit page to load
    await expect(async () => {
      await expect(page.getByTestId("ra-header")).toBeVisible({
        timeout: 0,
      });
      await expect(page.getByTestId("ra-header")).toBeEditable();
      //edit the headers

      await page
        .getByTestId("ra-header")
        .fill("Sentence Paragraph Page", { force: true });

      await expect(page.getByTestId("ra-header")).toHaveValue(
        "Sentence Paragraph Page",
      );
    }).toPass();

    await page
      .getByTestId("ra-subheader")
      .fill("by me", { force: true, timeout: 0 });

    //add translations

    await page
      .locator("#t0b0d0p0s0")
      .getByRole("button")
      .click({ force: true, timeout: 0 });

    await page
      .locator("#t0b0d0p0s1")
      .getByRole("button")
      .click({ force: true, timeout: 0 });
    await page
      .locator("#t0b0d0p1s0")
      .getByRole("button")
      .click({ force: true, timeout: 0 });
    //update translations

    await page
      .locator("#t0b0d0p0s0translation")
      .fill("Ceci est un test.", { force: true, timeout: 0 });

    await page
      .locator("#t0b0d0p0s1translation")
      .fill("Phrase.", { force: true, timeout: 0 });

    await page
      .locator("#t0b0d0p1s0translation")
      .fill("Paragraphe.", { force: true, timeout: 0 });

    //upload a photo to page 1
    let fileChooserPromise = page.waitForEvent("filechooser");
    page.locator("#fileElem--t0b0d0").dispatchEvent("click");

    let fileChooser = await fileChooserPromise;
    fileChooser.setFiles(testAssetsPath + "page1.png");

    await page.locator("#t0b0d0p0s0w0").dispatchEvent("click");
    //upload a photo to page 2
    fileChooserPromise = page.waitForEvent("filechooser");
    page.locator("#fileElem--t0b0d1").dispatchEvent("click");
    fileChooser = await fileChooserPromise;
    fileChooser.setFiles(testAssetsPath + "page2.png");
  });
};

/* default before each */
export const defaultBeforeEach = async (page: Page, browserName: string) => {
  test.step("setup test", async () => {
    test.skip(
      browserName === "webkit",
      "The aligner feature is not stable for webkit",
    );
    //await page.coverage.startJSCoverage();

    await page.goto("/", { waitUntil: "load" });
    await expect(
      page.getByTestId("next-step"),
      "Soundswallower model has loaded",
    ).not.toBeDisabled();
  });
};

/*test.afterEach(async ({ page }) => {
    const coverage = await page.coverage.stopJSCoverage();
    for (const entry of coverage) {
      if (entry.source) {
        const converter = v8toIstanbul("", 0, { source: entry.source });
        await converter.load();
        converter.applyCoverage(entry.functions);
        console.log(JSON.stringify(converter.toIstanbul()));
      }
    }
  });*/
