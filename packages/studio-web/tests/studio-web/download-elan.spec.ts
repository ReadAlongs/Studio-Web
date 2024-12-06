import { test, expect } from "@playwright/test";
import { testMakeAReadAlong, defaultBeforeEach } from "../test-commands";

test("should Download ELAN ( file format)", async ({ page, browserName }) => {
  await defaultBeforeEach(page, browserName);
  await testMakeAReadAlong(page);

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
