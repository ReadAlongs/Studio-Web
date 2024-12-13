import { test, expect } from "@playwright/test";
import { testText, disablePlausible } from "../test-commands";
test.describe.configure({ mode: "parallel" });
test.describe("test studio UI & UX", () => {
  test.beforeEach(async ({ page }) => {
    disablePlausible(page);
  });
  test("should check UI (en)", async ({ page }) => {
    await page.goto("/");
    //tour button is visible
    await expect(page.getByText("Take the tour!")).toBeVisible();
    //check text button group
    await expect(page.getByTestId("text-btn-group")).toBeVisible();
    //check audio button group
    await expect(page.getByTestId("audio-btn-group")).toBeVisible();
    //check the language list
    await expect(page.getByTestId("language-list")).toBeDisabled();
    await page
      .getByRole("radio", { name: "Select a specific language" })
      .check();
    await expect(page.getByTestId("language-list")).toBeEnabled();
  });
  test("should check UI (fr)", async ({ page }) => {
    await page.goto("http://localhost:4203/");
    //tour button is visible
    await expect(
      page.getByRole("button", { name: "Visite guidée" }),
    ).toBeVisible();
    //check text button group
    await expect(page.getByTestId("text-btn-group")).toBeVisible();
    //check audio button group
    await expect(page.getByTestId("audio-btn-group")).toBeVisible();
    //check the language list
    await expect(page.getByTestId("language-list")).toBeDisabled();
    await page
      .getByRole("radio", { name: "Sélectionner une languge spécifique" })
      .check();
    await expect(page.getByTestId("language-list")).toBeEnabled();
  });
  test("should check UI (es)", async ({ page }) => {
    await page.goto("http://localhost:4204/");
    //tour button is visible
    await expect(page.getByText("¡Siga el tour!")).toBeVisible();
    //check text button group
    await expect(page.getByTestId("text-btn-group")).toBeVisible();
    //check audio button group
    await expect(page.getByTestId("audio-btn-group")).toBeVisible();
    //check the language list
    await expect(page.getByTestId("language-list")).toBeDisabled();
    await page
      .getByRole("radio", { name: "Seleccione un idioma específico" })
      .check();
    await expect(page.getByTestId("language-list")).toBeEnabled();
  });
  test("should input and save text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("text-download-btn")).toBeDisabled();
    await page.getByTestId("ras-text-input").fill(testText);
    await expect(page.getByTestId("text-download-btn")).toBeEnabled();

    const download2Promise = page.waitForEvent("download");
    await page.getByTestId("text-download-btn").click();
    const download2 = await download2Promise;
    await expect(
      download2.suggestedFilename(),
      "should have the expected filename",
    ).toMatch(/ras-text-\d+\.txt/);
  });
});
