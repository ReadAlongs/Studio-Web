import { getSchema } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state";

import { readAlongExtensions } from "./nodes";
import { insertPageBreakCommand } from "./insert-page-break-command";

const schema = getSchema(readAlongExtensions);

function oneParagraphDoc(text: string) {
  return schema.nodes["doc"].createChecked(null, [
    schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text(text)),
    ]),
  ]);
}

function dispatchOf(state: EditorState) {
  let dispatched: ReturnType<EditorState["tr"]["scrollIntoView"]> | null = null;
  const ok = insertPageBreakCommand({
    state,
    dispatch: (tr) => (dispatched = tr),
  });
  return { ok, dispatched: dispatched as any };
}

describe("insertPageBreakCommand", () => {
  it("splits the paragraph mid-word and inserts the pagebreak between the halves, preserving all text, leaving the cursor at the start of the second half", () => {
    const doc = oneParagraphDoc("helloworld");
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    const { ok, dispatched } = dispatchOf(state);
    expect(ok).toBeTrue();

    const result = dispatched.doc;
    expect(result.childCount).toBe(3);
    expect(result.child(0).type.name).toBe("paragraph");
    expect(result.child(1).type.name).toBe("pagebreak");
    expect(result.child(2).type.name).toBe("paragraph");
    expect(result.child(0).textContent).toBe("hello");
    expect(result.child(2).textContent).toBe("world");
    expect(result.child(0).textContent + result.child(2).textContent).toBe(
      "helloworld",
    );

    const $cursor = result.resolve(dispatched.selection.from);
    expect($cursor.parent.type.name).toBe("sentence");
    expect($cursor.parent.textContent).toBe("world");
    expect($cursor.parentOffset).toBe(0);
  });

  it("inserts the pagebreak before the paragraph, without splitting, when the cursor is at the paragraph start, leaving the cursor at the start of that (pre-existing) paragraph", () => {
    const doc = oneParagraphDoc("hello");
    const pos = 2; // start of the (only) sentence
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    const { ok, dispatched } = dispatchOf(state);
    expect(ok).toBeTrue();

    const result = dispatched.doc;
    expect(result.childCount).toBe(2);
    expect(result.child(0).type.name).toBe("pagebreak");
    expect(result.child(1).type.name).toBe("paragraph");
    expect(result.child(1).textContent).toBe("hello");

    const $cursor = result.resolve(dispatched.selection.from);
    expect($cursor.parent.type.name).toBe("sentence");
    expect($cursor.parent.textContent).toBe("hello");
    expect($cursor.parentOffset).toBe(0);
  });

  it("inserts the pagebreak after the paragraph, and — since there's nothing after it — creates an empty paragraph and leaves the cursor there, ready to type the first line of the new page", () => {
    const doc = oneParagraphDoc("hello");
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    const { ok, dispatched } = dispatchOf(state);
    expect(ok).toBeTrue();

    const result = dispatched.doc;
    expect(result.childCount).toBe(3);
    expect(result.child(0).type.name).toBe("paragraph");
    expect(result.child(0).textContent).toBe("hello");
    expect(result.child(1).type.name).toBe("pagebreak");
    expect(result.child(2).type.name).toBe("paragraph");
    expect(result.child(2).textContent).toBe("");

    const $cursor = result.resolve(dispatched.selection.from);
    expect($cursor.parent.type.name).toBe("sentence");
    expect($cursor.parent.textContent).toBe("");
    // Confirms the cursor is inside the *new* (third) paragraph
    // specifically, not merely some empty sentence elsewhere.
    expect($cursor.node(1)).toBe(result.child(2));
  });

  it("does not create an empty paragraph when a pagebreak already follows (no double page break with nothing between)", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("hello")),
      ]),
      schema.nodes["pagebreak"].createChecked(),
    ]);
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    const { ok, dispatched } = dispatchOf(state);
    expect(ok).toBeTrue();

    const result = dispatched.doc;
    expect(result.childCount).toBe(4);
    const childTypes: string[] = [];
    result.forEach((node: PMNode) => childTypes.push(node.type.name));
    expect(childTypes).toEqual([
      "paragraph",
      "pagebreak",
      "paragraph",
      "pagebreak",
    ]);
  });

  it("reports capability without mutating anything when dispatch is omitted", () => {
    const doc = oneParagraphDoc("hello");
    const pos = 2 + 2;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    expect(insertPageBreakCommand({ state })).toBeTrue();
  });

  it("rejects insertion when an existing pagebreak node is selected (NodeSelection)", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("a")),
      ]),
      schema.nodes["pagebreak"].createChecked(),
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("b")),
      ]),
    ]);
    const pagebreakPos = doc.child(0).nodeSize;
    const state = EditorState.create({
      doc,
      selection: NodeSelection.create(doc, pagebreakPos),
    });
    expect(
      insertPageBreakCommand({
        state,
        dispatch: () => fail("should not dispatch"),
      }),
    ).toBeFalse();
  });

  it("rejects insertion on a non-collapsed (range) selection", () => {
    const doc = oneParagraphDoc("hello world");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2, 6),
    });
    expect(
      insertPageBreakCommand({
        state,
        dispatch: () => fail("should not dispatch"),
      }),
    ).toBeFalse();
  });
});
