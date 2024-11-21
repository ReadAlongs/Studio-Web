import { test, expect } from "@playwright/test";
import { testMakeAReadAlong, defaultBeforeEach } from "../test-commands";

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
});
