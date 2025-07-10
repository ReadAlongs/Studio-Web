import { test, expect } from "@playwright/test";
import { testMakeAReadAlong, defaultBeforeEach } from "../test-commands";
import { text } from "node:stream/consumers";
import { JSDOM } from "jsdom";

test("should Download default (single file format)", async ({
  page,
  browserName,
}) => {
  await expect(async () => {
    await defaultBeforeEach(page, browserName);
    await testMakeAReadAlong(page);
  }).toPass();
  //download default
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download = await downloadPromise;
  await expect(
    download.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/sentence\-paragr\-[0-9]*\.html/);

  //
  const reader = await download.createReadStream();
  const contentText = await text(reader);
  const dom = new JSDOM(contentText);
  const xmlString = dom.window.document
    .getElementsByTagName("read-along")[0]
    .getAttribute("href") as string;

  const resp = await fetch(xmlString);
  await expect(
    await resp.text(),
    "download file should contain XML declaration",
  ).toMatch(/^<\?xml/);
});
