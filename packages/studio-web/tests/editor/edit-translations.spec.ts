import { test, expect } from "@playwright/test";
import { testAssetsPath, editorDefaultBeforeEach } from "../test-commands";
test.describe.configure({ mode: "parallel" });

test("should edit translations (editor)", async ({ page }) => {
  await expect(async () => {
    await editorDefaultBeforeEach(page);
  }).toPass();
  await page.locator("#t0b0d0p0s0translation").waitFor({ state: "visible" });
  //edit first sentence translation
  await page.locator("#t0b0d0p0s0translation").fill("Un vrai test.");
  await expect(page.locator("#t0b0d0p0s0translation")).toContainText(
    "Un vrai test.",
  );
  //add translation to second sentence
  await page
    .locator("#t0b0d0p0s1")
    .getByTestId("add-translation-button")
    .click();
  await page.locator("#t0b0d0p0s1translation").fill("Phrase.");
  //remove third sentence
  await page
    .locator("#t0b0d0p1s0")
    .getByTestId("remove-translation-button")
    .click();
  await page
    .locator("#t0b0d0p1s0")
    .getByTestId("add-translation-button")
    .waitFor({ state: "visible" });
  //toggle translations
  await page.getByTestId("translation-toggle").click();
  await expect(
    page.locator(".sentence__translation.invisible"),
    " translations should be hidden",
  ).not.toHaveCount(0);
  await page.getByTestId("translation-toggle").click();
  await expect(
    page.locator(".sentence__translation.invisible"),
    " translations should not be hidden",
  ).toHaveCount(0);
  await expect(
    page.getByTestId("translation-line"),
    " translations should not be hidden",
  ).toHaveCount(2);
});
