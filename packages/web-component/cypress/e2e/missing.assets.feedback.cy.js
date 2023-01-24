context("Readalong Component with missing assets", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */
  const EXPECTED_LOADING_TIME = 3000; // ms


  it("missing text warning show show successfully", () => {
    cy.visit("/ej-fra/index-missing-xml.html");
    cy.wait(EXPECTED_LOADING_TIME);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-cy=text-container]").should(($el) => {
        expect($el.children().length).equal(0, "has text")
      })
      cy.get("[data-cy=AUDIO-error]").should("not.exist")
      cy.get("[data-cy=control-panel]").should("have.length", 1).should("be.visible")
      cy.get("[data-cy=XML-error]").should(($el) => {
        expect($el.hasClass("fade")).equal(false, "error message box visible")
        //check that message is visible
        expect($el.text()).contains("could not be loaded", "error message visible")
      }).should("be.visible")
      cy.get("[data-cy=SMIL-error]").should("not.exist")
      cy.get("[data-cy=progress-bar]").should("have.length", 1).should("be.visible")
    });
  });

  it("parsing text warning show show successfully", () => {
    cy.visit("/ej-fra/index-malformed-xml.html");
    cy.wait(EXPECTED_LOADING_TIME);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-cy=text-container]").should(($el) => {
        expect($el.children().length).equal(0, "has text")
      })
      cy.get("[data-cy=AUDIO-error]").should("not.exist")
      cy.get("[data-cy=control-panel]").should("have.length", 1).should("be.visible")
      cy.get("[data-cy=XML-error]").should(($el) => {
        expect($el.hasClass("fade")).equal(false, "error message box visible")
        //check that message is visible
        expect($el.text()).contains("could not be parsed", "error message visible")
      }).should("be.visible")
      cy.get("[data-cy=SMIL-error]").should("not.exist")
      cy.get("[data-cy=progress-bar]").should("have.length", 1).should("be.visible")
    });
  });

  it("missing audio warning should show successfully", () => {
    cy.visit("/ej-fra/index-missing-audio.html");
    cy.wait(EXPECTED_LOADING_TIME);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
      cy.get("[data-cy=AUDIO-error]").should(($el) => {
        expect($el.hasClass("fade")).equal(false)
        //check that message is visible
        expect($el.text()).contains("could not be loaded")
      }).should("be.visible")
      cy.get("[data-cy=control-panel]").should("have.length", 0)
      cy.get("[data-cy=XML-error]").should("not.exist")
      cy.get("[data-cy=SMIL-error]").should("not.exist")
      cy.get("[data-cy=progress-bar]").should("have.length", 1)
    });
  });

  it("missing alignment warning should show successfully", () => {
    cy.visit("/ej-fra/index-missing-alignment.html");
    cy.wait(EXPECTED_LOADING_TIME);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
      cy.get("[data-cy=AUDIO-error]").should("not.exist")
      cy.get("[data-cy=control-panel]").should("have.length", 1).should("be.visible")
      cy.get("[data-cy=XML-error]").should("not.exist")
      cy.get("[data-cy=SMIL-error]").should(($el) => {
        expect($el.hasClass("fade")).equal(false)
        // check that message is visible
        expect($el.text()).contains("could not be loaded")
      }).should("be.visible")
      cy.get("[data-cy=progress-bar]").should("have.length", 0)
    });
  });


});
