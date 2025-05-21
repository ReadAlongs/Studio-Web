import { test, expect } from "@playwright/test";
import { editorDefaultBeforeEach } from "../test-commands";
import fs from "fs";
import JSZip from "jszip";
test.describe.configure({ mode: "parallel" });

test("should edit alignment and words (editor)", async ({ page, isMobile }) => {
  await expect(async () => {
    await editorDefaultBeforeEach(page, isMobile);
  }).toPass();
  await page.locator("#t0b0d0p0s0").waitFor({ state: "visible" });
  //first handle
  const handle = await page.getByTitle("-1.070").locator("handle").first();
  await handle.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 50);

  const segment = await page.getByTitle("0.840-1.070");
  await segment.click();
  await page.locator("#wavesurferContainer").hover();
  if (isMobile) {
    console.log("scrolling for mobile");
    await page.mouse.wheel(-130, 0);
  }
  await expect(handle, "handle bar should be in view").toBeVisible();
  const segBoxPreChange = await segment.boundingBox();
  //move the handle to the left to about 0.5
  await handle.hover();
  await page.mouse.down();
  if (segBoxPreChange)
    await page.mouse.move(segBoxPreChange.x - 100, segBoxPreChange.y);
  await page.mouse.up();

  //validate the new segment width

  const segBoxPostChange = await page
    .locator("segment.wavesurfer-segment")
    .first()
    .boundingBox();
  if (segBoxPostChange && segBoxPreChange)
    expect(
      segBoxPostChange.width,
      "should be wider than the original segment",
    ).toBeGreaterThan(segBoxPreChange.width);
  await page.locator("segment.wavesurfer-segment").first().click();
  await expect(
    page.getByTitle("-2.360").locator("div"),
    "should contain word `Sentence`",
  ).toContainText("Sentence");

  const text = await page.getByTitle("-2.360").locator("div");
  await text.scrollIntoViewIfNeeded();
  await text.click();
  await text.fill("Sentences");
  await expect(
    page.getByTitle("-2.360").locator("div"),
    "should now contain word `Sentences`",
  ).toContainText("Sentences");

  const newStartTime = await page
    .locator("segment.wavesurfer-segment")
    .first()
    .evaluate((seg) => (seg as HTMLElement).title.substring(0, 4));

  //check web bundle output
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "Web Bundle" }).click();
  let downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  let download = await downloadPromise;
  await expect(
    download.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/sentence\-paragr\-[0-9]*\.zip/);

  const zipPath = await download.path();
  const zipBin = await fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipBin);
  const readalongContent = await zip
    .file(/www\/assets\/sentence\-paragr\-[0-9]*\.readalong/)[0]
    .async("string");
  await expect(
    readalongContent,
    "readalong file should reflect new spelling",
  ).toMatch(/>Sentences</);
  await expect
    .soft(
      readalongContent,
      "readalong file should reflect new alignment start time" + newStartTime,
    )
    .toMatch(new RegExp(`time="${newStartTime.replace(".", "\\.")}\\d+" `));

  //check SRT
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "SRT Subtitles" }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  download = await downloadPromise;
  let filePath = await download.path();
  let fileData = await fs.readFileSync(filePath, {
    encoding: "utf8",
    flag: "r",
  });
  await expect(fileData, "SRT file should reflect new spelling").toMatch(
    /Sentences/,
  );
  await expect
    .soft(
      fileData,
      "SRT file should reflect new alignment start time " + newStartTime,
    )
    .toMatch(new RegExp(`${newStartTime.replace(".", ",")}\\d+\\s-->`));
  //check WEBVTT
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "WebVTT Subtitles" }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  download = await downloadPromise;
  filePath = await download.path();
  fileData = await fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  await expect(fileData, "WEBVTT file should reflect new spelling").toMatch(
    /Sentences/,
  );
  await expect
    .soft(
      fileData,
      "WEBVTT file should reflect new alignment start time " + newStartTime,
    )
    .toMatch(new RegExp(`${newStartTime.replace(".", "\\.")}\\d+\\s-->`));
  //check PRAAT
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "Praat TextGrid" }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  download = await downloadPromise;
  filePath = await download.path();
  fileData = await fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  await expect(fileData, "PRAAT file should reflect new spelling").toMatch(
    /text = "Sentences"/,
  );
  await expect
    .soft(
      fileData,
      "PRAAT file should reflect new alignment start time " + newStartTime,
    )
    .toMatch(
      new RegExp(`xmin\\s=\\s${newStartTime.replace(".", "\\.")}\\d+\\\s`),
    );
  //check elan
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "Elan File" }).click();
  downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  download = await downloadPromise;
  filePath = await download.path();
  fileData = await fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  await expect(fileData, "ELAN file should reflect new spelling").toMatch(
    /<ANNOTATION_VALUE>Sentences<\/ANNOTATION_VALUE>/,
  );
  await expect
    .soft(
      fileData,
      "ELAN file should reflect new alignment start time " + newStartTime,
    )
    .toMatch(new RegExp(`TIME_VALUE="${newStartTime.substring(2)}\\d+" `));
});
