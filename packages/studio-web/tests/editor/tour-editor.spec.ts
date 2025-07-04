import { test, expect } from "@playwright/test";
import { disablePlausible } from "../test-commands";
test.describe.configure({ mode: "parallel" });
test("should do tour", async ({ page, isMobile }) => {
  await page.goto("/", { waitUntil: "load" });
  disablePlausible(page);
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
  await page.getByRole("button", { name: "Take the tour!" }).click();
  await page.locator(".shepherd-element").waitFor({ state: "visible" });
  await expect(
    page.locator(".shepherd-header"),
    "should have title `Editor..`",
  ).toContainText("Editor for");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByText(/Choose File/),
    "should have title `Choose..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/Tadaa/),
    "should have title `Tadaa!..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/You can add an image/),
    "should have text `You can add an image..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByText(/You can add a translation/),
    "should have text `You can add a translation..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/In this section, you can see a visual representation/),
    "should have text `In this section, you can see a visual representation..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/Audio Toolbar Zoom/),
    "should have title `Audio..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/Audio Text/),
    "should have title `Audio Text..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/Fix Spelling/),
    "should have title `Fix Spelling..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByText(/Export your/),
    "should have title `Export..`",
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
});
