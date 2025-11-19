import { test, expect } from "@playwright/test";
import {
  testText,
  testMp3Path,
  testAssetsPath,
  defaultBeforeEach,
} from "../test-commands";

test("should make read along", async ({ page, browserName }) => {
  test.slow();
  await defaultBeforeEach(page, browserName);
  //fill in text and audio
  await page.getByTestId("ras-text-input").fill(testText);
  await expect(page.getByTestId("text-download-btn")).toBeVisible();
  await page
    .getByTestId("audio-btn-group")
    .getByRole("radio", { name: "File" })
    .click();
  await page.getByTestId("ras-audio-fileselector").click();
  await page.getByTestId("ras-audio-fileselector").setInputFiles(testMp3Path);
  await expect(page.getByLabel("Play")).toBeVisible();
  await expect(page.getByLabel("Audio save button")).toBeVisible();
  await expect(
    page.getByTestId("ras-audio-fileselector-delete-btn"),
  ).toBeVisible();

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
  await expect(page.locator(".editable__translation").first()).toBeVisible();
  await page.getByTestId("translation-toggle").click();
  await expect(page.locator(".editable__translation").first()).toBeHidden();
  //upload a photo to page 1
  let fileChooserPromise = page.waitForEvent("filechooser");
  page.locator("#fileElem--t0b0d0").dispatchEvent("click");

  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "page1.png");
  //delete the photo uploaded
  await page.getByTestId("delete-button").click();
  await page.locator("#t0b0d0p0s0w0").click();
  //upload a photo to page 2
  fileChooserPromise = page.waitForEvent("filechooser");
  page.locator("#fileElem--t0b0d1").dispatchEvent("click");

  fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "page2.png");
  await page.getByRole("tab", { name: "Editable Step" }).click();
});

test("should show g2p text error", async ({ page, browserName }) => {
  await defaultBeforeEach(page, browserName);
  await page
    .getByTestId("ras-text-input")
    .fill(
      "Staff on the Caledonian Sleeper will hold two 24-hour strikes. One from 11:59 on Sunday 31 October and one on Thursday 11 November.",
    );

  await expect(page.getByTestId("text-download-btn")).toBeVisible();
  await page
    .getByTestId("audio-btn-group")
    .getByRole("radio", { name: "File" })
    .click();
  await page.getByTestId("ras-audio-fileselector").click();
  await page
    .getByTestId("ras-audio-fileselector")
    .setInputFiles(
      testMp3Path.replace(
        "test-sentence-paragraph-page-56k",
        "bbc_text_tts_nihalgazi_alloy",
      ),
    );
  const responsePromise = page.waitForResponse("**/api/v1/assemble");
  await page.getByTestId("next-step").click();
  await responsePromise;

  await expect(
    page.locator("g2p-error"),
    "should show G2P error box",
  ).toBeVisible();
  await expect(
    page.locator("g2p-error .text-danger").first(),
    "should have highlighted 24",
  ).toContainText("24");
});
