import { test, expect } from "@playwright/test";
import { testAssetsPath, disablePlausible } from "../test-commands";
import fs from "fs";
test.describe.configure({ mode: "parallel" });
test.beforeEach(async ({ page, isMobile }) => {
  await page.goto("/", { waitUntil: "load" });
  disablePlausible(page);
  if (isMobile) {
    await page.getByTestId("menu-toggle").click();
  }
  await page.getByRole("button", { name: /Editor/ }).click();

  await page.locator("#updateRAS").waitFor({ state: "visible" });
  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#updateRAS").click();
  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "sentence-paragr-cust-css.html");
  await expect(
    page.locator("#audioToolbar"),
    "audio bar should exist",
  ).toHaveCount(1);
  //check readalong
  await expect(
    page.locator("#readalongContainer"),
    "should check that readalong is loading",
  ).not.toBeEmpty();
  await page.locator("#t0b0d0").waitFor({ state: "visible" });
  await expect(async () => {
    await expect(
      page.locator("#t0b0d0"),
      "read along has been loaded",
    ).toHaveCount(1);
  }).toPass();
  await expect(async () => {
    await expect(
      page.locator("#styleInput"),
      "read along css has been loaded",
    ).toHaveCount(1);
  }).toPass();
});
test("should edit css (editor)", async ({ page, isMobile }) => {
  await expect(page.locator("#styleInput"), "has style data").toHaveValue(
    /\.theme--light/,
  );
  await expect(
    page
      .locator('[data-test-id="text-container"]')
      .getByText("This", { exact: true }),
    "check the color of the text",
  ).toHaveCSS("color", "rgba(80, 70, 70, 0.9)");
  let downloadPromise = page.waitForEvent("download");
  await page.getByLabel("Style download button").click();
  let download = await downloadPromise;
  let filePath = `${testAssetsPath}/${download.suggestedFilename()}`;
  await download.saveAs(filePath);
  let fileData = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  await expect(
    fileData,
    "check that the css file export matches the original",
  ).toContain(".theme--light.sentence__word,");
  download.delete();
  fs.unlinkSync(filePath);
  await page
    .locator("#styleInput")
    .fill(
      ".theme--light.sentence__word,\n.theme--light.sentence__text {\n    color: rgba(180, 170, 70, .9) !important;\n}",
    );

  await page.getByRole("button", { name: "Apply" }).click();
  await expect(
    page
      .locator('[data-test-id="text-container"]')
      .getByText("This", { exact: true }),
    "check the color of the text",
  ).toHaveCSS("color", "rgba(180, 170, 70, 0.9)");
  downloadPromise = page.waitForEvent("download");
  await page.getByLabel("Style download button").click();
  download = await downloadPromise;
  filePath = await download.path();
  fileData = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
  await expect(
    fileData,
    "check that the css file export matches the original",
  ).toContain(
    ".theme--light.sentence__word,\n.theme--light.sentence__text {\n    color: rgba(180, 170, 70, .9) !important;\n}",
  );
});
