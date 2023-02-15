context("The Readalong Component", () => {
  const FOR_PAGE_TURN_ANIMATION = 500; // ms
  const FOR_ERIC_TO_TALK_A_BIT = 3000; // ms

  beforeEach(() => {
    cy.visit("/ej-fra/");
  });

  it("should load successfully", () => {
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
    });
  });

  it("should play the entire ReadAlong", () => {
    cy.readalong().within(() => {
      cy.get("[data-cy=play-button]").click();
      cy.wait(FOR_ERIC_TO_TALK_A_BIT);
      cy.get("[data-cy=stop-button]").click();
    });
  });

  it("should play a single word when clicked", () => {
    cy.readalong().contains("technologies").click();
  });

  describe("the progress bar", () => {
    it("should skip ahead when clicked", () => {
      cy.readalong().within(() => {
        cy.get("[data-cy=play-button]").click();
        cy.get("[data-cy=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "1");

        cy.get("[data-cy=progress-bar]")
          .as("progress-bar")
          .then((el) => {
            // click 3/4 of the way in the readalong (should be second page)
            cy.get("@progress-bar").click(el.width() * 0.75, el.height() * 0.5);
          });
        cy.get("[data-cy=stop-button]").click();
        cy.wait(FOR_PAGE_TURN_ANIMATION);

        cy.get("[data-cy=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "2");
      });
    });
  });
});
