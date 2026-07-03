import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection } from "@tiptap/pm/state";

import { readAlongExtensions } from "./nodes";
import { pasteTextCommand } from "./paste-extension";

const schema = getSchema(readAlongExtensions);

function dispatchOf(state: EditorState, text: string) {
  let dispatched: ReturnType<EditorState["tr"]["scrollIntoView"]> | null = null;
  const ok = pasteTextCommand(
    { state, dispatch: (tr) => (dispatched = tr) },
    text,
  );
  return { ok, dispatched: dispatched as any };
}

describe("pasteTextCommand", () => {
  it("populates an empty doc with the blank-line convention's paragraph/sentence/page structure", () => {
    const state = EditorState.create({
      doc: schema.nodes["doc"].createAndFill()!,
    });
    const { ok, dispatched } = dispatchOf(
      state,
      "This is a test.\nSentence.\n\nParagraph.\n\n\nPage.",
    );
    expect(ok).toBeTrue();

    const result = dispatched.doc;
    expect(result.childCount).toBe(4);
    expect(result.child(0).type.name).toBe("paragraph");
    expect(result.child(0).childCount).toBe(2);
    expect(result.child(0).child(0).textContent).toBe("This is a test.");
    expect(result.child(0).child(1).textContent).toBe("Sentence.");
    expect(result.child(1).type.name).toBe("paragraph");
    expect(result.child(1).textContent).toBe("Paragraph.");
    expect(result.child(2).type.name).toBe("pagebreak");
    expect(result.child(3).type.name).toBe("paragraph");
    expect(result.child(3).textContent).toBe("Page.");
  });

  it("splits the surrounding paragraph when pasting mid-document, rather than merging into one run-on sentence", () => {
    const doc = schema.nodes["doc"].createChecked(null, [
      schema.nodes["paragraph"].createChecked(null, [
        schema.nodes["sentence"].createChecked(null, schema.text("helloworld")),
      ]),
    ]);
    const pos = 2 + "hello".length;
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, pos),
    });
    const { ok, dispatched } = dispatchOf(state, "PASTED");

    expect(ok).toBeTrue();
    const result = dispatched.doc;
    // "hello" + pasted paragraph("PASTED") + "world", as three top-level
    // nodes (the paste's closed slice splits the original paragraph).
    expect(result.childCount).toBe(3);
    expect(result.child(0).textContent).toBe("hello");
    expect(result.child(1).textContent).toBe("PASTED");
    expect(result.child(2).textContent).toBe("world");
  });

  it("reports capability without mutating anything when dispatch is omitted", () => {
    const state = EditorState.create({
      doc: schema.nodes["doc"].createAndFill()!,
    });
    expect(pasteTextCommand({ state }, "Some text.")).toBeTrue();
  });
});
