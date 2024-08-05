context("The Readalong Component", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */
  const EXPECTED_LOADING_TIME = 2000; // ms

  beforeEach(() => {
    cy.intercept(/\.readalong/).as("text");
    cy.intercept(/\.m4a/).as("audio");
    cy.visit("/ej-fra/index-edit.html");
  });

  it("should have editable translation buttons", () => {
    cy.wait(["@text", "@audio"]);

    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=annotation-layer]").should("have.length", 0);
      // Click first line add translation
      cy.get("[data-test-id=add-translation-button]").first().click();
      // Check translation line was added
      cy.get("[data-test-id=annotation-layer]").should("have.length", 1);
      // Check you can type into the new translation line
      cy.get("[data-test-id=annotation-layer] span.sentence__text").type(
        "this is a test",
        {
          force: true,
        },
      );
      // Create a new translation line with the last sentence
      cy.get("[data-test-id=add-translation-button]").last().click();
      // Check it was added
      cy.get("[data-test-id=annotation-layer]").should("have.length", 2);
      // Remove the first line
      cy.get("[data-test-id^=remove-annotation-]")
        .first()
        .click({ force: true });
      // Check it was removed
      cy.get("[data-test-id=annotation-layer]").should("have.length", 1);
    });
  });
  it("add/remove annotations", () => {
    cy.wait(["@text", "@audio"]);

    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=annotation-layer]").should("have.length", 0);
      // Click show the annotation menu
      cy.get("[data-test-id=annotations-toggle]").click();
      // Check translation line was added
      cy.get("[data-test-id=annotation-layer]").should("have.length", 0);
      // Check you can type into the new translation line
      cy.get("[data-test-id=create-new-annotation-text]").type("English", {
        force: true,
      });
      cy.get("[data-test-id=create-new-annotation-button]").click();
      cy.get("[data-test-id=remove-annotation-english]").should("be.visible");
      // test closing the annotation sentence menu
      cy.get("[data-test-id=add-translation-button]").first().click();
      cy.get("[data-test-id=sentence-annotation-menu-button-close]")
        .first()
        .click();
      // Create a new annotation line
      cy.get("[data-test-id=add-translation-button]").first().click();
      cy.get("[data-test-id^=add-sentence-annotation]").first().click();
      cy.get("[data-test-id=remove-annotation-english]").should("not.exist");
      // Check you can type into the new annotation line
      cy.get("[data-test-id=annotation-layer] span.sentence__text").type(
        "Hello",
        {
          force: true,
        },
      );
      // Check it was added
      cy.get("[data-test-id=annotation-layer]").should("have.length", 1);
      // Remove the first line
      cy.get("[data-test-id^=remove-annotation-]")
        .first()
        .click({ force: true });
      // Check it was removed
      cy.get("[data-test-id=annotation-layer]").should("have.length", 0);
      //edit annotation name
      cy.get("[data-test-id=edit-annotation-english]").should("be.visible");
      cy.get("[data-test-id=edit-annotation-english]").click();
      cy.get("[data-test-id=edit-annotation-name-english]").type(
        " Translations{enter}",
      );
      cy.get("[data-test-id=toggle-annotation-english]").should(
        "include.text",
        "Translations",
      );

      //remove annotation

      cy.get("[data-test-id=remove-annotation-english]").should("be.visible");
      cy.get("[data-test-id=remove-annotation-english]").click();
      cy.get("[data-test-id=remove-annotation-english]").should("not.exist");
    });
  });
});
