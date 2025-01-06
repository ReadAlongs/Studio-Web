import { test, expect } from "@playwright/test";
import { testAssetsPath, editorDefaultBeforeEach } from "../test-commands";
test.describe.configure({ mode: "parallel" });

test("should edit images (editor)", async ({ page, isMobile }) => {
  await expect(async () => {
    await editorDefaultBeforeEach(page, isMobile);
  }).toPass();
  await page.locator("#updateRAS").waitFor({ state: "visible" });
  await expect(
    page.locator("#fileElem--t0b0d0"),
    "should not have image on first page",
  ).toHaveCount(1);
  //upload a photo to page 1
  let fileChooserPromise = page.waitForEvent("filechooser");
  page.locator("#fileElem--t0b0d0").dispatchEvent("click");

  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "page1.png");
  await expect(
    page.locator("#t0b0d0 img"),
    "should have image on first page",
  ).toHaveCount(1);
  //delete photo page 2 and re-add
  const progressBar = page.getByTestId("progress-bar");
  const progressBarBoundingBox = await progressBar.boundingBox();

  await progressBar.click({
    force: true,
    position: {
      x: progressBarBoundingBox?.x || 0,
      y: progressBarBoundingBox ? progressBarBoundingBox.width * 0.9 : 0,
    },
  });
  await page.locator("#t0b0d1").getByTestId("delete-button").click();
  await expect(
    page.locator("#fileElem--t0b0d1"),
    "should remove image on second page",
  ).toHaveCount(1);
});
