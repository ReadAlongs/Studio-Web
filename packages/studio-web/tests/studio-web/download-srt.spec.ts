import { test, expect } from "@playwright/test";
import {
  testAssetsPath,
  testMakeAReadAlong,
  defaultBeforeEach,
  replaceValuesWithZeroes,
} from "../test-commands";
import fs from "fs";

test("should Download SRT ( file format)", async ({ page, browserName }) => {
  await defaultBeforeEach(page, browserName);
  await testMakeAReadAlong(page);

  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "SRT Subtitles" }).click();
  const download2Promise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download2 = await download2Promise;
  await expect(
    download2.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/sentence\-paragr\-[0-9]*\.srt/);

  const filePath = await download2.path();
  const fileData = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  const refFileData = fs.readFileSync(`${testAssetsPath}/ref/readalong.srt`, {
    encoding: "utf8",
    flag: "r",
  });
  await expect(
    replaceValuesWithZeroes(fileData.replace(/\r/g, "")).trim(),
    "file content should match reference data",
  ).toEqual(replaceValuesWithZeroes(refFileData).trim());
});
