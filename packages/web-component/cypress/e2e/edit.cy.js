context("The Readalong Component", () => {
  beforeEach(() => {
    cy.intercept(/\.readalong/).as("text");
    cy.intercept(/\.m4a/).as("audio");
    cy.visit("/ej-fra/index-edit.html");
  });

  it("should have editable translation buttons", () => {
    cy.wait(["@text", "@audio"]);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      // Click first line add translation
      cy.get("[data-test-id=add-translation-button]").first().click();
      // Check translation line was added
      cy.get("[data-test-id=translation-line]").should("have.length", 1);
      // Check you can type into the new translation line
      cy.get("[data-test-id=translation-line]").type("this is a test", {
        force: true,
      });
      // Create a new translation line with the last sentence
      cy.get("[data-test-id=add-translation-button]").last().click();
      // Check it was added
      cy.get("[data-test-id=translation-line]").should("have.length", 2);
      // Remove the first line
      cy.get("[data-test-id=remove-translation-button]").first().click();
      // Check it was removed
      cy.get("[data-test-id=translation-line]").should("have.length", 1);
    });
  });

  it("should not allow non-image uploads", () => {
    cy.wait(["@text", "@audio"]);
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.get("[data-test-id=delete-button]").click();
      cy.get("[for=fileElem--t0b0d0]").should("be.visible");
      cy.get("#fileElem--t0b0d0").selectFile(
        {
          contents: Cypress.Buffer.from("file contents"),
          fileName: "test-file.zip",
          mimeType: "application/zip",
        },
        { force: true },
      );

      cy.get("[data-test-id=invalid-image-file]").should("be.visible");
    });
  });
});
