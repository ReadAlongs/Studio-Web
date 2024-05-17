context("Testing end user enabled settings", () => {
  beforeEach(() => {
    cy.intercept(/\.readalong/).as("text");
    cy.intercept(/\.m4a/).as("audio");

    cy.visit("/ej-fra/");
    cy.wait(["@text", "@audio"]);
  });
  it("can open the settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings]").should("be.visible");
    });
  });
  it("can close the settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings]").should("be.visible");
      cy.get("[data-test-id=settings-close-button]").click();
      cy.get("[data-test-id=settings]").should("not.exist");
    });
  });
  it("can change  page animation settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings]").should("be.visible");
      cy.get("[data-test-id=settings-scroll-behavior]").should(
        "have.text",
        "check_box",
      );
      cy.get("[data-test-id=settings-scroll-behavior]").click();
      cy.get("[data-test-id=settings-scroll-behavior]").should(
        "have.text",
        "check_box_outline_blank",
      );
      cy.get("[data-test-id=settings-close-button]").click();
      cy.get("[data-test-id=settings]").should("not.exist");
    });
  });
  it("can change page turn settings", () => {
    cy.readalong().within(() => {
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings]").should("be.visible");
      cy.get("[data-test-id=settings-auto-pause]").should(
        "have.text",
        "check_box_outline_blank",
      );
      cy.get("[data-test-id=settings-auto-pause]").click();
      cy.get("[data-test-id=settings-auto-pause]").should(
        "have.text",
        "check_box",
      );
      cy.get("[data-test-id=settings-pause-timeout]").should("not.exist");
      cy.get("[data-test-id=settings-close-button]").click();
      cy.get("[data-test-id=settings]").should("not.exist");
      cy.playReadAlong();
      cy.wait(7000); //6740 timestamp of the first word on second page
      cy.get("#t0b0d1p0s0w0").should("not.be.visible");

      cy.get("[data-cy=play-button]").should("be.visible");
    });
  });
  it("can save user preference", () => {
    cy.readalong().within(() => {
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings]").should("be.visible");
      cy.get("[data-test-id=settings-auto-pause]").should(
        "have.text",
        "check_box_outline_blank",
      );
      cy.get("[data-test-id=settings-save").should("be.disabled");
      cy.get("[data-test-id=settings-auto-pause]").click();
      cy.get("[data-test-id=settings-auto-pause]").should(
        "have.text",
        "check_box",
      );
      cy.get("[data-test-id=settings-save").should("be.enabled").click();
      cy.get("[data-test-id=settings-close-button]").click();
      cy.reload();
      cy.get("[data-test-id=settings-button]").click();
      cy.get("[data-test-id=settings-auto-pause]").should(
        "have.text",
        "check_box",
      );

      //reset back to default
      cy.getAllLocalStorage();
    });
  });
});
