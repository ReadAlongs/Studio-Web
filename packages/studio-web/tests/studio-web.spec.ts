import { test, expect } from "@playwright/test";
const assetsPath = "./tests/fixtures/";
const text = `This is a test.
Sentence.

Paragraph.


Page.`;
const mp3Path = assetsPath + "test-sentence-paragraph-page-56k.mp3";
test.describe("test studio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200");
  });
  test("check ui", async ({ page }) => {
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
  test("test tour", async ({ page }) => {
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

  test.describe("make a readalong", () => {
    test("text input/save", async ({ page }) => {
      await expect(page.getByTestId("text-download-btn")).toBeDisabled();
      await page.getByTestId("ras-text-input").fill(text);
      await expect(page.getByTestId("text-download-btn")).toBeEnabled();
      //const downloadPromise = page.waitForEvent("download");
      //await page.getByTestId("text-download-btn").click();
      //expect(downloadPromise).
    });
    test.only("make read along", async ({ page }) => {
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
      //create the readaloing
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
      let translation = page.locator("#t0b0d0p0s0translation");
      await translation.click();
      await expect(translation).toBeEditable();
      await translation.fill("Ceci est un test.");

      translation = page.locator("#t0b0d0p0s1translation");
      await translation.click();
      await translation.fill("Phrase.");

      translation = page.locator("#t0b0d0p1s0translation");
      await translation.click();
      await translation.fill("Paragraphe.");
      await expect(page.locator(".sentence__translation")).toHaveCount(3);
      // delete a translation
      await page.locator("#t0b0d0p0s1").getByRole("button").click();
      await expect(page.locator(".sentence__translation")).toHaveCount(2);
      await page.locator("#t0b0d0p1s0").getByRole("button").click();
      await expect(
        page.locator(".sentence__translation").first(),
      ).toBeVisible();
      await page.locator("[data-cy=translation-toggle]").click();
      await expect(page.locator(".sentence__translation").first()).toBeHidden();
      const fileChooserPromise = page.waitForEvent("filechooser");
      let fileChooser = await fileChooserPromise;
      fileChooser.setFiles(assetsPath + "page1.png");
      //TODO: change to test-id after 90db9c30e29ce209eb1397c774d9465d3d3983b6
      await page.locator("[data-cy=delete-button]").click();
      /*
      await page
        .locator("div")
        .filter({
          hasText:
            /^Page 2 \/ 2Upload an image for this pageChoose a filePage\.add$/,
        })
        .locator("label")
        .click();
      await page.locator("body").setInputFiles("page2.png");
      const downloadPromise = page.waitForEvent("download");
      await page.getByLabel("Example icon button with a").click();
      const download = await downloadPromise;
      await page.getByLabel("2Step").locator("svg").click();
      await page.locator(".cdk-overlay-backdrop").click();
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "Web Bundle" }).click();
      const download1Promise = page.waitForEvent("download");
      await page.getByLabel("Example icon button with a").click();
      const download1 = await download1Promise;
      await page.locator("#mat-select-value-3").click();
      await page.getByRole("option", { name: "Elan File" }).click();
      const download2Promise = page.waitForEvent("download");
      await page.getByLabel("Example icon button with a").click();
      const download2 = await download2Promise;
      await page.getByRole("tab", { name: "Editable Step" }).click();*/
    });
  });
});
