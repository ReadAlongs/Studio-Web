import { test, expect, Page } from "@playwright/test";
//import v8toIstanbul from "v8-to-istanbul";
import fs from "fs";
import JSZip from "jszip";

//for vscode
//const assetsPath = "packages/studio-web/tests/fixtures/";
//for nx
const assetsPath = "tests/fixtures/";
const text = `This is a test.
Sentence.

Paragraph.


Page.`;
const mp3Path = assetsPath + "test-sentence-paragraph-page-56k.mp3";
/**
 * Steps to recreate a readalong for tests
 */
const makeAReadAlong = async (page: Page) => {
  await test.step("generate the readalong", async () => {
    await page.getByTestId("ras-text-input").fill(text);

    await page
      .getByTestId("audio-btn-group")
      .getByRole("button", { name: "File" })
      .click();
    await page.getByTestId("ras-audio-fileselector").click({ force: true });
    await page.getByTestId("ras-audio-fileselector").setInputFiles(mp3Path);

    //create the readalong
    await page.getByTestId("next-step").click({ force: true });

    //wait for edit page to load
    await expect(page.getByTestId("ra-header")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("ra-header")).toBeEditable();
    //edit the headers

    await page
      .getByTestId("ra-header")
      .fill("Sentence Paragraph Page", { force: true });
    await expect(page.getByTestId("ra-header")).toHaveValue(
      "Sentence Paragraph Page",
    );

    await page
      .getByTestId("ra-subheader")
      .fill("by me", { force: true, timeout: 500 });

    //add translations

    await page
      .locator("#t0b0d0p0s0")
      .getByRole("button")
      .click({ force: true, timeout: 550 });

    await page
      .locator("#t0b0d0p0s1")
      .getByRole("button")
      .click({ force: true, timeout: 550 });
    await page
      .locator("#t0b0d0p1s0")
      .getByRole("button")
      .click({ force: true, timeout: 550 });
    //update translations

    await page
      .locator("#t0b0d0p0s0translation")
      .fill("Ceci est un test.", { force: true, timeout: 550 });

    await page
      .locator("#t0b0d0p0s1translation")
      .fill("Phrase.", { force: true, timeout: 550 });

    await page
      .locator("#t0b0d0p1s0translation")
      .fill("Paragraphe.", { force: true, timeout: 550 });

    //upload a photo to page 1
    let fileChooserPromise = page.waitForEvent("filechooser");
    page.locator("#fileElem--t0b0d0").dispatchEvent("click");

    let fileChooser = await fileChooserPromise;
    fileChooser.setFiles(assetsPath + "page1.png");

    await page.locator("#t0b0d0p0s0w0").dispatchEvent("click");
    //upload a photo to page 2
    fileChooserPromise = page.waitForEvent("filechooser");
    page.locator("#fileElem--t0b0d1").dispatchEvent("click");
    fileChooser = await fileChooserPromise;
    fileChooser.setFiles(assetsPath + "page2.png");
  });
};

test.describe("test studio UI & UX", () => {
  test.beforeEach(async ({ page }) => {
    //await page.coverage.startJSCoverage();
    await page.goto("/");
  });
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
  test("should check UI", async ({ page }) => {
    //tour button is visible
    await expect(page.getByText("Take the tour!")).toBeVisible();
    //check text button group
    await expect(page.getByTestId("text-btn-group")).toBeVisible();
    //check audio button group
    await expect(page.getByTestId("audio-btn-group")).toBeVisible();
    //check the language list
    await expect(page.getByTestId("language-list")).toBeDisabled();
    await page
      .getByRole("radio", { name: "Select a specific language" })
      .check();
    await expect(page.getByTestId("language-list")).toBeEnabled();
  });
  test("should test tour UX", async ({ page }) => {
    await page.getByRole("button", { name: "Take the tour!" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Next (overwrites your data)" })
      .click();
    await expect(
      page.getByRole("button", { name: "Next (overwrites your data)" }),
    ).toHaveCount(0, { timeout: 35000 });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Finish" }).click();
  });

  test.describe("test readalong generation", () => {
    test("should input and save text", async ({ page }) => {
      await expect(page.getByTestId("text-download-btn")).toBeDisabled();
      await page.getByTestId("ras-text-input").fill(text);
      await expect(page.getByTestId("text-download-btn")).toBeEnabled();

      const download2Promise = page.waitForEvent("download");
      await page.getByTestId("text-download-btn").click();
      const download2 = await download2Promise;
      await expect(
        download2.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/ras-text-\d+\.txt/);
    });
    test("should make read along", async ({ page }) => {
      //fill in text and audio
      await page.getByTestId("ras-text-input").fill(text);
      await expect(page.getByTestId("text-download-btn")).toBeVisible();
      await page
        .getByTestId("audio-btn-group")
        .getByRole("button", { name: "File" })
        .click();
      await page.getByTestId("ras-audio-fileselector").click();
      await page.getByTestId("ras-audio-fileselector").setInputFiles(mp3Path);
      await expect(page.getByLabel("Play")).toBeVisible();
      await expect(page.getByLabel("Audio save button")).toBeVisible();
      await expect(page.getByLabel("Delete")).toBeVisible();
      //create the readalong
      await page.getByTestId("next-step").click();
      //edit the headers
      await expect(page.getByTestId("ra-header")).toHaveValue("Title");
      await expect(page.getByTestId("ra-header")).toBeEditable();
      await page.getByTestId("ra-header").dblclick();
      await page.getByTestId("ra-header").fill("Sentence Paragraph Page");
      await expect(page.getByTestId("ra-header")).toHaveValue(
        "Sentence Paragraph Page",
      );
      await expect(page.getByTestId("ra-subheader")).toHaveValue("Subtitle");
      await expect(page.getByTestId("ra-subheader")).toBeEditable();
      await page.getByTestId("ra-subheader").click();
      await page.getByTestId("ra-subheader").dblclick();
      await page.getByTestId("ra-subheader").fill("by me");
      await expect(page.getByTestId("ra-subheader")).toHaveValue("by me");
      //add translations
      await expect(
        page.locator("#t0b0d0p0s0").getByLabel("Add translation"),
      ).toBeVisible();
      await page.locator("#t0b0d0p0s0").getByRole("button").click();
      await expect(
        page.locator("#t0b0d0p0s0").getByLabel("Remove translation"),
      ).toBeVisible();
      await expect(
        page.locator("#t0b0d0p0s0").getByLabel("Add translation"),
      ).toBeHidden(); //check
      await page.locator("#t0b0d0p0s1").getByRole("button").click();
      await page.locator("#t0b0d0p1s0").getByRole("button").click();
      //update translations
      let translation = await page.locator("#t0b0d0p0s0translation");
      await translation.click();
      await expect(translation).toBeEditable();
      await translation.fill("Ceci est un test.");

      translation = await page.locator("#t0b0d0p0s1translation");
      await translation.click();
      await translation.fill("Phrase.");

      translation = await page.locator("#t0b0d0p1s0translation");
      await translation.click();
      await translation.fill("Paragraphe.");
      await expect(page.locator(".editable__translation")).toHaveCount(3);
      // delete a translation
      await page.locator("#t0b0d0p0s1").getByRole("button").click();
      await expect(page.locator(".editable__translation")).toHaveCount(2);
      await page.locator("#t0b0d0p1s0").getByRole("button").click();
      await expect(
        page.locator(".editable__translation").first(),
      ).toBeVisible();
      await page.getByTestId("translation-toggle").click();
      await expect(page.locator(".editable__translation").first()).toBeHidden();
      //upload a photo to page 1
      let fileChooserPromise = page.waitForEvent("filechooser");
      page.locator("#fileElem--t0b0d0").dispatchEvent("click");

      let fileChooser = await fileChooserPromise;
      fileChooser.setFiles(assetsPath + "page1.png");
      //delete the photo uploaded
      await page.getByTestId("delete-button").click();
      await page.locator("#t0b0d0p0s0w0").click();
      //upload a photo to page 2
      fileChooserPromise = page.waitForEvent("filechooser");
      page.locator("#fileElem--t0b0d1").dispatchEvent("click");

      fileChooser = await fileChooserPromise;
      fileChooser.setFiles(assetsPath + "page2.png");
      await page.getByRole("tab", { name: "Editable Step" }).click();
    });
    test("should Download default (single file format)", async ({ page }) => {
      await makeAReadAlong(page);
      //download default
      const downloadPromise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download = await downloadPromise;
      await expect(
        download.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/sentence\-paragr\-[0-9]*\.html/);
    });
    test("should Download web bundle (zip file format)", async ({ page }) => {
      await makeAReadAlong(page);
      //download web bundle
      await page.getByLabel("2Step").locator("svg").click();
      await page.locator(".cdk-overlay-backdrop").click();
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "Web Bundle" }).click();
      const download1Promise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download1 = await download1Promise;
      await expect(
        download1.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/sentence\-paragr\-[0-9]*\.zip/);
      //await download1.saveAs(assetsPath + download1.suggestedFilename());
      const zipPath = await download1.path();
      const zipBin = await fs.readFileSync(zipPath);
      const zip = await JSZip.loadAsync(zipBin);
      await expect(
        zip.folder(/Offline-HTML/),
        "should have Offline-HTML folder",
      ).toHaveLength(1); //Offline-HTML folder exists
      await expect(
        zip.file(/Offline-HTML\/sentence\-paragr\-[0-9]*\.html/),
        "should have Offline-HTML file",
      ).toHaveLength(1); //Offline-HTML folder exists
      await expect(
        zip.folder(/www/).length,
        "should have www folder",
      ).toBeGreaterThan(1); //www folder exists
      await expect(
        zip.folder(/www\/assets/),
        "should have assets folder",
      ).toHaveLength(1); //www/assets folder exists
      await expect(
        zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.readalong/),
        "should have readalong file",
      ).toHaveLength(1); //www/assets readalong exists
      await expect(
        zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.wav/),
        "should have wav file",
      ).toHaveLength(1); //www/assets audio exists
      await expect(
        zip.file(/www\/assets\/image-sentence\-paragr\-[0-9\-]*\.png/),
        "should have image files",
      ).toHaveLength(2); //www/assets image exists
      await expect(
        zip.file(/www\/sentence\-paragr\-[0-9]*\.txt/),
        "should have readalong plain text file",
      ).toHaveLength(1); //www/ readalong text exists
      await expect(
        zip.file(/www\/readme.txt/),
        "should have readme file",
      ).toHaveLength(1); //www/ readme text exists
      await expect(
        zip.file(/www\/index.html/),
        "should have index file",
      ).toHaveLength(1); //www/index.html  exists
    });

    test("should Download ELAN ( file format)", async ({ page }) => {
      await makeAReadAlong(page);
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "Elan File" }).click();
      const download2Promise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download2 = await download2Promise;
      await expect(
        download2.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/readalong\.eaf/);
    });

    test("should Download Praat ( file format)", async ({ page }) => {
      await makeAReadAlong(page);
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "Praat TextGrid" }).click();
      const download2Promise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download2 = await download2Promise;
      await expect(
        download2.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/readalong\.textgrid/);
    });
    test("should Download SRT ( file format)", async ({ page }) => {
      await makeAReadAlong(page);
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "SRT Subtitles" }).click();
      const download2Promise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download2 = await download2Promise;
      await expect(
        download2.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/readalong\.srt/);
    });
    test("should Download WebVTT ( file format)", async ({ page }) => {
      await makeAReadAlong(page);
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "WebVTT Subtitles" }).click();
      const download2Promise = page.waitForEvent("download");
      await page.getByTestId("download-ras").click();
      const download2 = await download2Promise;
      await expect(
        download2.suggestedFilename(),
        "should have the expected filename",
      ).toMatch(/readalong\.vtt/);
    });
  });
});
