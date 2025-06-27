import { test, expect } from "@playwright/test";
import {
  testText,
  disablePlausible,
  testAssetsPath,
  testMp3Path,
} from "../test-commands";
import fs from "fs";

test.describe.configure({ mode: "parallel" });
test.describe("test studio UI & UX", () => {
  test("should check UI (en)", async ({ page }) => {
    await page.goto("/");
    await disablePlausible(page);
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
    await disablePlausible(page);
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
      .getByRole("radio", { name: "Sélectionner une langue spécifique" })
      .check();
    await expect(page.getByTestId("language-list")).toBeEnabled();
  });
  test("should check UI (es)", async ({ page }) => {
    await page.goto("http://localhost:4204/");
    await disablePlausible(page);
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
    await disablePlausible(page);
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

  test("should validate input text size", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await disablePlausible(page);
    await expect(async () => {
      await expect(page.getByTestId("next-step")).toBeEnabled();
    }).toPass();

    const textAboveLimit = fs.readFileSync(
      `${testAssetsPath}/ras-text-50kb.txt`,
      { encoding: "utf8", flag: "r" },
    );
    await page.getByTestId("ras-text-input").fill(textAboveLimit);

    await expect(
      page.locator("#toast-container").locator(".toast-error").first(),
    ).toBeVisible({ timeout: 25000 });

    await page
      .getByTestId("audio-btn-group")
      .getByRole("radio", { name: "File" })
      .click();
    await page.getByTestId("ras-audio-fileselector").click();
    await page.getByTestId("ras-audio-fileselector").setInputFiles(testMp3Path);
    await page.getByTestId("next-step").click();
    await expect(
      page.locator("#toast-container").locator(".toast-error").first(),
    ).toBeVisible();
  });
  test("should validate input text file size", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await disablePlausible(page);
    await expect(async () => {
      await expect(page.getByTestId("next-step")).toBeEnabled();
    }).toPass();

    await page
      .getByTestId("text-btn-group")
      .getByRole("radio", { name: "File" })
      .click();

    await page
      .locator("#updateText")
      .setInputFiles(testAssetsPath + "/ras-text-37kb.txt");

    await expect(
      page.locator("#toast-container").locator(".toast-error"),
    ).toHaveCount(0);

    await page
      .locator("#updateText")
      .setInputFiles(testAssetsPath + "/ras-text-50kb.txt");

    await expect(
      page.locator("#toast-container").locator(".toast-error"),
    ).toBeVisible();

    await page
      .getByTestId("audio-btn-group")
      .getByRole("radio", { name: "File" })
      .click();
    await page.getByTestId("ras-audio-fileselector").click();
    await page.getByTestId("ras-audio-fileselector").setInputFiles(testMp3Path);
    await page.getByTestId("next-step").click();
    await expect(
      page.locator("#toast-container").locator(".toast-error"),
    ).toBeVisible();
  });

  test("should validate upload text file type", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await disablePlausible(page);
    await expect(async () => {
      await expect(page.getByTestId("next-step")).toBeEnabled();
    }).toPass();

    await page
      .getByTestId("text-btn-group")
      .getByRole("radio", { name: "File" })
      .click();
    await page.locator("#updateText").click();
    await page
      .locator("#updateText")
      .setInputFiles(testAssetsPath + "/page1.png");

    await expect(
      page.locator("#toast-container").locator(".toast-error"),
    ).toBeVisible();
  });

  test("should validate upload audio file type", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await disablePlausible(page);
    await expect(async () => {
      await expect(page.getByTestId("next-step")).toBeEnabled();
    }).toPass();

    await page
      .getByTestId("audio-btn-group")
      .getByRole("radio", { name: "File" })
      .click();
    await page.locator("#updateAudio").click();
    await page
      .locator("#updateAudio")
      .setInputFiles(testAssetsPath + "/page1.png");

    await expect(
      page.locator("#toast-container").locator(".toast-error"),
    ).toBeVisible();
  });
});
