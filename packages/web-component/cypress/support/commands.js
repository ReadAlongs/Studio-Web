/**
 * Cypress will automatically create this file if it does not exist,
 *
 * however currently it is unused. Please see:
 *
 *    https://on.cypress.io/custom-commands
 *
 * for how to make custom commands, if needed.
 */

/**
 * Gets inside the <read-along>, diving into its shadow root.
 *
 * Suggested usage:
 *
 *  cy.getReadalong().within(() => {
 *    // interact with JUST the readalong
 *  })
 */
Cypress.Commands.add("readalong", () => {
  return cy.readalongElement().shadow();
});

/**
 * Gets the <read-along> element itself. Not ordinarily as useful as
 * cy.readalong().
 */
Cypress.Commands.add("readalongElement", () => {
  return cy.get("read-along").first();
});

Cypress.Commands.add("playReadAlong", () => {
  cy.get("[data-test-id=play-button]", { timeout: 10000 })
    .should("be.enabled")
    .click();
});
