import { test, expect } from "@playwright/test";
import { disablePlausible } from "../test-commands";

test.describe("test studio UI language selection", () => {
  test("should switch to French version", async ({ page, isMobile }) => {
    await page.goto("/");
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

    // unique to studio web, and contains French text
    await expect(
      popupPage.getByRole("radio", {
        name: "Sélectionner une langue spécifique",
      }),
    ).toBeVisible();
  });

  test("should switch to Spanish version", async ({ page, isMobile }) => {
    await page.goto("/");
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

    // unique to studio web, and contains Spanish text
    await expect(
      popupPage.getByRole("radio", {
        name: "Seleccione un idioma específico",
      }),
    ).toBeVisible();
  });

  test("should switch to English version", async ({ page, isMobile }) => {
    await page.goto("http://localhost:4203/");
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

    // unique to studio web, and contains english text
    await expect(
      popupPage.getByRole("radio", { name: "Select a specific language" }),
    ).toBeVisible();
  });
});
