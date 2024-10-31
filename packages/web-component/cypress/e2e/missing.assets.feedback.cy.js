context("Readalong Component with missing assets", () => {
  it("missing text warning show show successfully", () => {
    cy.visit("/ej-fra/index-missing-xml.html");
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=text-container]").should(($el) => {
        expect($el.children().length).equal(0, "has text");
      });
      cy.get("[data-test-id=AUDIO-error]").should("not.exist");
      cy.get("[data-test-id=alignment-error]").should("not.exist");
      cy.get("[data-test-id=control-panel]")
        .should("have.length", 1)
        .should("be.visible");
      cy.get("[data-test-id=RAS-error]")
        .should(($el) => {
          expect($el.hasClass("fade")).equal(
            false,
            "error message box visible",
          );
          //check that message is visible
          expect($el.text()).contains(
            'the RAS file "ejfra.readalong" could not be loaded',
            "error message visible",
          );
        })
        .should("be.visible");
      cy.get("[data-test-id=progress-bar]").should("have.length", 0);
    });
  });

  it("parsing text warning should show successfully", () => {
    cy.visit("/ej-fra/index-malformed-xml.html");
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=text-container]").should(($el) => {
        expect($el.children().length).equal(0, "has text");
      });
      cy.get("[data-test-id=AUDIO-error]").should("not.exist");
      cy.get("[data-test-id=alignment-error]").should("not.exist");
      cy.get("[data-test-id=control-panel]")
        .should("have.length", 1)
        .should("be.visible");
      cy.get("[data-test-id=RAS-error]")
        .should(($el) => {
          expect($el.hasClass("fade")).equal(
            false,
            "error message box visible",
          );
          //check that message is visible
          expect($el.text()).contains(
            'Erreur: le fichier RAS "ej-fra-malformed.readalong" n\'a pas pu être analysé',
            "error message visible",
          );
        })
        .should("be.visible");
      cy.get("[data-test-id=progress-bar]").should("have.length", 0);
    });
  });

  it("missing audio warning should show successfully", () => {
    cy.visit("/ej-fra/index-missing-audio.html");
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
      cy.get("[data-test-id=AUDIO-error]")
        .should(($el) => {
          expect($el.hasClass("fade")).equal(false);
          //check that message is visible
          expect($el.text()).contains(
            'Error: the AUDIO file "ejfra.m4a" could not be loaded',
          );
        })
        .should("be.visible");
      cy.get("[data-test-id=control-panel]").should("have.length", 0);
      cy.get("[data-test-id=RAS-error]").should("not.exist");
      cy.get("[data-test-id=alignment-error]").should("not.exist");
      cy.get("[data-test-id=progress-bar]").should("have.length", 1);
    });
  });

  it("missing alignment warning should show successfully", () => {
    cy.visit("/ej-fra/index-missing-alignment.html");
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
      cy.get("[data-test-id=AUDIO-error]").should("not.exist");
      cy.get("[data-test-id=control-panel]")
        .should("have.length", 1)
        .should("be.visible");
      cy.get("[data-test-id=RAS-error]").should("not.exist");
      cy.get("[data-test-id=alignment-error]")
        .should(($el) => {
          expect($el.hasClass("fade")).equal(false);
          // check that message is visible
          expect($el.text()).contains("Error: No alignments were found");
        })
        .should("be.visible");
      cy.get("[data-test-id=progress-bar]").should("have.length", 0);
    });
  });

  it("should only show missing audio and ras when everything is missing", () => {
    cy.visit("/ej-fra/index-missing-everything.html");
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=alignment-error]").should("not.exist");
      cy.get("[data-test-id=RAS-error]").should("be.visible");
      cy.get("[data-test-id=AUDIO-error]").should("be.visible");
    });
  });
});
