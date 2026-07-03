import { getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

import { readAlongExtensions } from "./nodes";
import {
  canSplitIntoNewParagraph,
  splitIntoNewParagraph,
} from "./split-into-new-paragraph";

const schema = getSchema(readAlongExtensions);

function oneParagraphDoc(text: string) {
  return schema.nodes["doc"].createChecked(null, [
    schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text(text)),
    ]),
  ]);
}

describe("splitIntoNewParagraph", () => {
  it("splits a sentence mid-word into a new paragraph, preserving all text", () => {
    const doc = oneParagraphDoc("helloworld");
    const state = EditorState.create({ doc });
    // Position right after "hello" (5 chars in): doc(0) paragraph(1)
    // sentence(2) "hello|world" -> pos = 1 (into paragraph) + 1 (into
    // sentence) + 5 (chars) = 7.
    const pos = 7;
    const tr = state.tr;
    const ok = splitIntoNewParagraph(tr, pos);
    expect(ok).toBeTrue();

    const doc2 = tr.doc;
    expect(doc2.childCount).toBe(2);
    expect(doc2.child(0).type.name).toBe("paragraph");
    expect(doc2.child(1).type.name).toBe("paragraph");
    expect(doc2.child(0).textContent).toBe("hello");
    expect(doc2.child(1).textContent).toBe("world");
    // No corruption: concatenating the two halves reproduces the original.
    expect(doc2.child(0).textContent + doc2.child(1).textContent).toBe(
      "helloworld",
    );
  });

  it("splits cleanly at the very start of a sentence (empty first half)", () => {
    const doc = oneParagraphDoc("world");
    const state = EditorState.create({ doc });
    const pos = 2; // doc(0) paragraph(1) sentence(2) |world
    const tr = state.tr;
    expect(splitIntoNewParagraph(tr, pos)).toBeTrue();
    expect(tr.doc.child(0).textContent).toBe("");
    expect(tr.doc.child(1).textContent).toBe("world");
  });

  it("splits cleanly at the very end of a sentence (empty second half)", () => {
    const doc = oneParagraphDoc("hello");
    const state = EditorState.create({ doc });
    const pos = 2 + "hello".length;
    const tr = state.tr;
    expect(splitIntoNewParagraph(tr, pos)).toBeTrue();
    expect(tr.doc.child(0).textContent).toBe("hello");
    expect(tr.doc.child(1).textContent).toBe("");
  });

  it("reports splittable positions via canSplitIntoNewParagraph without mutating anything", () => {
    const doc = oneParagraphDoc("hello");
    expect(canSplitIntoNewParagraph(doc, 4)).toBeTrue();
  });

  it("refuses to split at a position outside any sentence (e.g. at the doc boundary)", () => {
    const doc = oneParagraphDoc("hello");
    const state = EditorState.create({ doc });
    const tr = state.tr;
    expect(splitIntoNewParagraph(tr, 0)).toBeFalse();
    expect(tr.doc).toBe(doc);
  });
});
