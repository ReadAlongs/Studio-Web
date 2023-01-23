context('Testing end user enabled settings', () => {
  beforeEach(() => {
    cy.intercept(/\.js/).as('page')
    cy.intercept(/\.m4a/).as('audio')


    cy.visit("/ej-fra/");
    cy.wait('@page')
    cy.wait('@audio')
  });
  it("can open the settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('be.visible')

    })
  })
  it("can close the settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('be.visible')
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('not.be.visible')

    })
  })
  it("can change  page animation settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('be.visible')
      cy.get("[data-cy=settings-scroll-behavior]").should('have.checked', true)
      cy.get("[data-cy=settings-scroll-behavior]").parent().click()
      cy.get("[data-cy=settings-scroll-behavior]").should('not.have.checked')
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('not.be.visible')

    })
  })
  it("can change page turn settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('be.visible')
      cy.get("[data-cy=settings-auto-pause]").should('have.checked', true)
      cy.get("[data-cy=settings-pause-timeout]").should('exist')
      cy.get("[data-cy=settings-auto-pause]").parent().click()
      cy.get("[data-cy=settings-auto-pause]").should('not.have.checked')
      cy.get("[data-cy=settings-pause-timeout]").should('not.exist')
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('not.be.visible')
      cy.get("[data-cy=play-button]").click();
      cy.wait(7000)//6740 timestamp of the first word on second page
      cy.get("#t0b0d1p0s0w0").should('not.be.visible')

      cy.get("[data-cy=play-button]").should('be.visible')

    })
  })
  it("can change page turn timeout settings", () => {
    cy.readalong().within(() => {
      const timeout = 5
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('be.visible')
      cy.get("[data-cy=settings-auto-pause]").should('have.checked', true)
      cy.get("[data-cy=settings-pause-timeout]").type(timeout.toString())
      cy.get("[data-cy=settings-button]").click()
      cy.get("[data-cy=settings]").should('not.be.visible')


      cy.get("[data-cy=play-button]").click();
      cy.wait(7000)//6740 timestamp of the first word on second page
      cy.get("#t0b0d1p0s0w0").should('not.be.visible')
      cy.wait(timeout * 1000)
      cy.get("#t0b0d1p0s0w0").should('be.visible')
      cy.get("[data-cy=stop-button]").click();
    })
  })
})
