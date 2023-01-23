context('Testing creator enabled settings', () => {
  beforeEach(() => {
    cy.intercept(/\.xml/).as('text')
    cy.intercept(/\.smil/).as('alignment')
    cy.intercept(/\.m4a/).as('audio')


  });
  it('testing creator enforced pause at end of page ', function () {
    cy.visit("/ej-fra/index-pause-at-end-of-page.html");
    cy.wait('@text')
    cy.wait('@alignment')
    cy.wait('@audio')
    cy.readalong().within(() => {

      cy.get("[data-cy=play-button]").click();
      cy.wait(7000)//6740 timestamp of the first word on second page
      cy.get("#t0b0d1p0s0w0").should('not.be.visible')

      cy.get("[data-cy=play-button]").should('be.visible')
    })
  });
  it('testing creator enforced pause timeout end of page ', function () {
    const timeout = 5.5
    cy.visit("/ej-fra/index-with-timeout.html");
    cy.wait('@text')
    cy.wait('@alignment')
    cy.wait('@audio')
    cy.readalong().within(() => {

      cy.get("[data-cy=play-button]").click();
      cy.wait(7000)//6740 timestamp of the first word on second page
      cy.get("#t0b0d1p0s0w0").should('not.be.visible')

      cy.get("[data-cy=play-button]").should('be.visible')
      cy.wait(timeout * 1000)
      cy.get("#t0b0d1p0s0w0").should('be.visible')
      cy.get("[data-cy=stop-button]").click();
    })
  });
  it('testing creator enforced hiding of translation at load time ', function () {

    cy.visit("/ej-fra/index-translated-no-display.html");
    cy.wait('@text')
    cy.wait('@alignment')
    cy.wait('@audio')
    cy.readalong().within(() => {
      cy.get("#t0b0d0p0s0w0").should('be.visible')
      cy.get("#t0b0d0p0s0w0t").should('not.be.visible')
      cy.get("[data-cy=translation-toggle]").should("be.visible")
    })
  });

});
