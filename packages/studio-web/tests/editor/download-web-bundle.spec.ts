import { test, expect } from "@playwright/test";
import { testAssetsPath, disablePlausible } from "../test-commands";
import fs from "fs";
import JSZip from "jszip";

test("should Download web bundle (zip file format) from the Editor", async ({
  page,
  isMobile,
}) => {
  await page.goto("/", { waitUntil: "load" });

  await disablePlausible(page);
  if (isMobile) {
    await page.getByTestId("menu-toggle").click();
  }
  await page
    .getByRole(isMobile ? "menuitem" : "button", { name: /Editor/ })
    .click();

  await expect(
    page.locator("#updateRAS"),
    "Choose file is visible",
  ).toBeVisible();
  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#updateRAS").click();
  let fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testAssetsPath + "sentence-paragr.html");

  //add custom style
  await page.getByTestId("toggle-css-box").click();
  await page.getByRole("radio", { name: "File" }).click();
  fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#updateStyle").click();
  fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(`${testAssetsPath}/sentence-paragr-cust-css.css`);
  await expect(async () =>
    expect(page.locator("#styleInput"), "has style data").toHaveValue(
      /\.theme--light/,
    ),
  ).toPass();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect
    .soft(
      page
        .locator('[data-test-id="text-container"]')
        .getByText("This", { exact: true }),
      "check the color of the text",
    )
    .toHaveCSS("color", "rgb(80, 70, 70)");
  // Test download web-bundle functionality
  await page.getByTestId("download-formats").click();
  await page.getByRole("option", { name: "Web Bundle" }).click();
  const download1Promise = page.waitForEvent("download");
  await page.getByTestId("download-ras").click();
  const download1 = await download1Promise;
  expect(
    download1.suggestedFilename(),
    "should have the expected filename",
  ).toMatch(/sentence\-paragr\-[0-9]*\.zip/);
  const zipPath = await download1.path();
  const zipBin = await fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipBin);
  await verifyWebBundle(zip);
});

// verify web-bundle contents used by tests in editor.
async function verifyWebBundle(zip: JSZip) {
  expect(
    zip.folder(/Offline-HTML/),
    "should have Offline-HTML folder",
  ).toHaveLength(1);
  expect(
    zip.file(/Offline-HTML\/sentence\-paragr\-[0-9]*\.html/),
    "should have Offline-HTML file",
  ).toHaveLength(1);
  expect(zip.folder(/www/).length, "should have www folder").toBeGreaterThan(1);
  expect(zip.folder(/www\/assets/), "should have assets folder").toHaveLength(
    1,
  );
  expect(
    zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.readalong/),
    "should have readalong file",
  ).toHaveLength(1);
  expect(
    zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.wav/),
    "should have wav file",
  ).toHaveLength(1);
  expect(
    zip.file(/www\/assets\/image-sentence\-paragr\-[0-9\-]*\.png/),
    "should have image files",
  ).toHaveLength(1);
  expect(
    zip.file(/www\/sentence\-paragr\-[0-9]*\.txt/),
    "should have readalong plain text file",
  ).toHaveLength(1);
  expect(zip.file(/www\/readme.txt/), "should have readme file").toHaveLength(
    1,
  );
  expect(zip.file(/www\/index.html/), "should have index file").toHaveLength(1);

  const xmlString = await zip
    .file(/www\/assets\/sentence\-paragr\-[0-9]*\.readalong/)[0]
    .async("text");
  await expect(
    xmlString,
    "download file should contain XML declaration",
  ).toMatch(/^<\?xml/);
  await expect(
    zip.file(/www\/assets\/sentence\-paragr\-[0-9]*\.css/),
    "should have stylesheet file",
  ).toHaveLength(1); //www/assets audio exists
}
