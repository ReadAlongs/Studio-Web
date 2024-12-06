import { test, expect } from "@playwright/test";
import {
  testAssetsPath,
  testMakeAReadAlong,
  defaultBeforeEach,
} from "../test-commands";
import fs from "fs";

test("should Download Praat ( file format)", async ({ page, browserName }) => {
  await defaultBeforeEach(page, browserName);
  await testMakeAReadAlong(page);

  await page.locator("#mat-select-value-3").click();
  await page.getByRole("option", { name: "Praat TextGrid" }).click();
  const download2Promise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download2 = await download2Promise;
  await expect(
    download2.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/readalong\.textgrid/);
  /* check output*/
  const filePath = await download2.path();
  const fileData = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  const refFileData = fs.readFileSync(
    `${testAssetsPath}/ref/readalong.textgrid`,
    { encoding: "utf8", flag: "r" },
  );
  await expect(
    fileData.replace(/\r/g, ""),
    "file content should match reference data",
  ).toEqual(refFileData);
});
