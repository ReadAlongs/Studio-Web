context('Testing creator enabled settings', () => {
  beforeEach(() => {
    cy.intercept(/\.ras/).as('text')
    cy.intercept(/\.m4a/).as('audio')
  });

  it('testing creator enforced hiding of translation at load time ', function () {

    cy.visit("/ej-fra/index-translated-no-display.html");
    cy.wait('@text')
    cy.wait('@audio')
    cy.readalong().within(() => {
      cy.get("#t0b0d0p0s0w0").should('be.visible')
      cy.get("#t0b0d0p0s0trtext0").should('not.be.visible')
      cy.get("[data-cy=translation-toggle]").should("be.visible")
    })
  });

  it('testing creator allows showing of translation at load time ', function () {

    cy.visit("/ej-fra/index-translated.html");
    cy.wait('@text')
    cy.wait('@audio')
    cy.readalong().within(() => {
      cy.get("#t0b0d0p0s0w0").should('be.visible')
      cy.get("#t0b0d0p0s0trtext0").should('be.visible')
      cy.get("[data-cy=translation-toggle]").should("be.visible")
    })
  });
});