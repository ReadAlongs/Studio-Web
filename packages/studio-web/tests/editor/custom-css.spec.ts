import { test, expect } from "@playwright/test";
import { testAssetsPath, disablePlausible } from "../test-commands";
import fs from "fs";

test.describe.configure({ mode: "parallel" });
test.beforeEach(async ({ page, isMobile }) => {
  //await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  await page.goto("/", { waitUntil: "load" });
  disablePlausible(page);
  if (isMobile) {
    await page.getByTestId("menu-toggle").click();
  }
  await page
    .getByRole(isMobile ? "menuitem" : "button", { name: /Editor/ })
    .click();

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

  await expect(
    page.locator("#t0b0d0"),
    "read along has been loaded",
  ).toHaveCount(1);
  await expect(
    page.locator("#style-section"),
    "css editor to be hidden",
  ).toHaveClass(/\bcollapsed\b/);
  await page.getByTestId("toggle-css-box").click();
  await expect(
    page.locator("#style-section"),
    "css editor to be visible",
  ).not.toHaveClass(/\bcollapsed\b/);
  await expect(async () => {
    await expect(page.locator("#styleInput"), "has style data").toHaveValue(
      /\.theme--light/,
    );
  }).toPass();
});
test("should edit css (editor)", async ({ page, isMobile }) => {
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
test("should use with custom font", async ({ page, isMobile }) => {
  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#defaultFont").click();
  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "cour.ttf");
  await expect(
    page.getByText("File cour.ttf processed."),
    "font successfully loaded",
  ).toBeVisible();
});

test("should paste in style", async ({ page, context }) => {
  const style = fs.readFileSync(
    testAssetsPath + "sentence-paragr-cust-css.css",
    { encoding: "utf8", flag: "r" },
  );
  // Ensure clipboard permissions are granted
  await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, style);
  await page.getByRole("button", { name: "Paste" }).click();
  // Wait for the style input to be updated after paste
  await expect(
    page.locator("#styleInput"),
    "style input should not be empty",
  ).not.toBeEmpty();
  await expect
    .poll(async () => await page.locator("#styleInput").inputValue(), {
      message: "check that the style input has been replaced",
    })
    .toContain(style);
});
test("should load and copy style", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("radio", { name: "File" }).click();
  await page
    .locator("#updateStyle")
    .waitFor({ state: "visible", timeout: 10000 });
  await page.locator("#updateStyle").click();
  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "sentence-paragr-cust-css.css");
  await expect(
    page.getByText(
      "File sentence-paragr-cust-css.css processed. Content loaded in the text box.",
    ),
    "css successfully loaded",
  ).toBeVisible();
  await expect(
    page.locator("#styleInput"),
    "style input should not be empty",
  ).not.toBeEmpty();
  await page.getByRole("button", { name: "Copy" }).click();
  const css = await page.evaluate(() => navigator.clipboard.readText());
  await expect(css.length, "clipboard css should not be empty").toBeGreaterThan(
    0,
  );
});
