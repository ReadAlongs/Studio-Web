import { test, expect } from "@playwright/test";
import {
  testMakeAReadAlong,
  defaultBeforeEach,
  testAssetsPath,
} from "../test-commands";
import fs from "fs";

test("should Download WebVTT ( file format)", async ({ page, browserName }) => {
  test.slow();

  await defaultBeforeEach(page, browserName);
  await testMakeAReadAlong(page);

  await page.locator("#mat-select-value-3").click();
  await page.getByRole("option", { name: "WebVTT Subtitles" }).click();
  const download2Promise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download2 = await download2Promise;
  await expect(
    download2.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/readalong\.vtt/);
  // check output
  const filePath = await download2.path();
  const fileData = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  const refFileData = fs.readFileSync(`${testAssetsPath}/ref/readalong.vtt`, {
    encoding: "utf8",
    flag: "r",
  });
  await expect(refFileData, "file content should match reference data").toMatch(
    fileData.replace(/\r/g, ""),
  );
});
