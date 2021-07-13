context("The Readalong Component", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */
  const EXPECTED_LOADING_TIME = 2000; // ms

  const FOR_ERIC_TO_TALK_A_BIT = 3000; //ms

  beforeEach(() => {
    cy.visit("/ej-fra/");
  });

  it("should load successfully", () => {
    theReadalong().should("be.visible");

    withinTheReadalong().within(() => {
      cy.contains("Page");
    });
  });

  it("should play the entire ReadAlong", () => {
    cy.wait(EXPECTED_LOADING_TIME);

    withinTheReadalong().within(() => {
      cy.get("[data-cy=play-button]").click();
      cy.wait(FOR_ERIC_TO_TALK_A_BIT);
      cy.get("[data-cy=stop-button]").click();
    });
  });

  it("should play a single word", () => {
    cy.wait(EXPECTED_LOADING_TIME);

    withinTheReadalong().contains("technologies").click();
  });

  ///////////////////////////////// Utilities //////////////////////////////////

  function theReadalong() {
    return cy.get("read-along").first();
  }

  function withinTheReadalong() {
    /**
     * To do any asserts of content WITHIN the <read-along> component, you
     * need to use .shadow() to dive into the shadow DOM.
     *
     * https://docs.cypress.io/api/commands/shadow
     */
    return theReadalong().shadow();
  }
});
