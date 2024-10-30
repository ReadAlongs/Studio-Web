context("Readalong Component with annotation", () => {
  beforeEach(() => {
    cy.intercept(/\.readalong/).as("text");
    cy.intercept(/\.m4a/).as("audio");
    cy.visit("/ej-fra/index-annotated.html");
  });

  it("should load successfully", () => {
    cy.readalongElement()
      .should("be.visible")
      .invoke("attr", "language")
      .should("equal", "fra");
  });

  it("should have language attributes", () => {
    cy.readalong().within(() => {
      cy.get("[lang=eng]").should("have.length.above", 0);
    });
  });

  describe("the annotation toggle button", () => {
    it("is visible", () => {
      cy.wait(["@text", "@audio"]);
      cy.readalong().within(() => {
        cy.get("[annotation-id]")
          .should("have.length.above", 0)
          .should("be.not.visible");
        cy.get("#annotationsMenu").should("not.exist");
        cy.get("[data-test-id=annotations-toggle]").should("be.visible");
      });
    });

    it(" toggle button testing", () => {
      cy.wait(["@text", "@audio"]);
      cy.readalong().within(() => {
        cy.get("[data-test-id=play-button]").should("be.enabled");
        cy.get("[annotation-id]").should("have.class", "invisible");
        cy.get("#annotationsMenu").should("not.exist");
        cy.get("[data-test-id=annotations-toggle]").click();
        cy.get("#annotationsMenu").should("be.visible");
        cy.get("[data-test-id=toggle-all-annotations]").click();
        cy.get("[annotation-id]").should("not.have.class", "invisible");

        cy.get("[data-test-id=toggle-all-annotations]").click();
        cy.get("[annotation-id]").should("have.class", "invisible");
        cy.get("[data-test-id=annotations-toggle]").click();
        cy.get("#annotationsMenu").should("not.exist");
      });
    });
  });
});
