context("Readalong Component with translation", () => {
  beforeEach(() => {
    cy.visit("/ej-fra/index-translated.html");
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
