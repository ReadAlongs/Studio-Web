context("Readalong Component with translation", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */
  const EXPECTED_LOADING_TIME = 2000; // ms


  beforeEach(() => {
    cy.intercept(/\.js/).as('page')
    cy.intercept(/\.m4a/).as('audio')
    cy.intercept(/\.xml/).as('text')
    cy.intercept(/\.smil/).as('alignment')
    cy.visit("/ej-fra/index-translated.html");
    cy.wait('@page')
    cy.wait('@text')
    cy.wait('@alignment')
    cy.wait('@audio')
  })

  it("should load successfully", () => {
    cy.readalongElement()
      .should("be.visible")
      .invoke("attr", "language")
      .should("equal", "fra")
  })

  it("should have language attributes", () => {
    cy.readalong().within(() => {
      cy.get("[lang=eng]").should("have.length.above", 0)
    })
  })


  describe("the translation toggle button", () => {

    it("is visible", () => {

      cy.readalong().within(() => {
        cy.get(".sentence__translation").should("have.length.above", 0).should("be.visible")
        cy.get("[data-cy=translation-toggle]").should("be.visible")
      })
    })

    it(" toggle button testing", () => {

      cy.readalong().within(() => {
        cy.get(".sentence__translation").should("not.have.class", "invisible")
        cy.get("[data-cy=translation-toggle]").click()
        cy.get(".sentence__translation").should("have.class", "invisible")
        cy.get("[data-cy=translation-toggle]").click()
        cy.get(".sentence__translation").should("not.have.class", "invisible")
      })
    })

  });
});
