context("The Readalong Component", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */

    // not needed using intercept now
    // const EXPECTED_LOADING_TIME = 2000; // ms

  const FOR_PAGE_TURN_ANIMATION = 500; // ms
  const FOR_ERIC_TO_TALK_A_BIT = 3000; // ms

  beforeEach(() => {
    cy.intercept(/\.js/).as('page')
    cy.intercept(/\.m4a/).as('audio')
    cy.intercept(/\.xml/).as('text')
    cy.intercept(/\.smil/).as('alignment')


    cy.visit("/ej-fra/");
    cy.wait('@page')
    cy.wait('@text')
    cy.wait('@alignment')
    cy.wait('@audio')
    cy.readalongElement().should("be.visible");
  });

  it("should load successfully", () => {


    cy.readalong().within(() => {

      cy.contains("Page");

    });
  });

  it("should play the entire ReadAlong", () => {

    //cy.wait(EXPECTED_LOADING_TIME);

    cy.readalong().within(() => {
      cy.get("[data-cy=play-button]").click();
      cy.wait(FOR_ERIC_TO_TALK_A_BIT);
      cy.get("[data-cy=stop-button]").click();
    });
  });

  describe("click single words", () => {
    it("should play a single word when clicked", () => {
      // cy.wait(EXPECTED_LOADING_TIME);

      cy.readalong().within(() => {
        cy.contains("technologies").click();
      })
    })
    it("should play a single word when clicked and be able to play", () => {
      // cy.wait(EXPECTED_LOADING_TIME);

      cy.readalong().within(() => {
        cy.get("[data-cy=progress-bar] .progress").should('not.exist')

        cy.contains("technologies").click();
        cy.get("[data-cy=play-button]").click();
        cy.wait(FOR_ERIC_TO_TALK_A_BIT)
        cy.get("[data-cy=progress-bar] .progress").should('be.visible')
      })
    });
  })


  describe("the progress bar", () => {
    it("should skip ahead when clicked", () => {
      //cy.wait(EXPECTED_LOADING_TIME);

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
