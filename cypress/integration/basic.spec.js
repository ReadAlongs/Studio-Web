context('The Readalong Component', () => {
  /**
   * Wait for the audio and the SMIL to load.
   */
  const EXPECTED_LOADING_TIME = 2000 // ms

  it('should exist', () => {
    cy.visit('/ej-fra/')

    theReadalong()
      .should('be.visible')

    cy.wait(EXPECTED_LOADING_TIME)

    withinTheReadalong()
      .contains('Bonjour')
      .click();
  })

  function theReadalong() {
    return cy.get('read-along').first();
  }

  function withinTheReadalong() {
    /**
     * To do any asserts of content WITHIN the <read-along> component, you
     * need to use .shadow() to dive into the shadow DOM.
     *
     * https://docs.cypress.io/api/commands/shadow
     */
    return theReadalong().shadow()
  }
})
