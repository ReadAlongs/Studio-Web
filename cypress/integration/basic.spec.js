context('The Readalong Component', () => {
  it('should exist', () => {
    cy.visit('/ej-fra/')

    cy.get('read-along')
      .first()
      .should('exist')
      .as('read-along')

    cy.get('@read-along')
      .should('contain', 'Bonjour')
      .click()
  })
})
