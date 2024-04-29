import { zip } from "./utils";

describe("zip", () => {
  it("should zip two arrays like Python does", () => {
    expect(
      zip([
        ["a", "b"],
        [1, 2],
      ]),
    ).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});
