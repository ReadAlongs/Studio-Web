context("Testing creator enabled settings", () => {
  beforeEach(() => {
    cy.intercept(/\.readalong/).as("text");
    cy.intercept(/\.m4a/).as("audio");
  });

  it("testing creator enforced hiding of translation at load time ", function () {
    cy.visit("/ej-fra/index-translated-no-display.html");
    cy.wait(["@text", "@audio"]);
    cy.readalong().within(() => {
      cy.get("#t0b0d0p0s0w0").should("be.visible");
      cy.get("#t0b0d0p0s0trtext0").should("not.be.visible");
      cy.get("[data-test-id=translation-toggle]").should("be.visible");
    });
  });

  it("testing creator allows showing of translation at load time ", function () {
    cy.visit("/ej-fra/index-translated.html");
    cy.wait(["@text", "@audio"]);
    cy.readalong().within(() => {
      cy.get("#t0b0d0p0s0w0").should("be.visible");
      cy.get("#t0b0d0p0s0trtext0").should("be.visible");
      cy.get("[data-test-id=translation-toggle]").should("be.visible");
    });
  });

  it("testing creator enabling auto pause ", function () {
    cy.visit("/ej-fra/index-with-auto-pause.html");
    cy.wait(["@text", "@audio"]);
    cy.readalong().within(() => {
      cy.playReadAlong();
      cy.wait(12000); //wait for the last word of the first page (at 6.4) + ~5 sec

      cy.get("#t0b0d0p0s2w15")
        .should("be.visible")
        .should("have.class", "reading"); //check the last word is still highlighted
    });
  });

  it("testing creator enabling one-column-page-layout ", function () {
    cy.intercept(/\.png/).as("image");
    cy.visit("/ej-fra/index-one-column.html");
    cy.wait(["@text", "@audio", "@image"]);
    cy.readalong().within(() => {
      //is image above the text
      cy.get(".page")
        .first()
        .within(() => {
          cy.get(".image__container").then((imgContainer) => {
            cy.get(".page__col__text").then((textElement) => {
              expect(
                imgContainer[0].getBoundingClientRect().top,
              ).to.be.lessThan(textElement[0].getBoundingClientRect().top);
            });
          });
        });
    });
  });
});
