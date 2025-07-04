import { test, expect } from "@playwright/test";
import { disablePlausible } from "../test-commands";

test.describe("test editor UI language selection", () => {
  test("should switch to French version", async ({ page, isMobile }) => {
    await page.goto("/#editor/");
    await disablePlausible(page);

    const popupPromise = page.waitForEvent("popup");
    if (!isMobile) {
      await page
        .locator("a.language-selection")
        .filter({ hasText: "fr" })
        .click();
    } else {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("menuitem", { name: /Français/ }).click();
    }

    const popupPage = await popupPromise;
    await expect(
      popupPage.getByText("Choisissez un fichier HTML ReadAlong."),
    ).toBeVisible();
  });

  test("should switch to Spanish version", async ({ page, isMobile }) => {
    await page.goto("/#editor/");
    await disablePlausible(page);

    const popupPromise = page.waitForEvent("popup");
    if (!isMobile) {
      await page
        .locator("a.language-selection")
        .filter({ hasText: "es" })
        .click();
    } else {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("menuitem", { name: /Español/ }).click();
    }

    const popupPage = await popupPromise;
    await expect(
      popupPage.getByText("Seleccione un documento HTML offline de ReadAlong."),
    ).toBeVisible();
  });

  test("should switch to English version", async ({ page, isMobile }) => {
    await page.goto("http://localhost:4203/#/editor");
    await disablePlausible(page);

    const popupPromise = page.waitForEvent("popup");
    if (!isMobile) {
      await page
        .locator("a.language-selection")
        .filter({ hasText: "en" })
        .click();
    } else {
      await page.getByTestId("menu-toggle").click();
      await page.getByRole("menuitem", { name: /English/ }).click();
    }

    const popupPage = await popupPromise;
    await expect(
      popupPage.getByText("Select an offline HTML ReadAlong file."),
    ).toBeVisible();
  });
});
