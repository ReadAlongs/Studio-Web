context("The Readalong Component", () => {
  /**
   * Wait for the audio and the SMIL to load.
   */

    // not needed using intercept now
  const EXPECTED_LOADING_TIME = 2000; // ms

  const FOR_PAGE_TURN_ANIMATION = 500; // ms
  const FOR_ERIC_TO_TALK_A_BIT = 3000; // ms
  const FOR_ERIC_TO_TALK_A_BIT_LESS = 1500; // ms

  beforeEach(() => {
    cy.intercept(/\.js/).as('page')
    cy.intercept(/\.m4a/).as('audio')
    cy.visit("/ej-fra/");
    cy.wait('@page')
    cy.wait('@audio')
  });

  it("should load successfully", () => {
    cy.readalongElement().should("be.visible");

    cy.readalong().within(() => {
      cy.contains("Page");
    });
  });

  it("should play the entire ReadAlong", () => {

    cy.wait(EXPECTED_LOADING_TIME);

    cy.readalong().within(() => {
      cy.get("[data-cy=play-button]").click();
      cy.wait(FOR_ERIC_TO_TALK_A_BIT);
      cy.get("[data-cy=stop-button]").click();
    });
  });

  it("should play a single word when clicked", () => {
    cy.wait(EXPECTED_LOADING_TIME);

    cy.readalong().contains("technologies").click();
  });

  describe("the progress bar", () => {
    it("should skip ahead when clicked", () => {
      cy.wait(EXPECTED_LOADING_TIME);

      cy.readalong().within(() => {
        cy.get("[data-cy=play-button]").click();
        cy.get("[data-cy=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "1");

        cy.get("[data-cy=progress-bar]")
          .as("progress-bar")
          .then((el) => {
            // click 3/4 of the way in the readalong (should be second page)
            cy.get("@progress-bar").click(el.width() * 0.75, el.height() * 0.5);
          });
        cy.get("[data-cy=stop-button]").click();
        cy.wait(FOR_PAGE_TURN_ANIMATION);

        cy.get("[data-cy=page-count__current]")
          .filter("*:visible")
          .invoke("text")
          .should("eq", "2");
      });
    });
  });

  describe("stress test the internal states", () => {
    it("randomly click words and try to do play back", () => {
      cy.wait(EXPECTED_LOADING_TIME)
      const ids = ["t0b0d0p0s0w0",
        "t0b0d0p0s1w0", "t0b0d0p0s1w1", "t0b0d0p0s1w2", "t0b0d0p0s1w3", "t0b0d0p0s1w4",
        "t0b0d0p0s2w0", "t0b0d0p0s2w1", "t0b0d0p0s2w2", "t0b0d0p0s2w3", "t0b0d0p0s2w4", "t0b0d0p0s2w5", "t0b0d0p0s2w6", "t0b0d0p0s2w7", "t0b0d0p0s2w8", "t0b0d0p0s2w9", "t0b0d0p0s2w10", "t0b0d0p0s2w11", "t0b0d0p0s2w12", "t0b0d0p0s2w13", "t0b0d0p0s2w14", "t0b0d0p0s2w15",
        "t0b0d1p0s0w0", "t0b0d1p0s0w1", "t0b0d1p0s0w2", "t0b0d1p0s0w3", "t0b0d1p0s0w4", "t0b0d1p0s0w5", "t0b0d1p0s0w6", "t0b0d1p0s0w7", "t0b0d1p0s0w8", "t0b0d1p0s0w9", "t0b0d1p0s0w10", "t0b0d1p0s0w11", "t0b0d1p0s0w12", "t0b0d1p0s0w13", "t0b0d1p0s0w14", "t0b0d1p0s0w15", "t0b0d1p0s0w16", "t0b0d1p0s0w17", "t0b0d1p0s0w18", "t0b0d1p0s0w19", "t0b0d1p0s0w20", "t0b0d1p0s0w21", "t0b0d1p0s0w22",
        "t0b0d1p0s1w0", "t0b0d1p0s1w1", "t0b0d1p0s1w2", "t0b0d1p0s1w3", "t0b0d1p0s1w4", "t0b0d1p0s1w5", "t0b0d1p0s1w6", "t0b0d1p0s1w7", "t0b0d1p0s1w8", "t0b0d1p0s1w9", "t0b0d1p0s1w10", "t0b0d1p0s1w11", "t0b0d1p0s1w12", "t0b0d1p0s1w13", "t0b0d1p0s1w14", "t0b0d1p0s1w15", "t0b0d1p0s1w16", "t0b0d1p0s1w17", "t0b0d1p0s1w18",
        "t0b0d1p0s2w0", "t0b0d1p0s2w1", "t0b0d1p0s2w2", "t0b0d1p0s2w3", "t0b0d1p0s2w4", "t0b0d1p0s2w5", "t0b0d1p0s2w6", "t0b0d1p0s2w7", "t0b0d1p0s2w8", "t0b0d1p0s2w9", "t0b0d1p0s2w10", "t0b0d1p0s2w11", "t0b0d1p0s2w12", "t0b0d1p0s2w13", "t0b0d1p0s2w14", "t0b0d1p0s2w15", "t0b0d1p0s2w16", "t0b0d1p0s2w17", "t0b0d1p0s2w18", "t0b0d1p0s2w19",
        "t0b0d1p1s0w0", "t0b0d1p1s0w1", "t0b0d1p1s0w2", "t0b0d1p1s0w3", "t0b0d1p1s0w4", "t0b0d1p1s0w5", "t0b0d1p1s0w6", "t0b0d1p1s0w7", "t0b0d1p1s0w8", "t0b0d1p1s0w9", "t0b0d1p1s0w10", "t0b0d1p1s0w11", "t0b0d1p1s0w12", "t0b0d1p1s0w13", "t0b0d1p1s0w14",

      ];
      const numOfTest = 4;
      for (let t = 0; t < numOfTest; t++) {
        cy.log("running test " + t)

        let randomIDs = [];
        for (let i = 0; i < 6; i++) {
          randomIDs.push(ids[Math.floor(Math.random() * (ids.length - 1))])
        }
        cy.readalong().within(() => {
          cy.log("clicking " + randomIDs.length + " words")
          for (const randomID of randomIDs) {
            cy.get("#" + randomID).click()
            cy.wait(Math.ceil(Math.random() * 150))//simulate how long it take a person to click another item
          }

          cy.get("[data-cy=play-button]").click();
          cy.wait(FOR_ERIC_TO_TALK_A_BIT_LESS)
          cy.get("[data-cy=play-button]").click();
          randomIDs = [];
          for (let i = 0; i < 6; i++) {
            randomIDs.push(ids[Math.floor(Math.random() * (ids.length - 1))])
          }
          cy.log("clicking " + randomIDs.length + " words")
          for (const randomID of randomIDs) {
            cy.get("#" + randomID).click()
            cy.wait(Math.ceil(Math.random() * 250))//simulate how long it take a person to click another item
          }
          cy.get("[data-cy=play-button]").click();
          cy.wait(FOR_ERIC_TO_TALK_A_BIT_LESS)
          cy.get("[data-cy=stop-button]").click();

        })
        cy.log("completed test " + t)
      }
    })
  })

});
