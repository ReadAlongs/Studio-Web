import { test, expect } from "@playwright/test";
import { testAssetsPath, disablePlausible } from "../test-commands";
test.describe.configure({ mode: "parallel" });
test("should check editor UI", async ({ page, isMobile }) => {
  await page.goto("/", { waitUntil: "load" });

  await disablePlausible(page);
  if (isMobile) {
    await page.getByTestId("menu-toggle").click();
  }
  await page
    .getByRole(isMobile ? "menuitem" : "button", { name: /Editor/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Take the tour!" }),
    "Tour button is visible",
  ).toBeVisible();
  await expect(
    page.locator("#updateRAS"),
    "Choose file is visible",
  ).toBeVisible();
  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#updateRAS").click();
  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "sentence-paragr.html");
  //check audio bar
  /**
   * We are using css classes instead of test-id because this is an external plugin
   * failure here means the plugin version has changed we should test impact on our app
   */

  await expect(
    page.locator("#audioToolbar"),
    "audio bar should exist",
  ).toHaveCount(1);
  await expect(
    page.locator("segment.wavesurfer-segment"),
    "should seven audio segments",
  ).toHaveCount(7);
  await expect(
    page.locator("segment.wavesurfer-segment:first-of-type > .segment-content"),
    "audio segments text should be editable",
  ).toHaveAttribute("contenteditable", "true");
  await expect(
    page.locator(
      "segment.wavesurfer-segment:first-of-type > .wavesurfer-handle",
    ),
    "audio segments boundaries should exist",
  ).toHaveCount(2);

  //check readalong
  await expect(
    page.locator("#readalongContainer"),
    "should check that readalong is loading",
  ).not.toBeEmpty();
  const header = page.locator(
    "#readalongContainer span[slot=read-along-header]",
  );
  await expect(header, "should have correct title").toContainText(
    "Sentence Paragraph Page",
  );
  await expect(header, "should have editable title").toHaveAttribute(
    "contenteditable",
    "true",
  );
  const subheader = page.locator(
    "#readalongContainer span[slot=read-along-subheader]",
  );
  await expect(subheader, "should have correct subtitle").toContainText(
    "by me",
  );
  await expect(subheader, "should have editable subtitle").toHaveAttribute(
    "contenteditable",
    "true",
  );
  await page.locator("#t0b0d0p1s0").scrollIntoViewIfNeeded();
  await expect(
    page.locator("#t0b0d0p0s0").getByLabel("Remove translation"),
    "should have translation for first paragraph first sentence",
  ).toBeVisible();
  await expect(
    page.locator("#t0b0d0p0s1").getByRole("button", { name: "add" }),
    "should not have translation for first paragraph second sentence",
  ).toBeVisible();
  await expect(
    page.locator("#t0b0d0p1s0").getByLabel("Remove translation"),
    "should have translation for second paragraph ",
  ).toBeVisible();
  await expect(
    page.locator("#fileElem--t0b0d0"),
    "should not have image on first page",
  ).toHaveCount(1);
  await expect(
    page.locator("#t0b0d1 img"),
    "should have image on second page",
  ).toHaveCount(1);
});

test("should verify the uploaded file type", async ({ page, isMobile }) => {
  await page.goto("/", { waitUntil: "load" });

  await disablePlausible(page);
  if (isMobile) {
    await page.getByTestId("menu-toggle").click();
  }
  await page
    .getByRole(isMobile ? "menuitem" : "button", { name: /Editor/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Take the tour!" }),
    "Tour button is visible",
  ).toBeVisible();

  await expect(
    page.locator("#updateRAS"),
    "Choose file is visible",
  ).toBeVisible();

  let fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#updateRAS").click();
  let fileChooser = await fileChooserPromise;
  fileChooser.setFiles(testAssetsPath + "page1.png");

  await expect(
    page.locator("#toast-container").locator(".toast-error"),
  ).toBeVisible();
});
