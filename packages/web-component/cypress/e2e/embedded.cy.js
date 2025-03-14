context("The Readalong Component", () => {
  const EXPECTED_LOADING_TIME = 2000; // ms
  const FOR_PAGE_TURN_ANIMATION = 500; // ms
  const FOR_ERIC_TO_TALK_A_BIT = 3000; // ms

  beforeEach(() => {
    cy.visit("/ej-fra/index-embedded.html");
  });

  it("should load successfully", () => {
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
    });
  });

  it("should play the entire ReadAlong", () => {
    cy.wait(EXPECTED_LOADING_TIME);

    cy.readalong().within(() => {
      cy.playReadAlong();
      cy.wait(FOR_ERIC_TO_TALK_A_BIT);
      cy.get("[data-test-id=stop-button]").click();
    });
  });

  it("should play a single word when clicked", () => {
    cy.wait(EXPECTED_LOADING_TIME);

    cy.readalong().contains("technologies").click();
  });

  describe("the progress bar", () => {
    it("should skip ahead when clicked", () => {
      cy.wait(EXPECTED_LOADING_TIME);

      cy.readalong().within(() => {
        cy.playReadAlong();
        cy.get("[data-test-id=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "1");

        cy.get("[data-test-id=progress-bar]")
          .as("progress-bar")
          .then((el) => {
            // click 3/4 of the way in the readalong (should be second page)
            cy.get("@progress-bar").click(el.width() * 0.75, el.height() * 0.5);
          });
        cy.get("[data-test-id=stop-button]").click();
        cy.wait(FOR_PAGE_TURN_ANIMATION);

        cy.get("[data-test-id=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "2");
      });
    });
  });
});
