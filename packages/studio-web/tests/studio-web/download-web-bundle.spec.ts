import { test, expect } from "@playwright/test";
import {
  testMakeAReadAlong,
  defaultBeforeEach,
  testAssetsPath,
} from "../test-commands";
import fs from "fs";
import JSZip from "jszip";

test("should Download web bundle (zip file format)", async ({
  page,
  browserName,
}) => {
  test.slow();

  await defaultBeforeEach(page, browserName);
  await testMakeAReadAlong(page);
  //add custom style
  await page.getByRole("button", { name: "File" }).click();
  await page
    .locator("#updateStyle")
    .setInputFiles(`${testAssetsPath}/sentence-paragr-cust-css.css`);
  await expect(
    page
      .locator('[data-test-id="text-container"]')
      .getByText("This", { exact: true }),
    "check the color of the text",
  ).toHaveCSS("color", "rgba(80, 70, 70, 0.9)");
  //download web bundle
  await page.getByLabel("2Step").locator("svg").click();
  await page.locator(".cdk-overlay-backdrop").click();
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "Web Bundle" }).click();
  const download1Promise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download1 = await download1Promise;
  await expect(
    download1.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/sentence\-paragr\-[0-9]*\.zip/);
  //await download1.saveAs(testAssetsPath + download1.suggestedFilename());
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
    zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.css/),
    "should have stylesheet file",
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

  const xmlString = await zip
    .file(/www\/assets\/sentence\-paragr\-[0-9]*\.readalong/)[0]
    .async("text");
  await expect(
    xmlString,
    "download file should contain XML declaration",
  ).toMatch(/^<\?xml/);
});
