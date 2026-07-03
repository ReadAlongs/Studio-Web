import { getSchema } from "@tiptap/core";
import { EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state";

import { readAlongExtensions } from "./nodes";
import { enterCommand, shiftEnterCommand } from "./keymap-extension";

const schema = getSchema(readAlongExtensions);

function docWithTwoSentences(a: string, b: string) {
  return schema.nodes["doc"].createChecked(null, [
    schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text(a)),
      schema.nodes["sentence"].createChecked(null, schema.text(b)),
    ]),
  ]);
}

describe("enterCommand", () => {
  it("splits into a new paragraph at the cursor, preserving text on both sides", () => {
    const doc = docWithTwoSentences("hello world", "second sentence");
    // Cursor between "hello" and " world" (pos 2 for sentence start + 5).
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    let dispatched: any = null;
    const ok = enterCommand({
      state,
      dispatch: (tr) => (dispatched = tr),
    });
    expect(ok).toBeTrue();
    expect(dispatched).not.toBeNull();
    expect(dispatched.doc.childCount).toBe(2);
    expect(dispatched.doc.child(0).textContent).toBe("hello");
    // Second paragraph's first sentence has the split remainder, followed
    // by the original second sentence untouched.
    expect(dispatched.doc.child(1).textContent).toBe(" worldsecond sentence");
  });

  it("reports capability without mutating state when dispatch is omitted", () => {
    const doc = docWithTwoSentences("hello", "world");
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    expect(enterCommand({ state })).toBeTrue();
  });

  it("no-ops on a non-collapsed (range) selection", () => {
    const doc = docWithTwoSentences("hello", "world");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2, 4),
    });
    expect(
      enterCommand({ state, dispatch: () => fail("should not dispatch") }),
    ).toBeFalse();
  });

  it("no-ops when a pagebreak node is selected (NodeSelection, not inside a sentence)", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("a")),
      ]),
      schema.nodes["pagebreak"].createChecked(),
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("b")),
      ]),
    ]);
    const pagebreakPos = doc.child(0).nodeSize; // start of the pagebreak node
    const state = EditorState.create({
      doc,
      selection: NodeSelection.create(doc, pagebreakPos),
    });
    expect(
      enterCommand({ state, dispatch: () => fail("should not dispatch") }),
    ).toBeFalse();
  });
});

describe("shiftEnterCommand", () => {
  it("splits a new sentence within the same paragraph, preserving text on both sides", () => {
    const doc = docWithTwoSentences("helloworld", "next");
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    let dispatched: any = null;
    const ok = shiftEnterCommand({
      state,
      dispatch: (tr) => (dispatched = tr),
    });
    expect(ok).toBeTrue();
    expect(dispatched.doc.childCount).toBe(1); // still one paragraph
    const paragraph = dispatched.doc.child(0);
    expect(paragraph.childCount).toBe(3); // "hello" / "world" / "next"
    expect(paragraph.child(0).textContent).toBe("hello");
    expect(paragraph.child(1).textContent).toBe("world");
    expect(paragraph.child(2).textContent).toBe("next");
  });

  it("no-ops on a non-collapsed selection", () => {
    const doc = docWithTwoSentences("hello", "world");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2, 4),
    });
    expect(
      shiftEnterCommand({ state, dispatch: () => fail("should not dispatch") }),
    ).toBeFalse();
  });
});
