import { getSchema } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

import { readAlongExtensions } from "../schema/nodes";
import {
  applyErrorHighlightTransaction,
  errorHighlightPluginKey,
} from "./error-highlight-extension";

const schema: Schema = getSchema(readAlongExtensions);

function docOf(text: string) {
  return schema.nodes["doc"].createChecked(null, [
    schema.nodes["paragraph"].createChecked(null, [
      schema.nodes["sentence"].createChecked(null, schema.text(text)),
    ]),
  ]);
}

describe("applyErrorHighlightTransaction", () => {
  it("passes an unrelated transaction through unchanged", () => {
    const state = EditorState.create({ doc: docOf("hello world") });
    const decorations = DecorationSet.empty;
    const result = applyErrorHighlightTransaction(state.tr, decorations);
    expect(result).toBe(decorations);
  });

  it("builds a decoration set from a setErrorRanges meta", () => {
    const doc = docOf("hello world");
    const state = EditorState.create({ doc });
    // "world" is at position 8..13 (doc-start 0, paragraph 1, sentence
    // text-start 2, "hello "=6 chars -> 2+6=8, +5="world".length=13).
    const tr = state.tr.setMeta(errorHighlightPluginKey, [{ from: 8, to: 13 }]);
    const result = applyErrorHighlightTransaction(tr, DecorationSet.empty);
    const found = result.find();
    expect(found.length).toBe(1);
    expect(found[0].from).toBe(8);
    expect(found[0].to).toBe(13);
  });

  it("shifts a flagged range across an edit elsewhere in the doc", () => {
    const doc = docOf("hello world");
    let state = EditorState.create({ doc });
    let tr = state.tr.setMeta(errorHighlightPluginKey, [{ from: 8, to: 13 }]);
    let decorations = applyErrorHighlightTransaction(tr, DecorationSet.empty);
    state = state.apply(tr);

    // Insert "XX" before "hello", shifting "world" 2 positions to the right.
    tr = state.tr.insertText("XX", 2);
    decorations = applyErrorHighlightTransaction(tr, decorations);
    state = state.apply(tr);

    const found = decorations.find();
    expect(found.length).toBe(1);
    expect(state.doc.textBetween(found[0].from, found[0].to)).toBe("world");
  });

  it("drops a flagged range once its word is deleted", () => {
    const doc = docOf("hello world");
    let state = EditorState.create({ doc });
    let tr = state.tr.setMeta(errorHighlightPluginKey, [{ from: 8, to: 13 }]);
    let decorations = applyErrorHighlightTransaction(tr, DecorationSet.empty);
    state = state.apply(tr);

    tr = state.tr.delete(8, 13);
    decorations = applyErrorHighlightTransaction(tr, decorations);

    expect(decorations.find().length).toBe(0);
  });

  it("drops a flagged range once its word is edited into different text", () => {
    const doc = docOf("hello world");
    let state = EditorState.create({ doc });
    let tr = state.tr.setMeta(errorHighlightPluginKey, [{ from: 8, to: 13 }]);
    let decorations = applyErrorHighlightTransaction(tr, DecorationSet.empty);
    state = state.apply(tr);

    // Replace "world" with "there".
    tr = state.tr.insertText("there", 8, 13);
    decorations = applyErrorHighlightTransaction(tr, decorations);

    expect(decorations.find().length).toBe(0);
  });

  it("keeps an unrelated flagged range when a different word elsewhere is edited", () => {
    const doc = docOf("one two three");
    let state = EditorState.create({ doc });
    const words = { one: [2, 5], two: [6, 9], three: [10, 15] };
    let tr = state.tr.setMeta(errorHighlightPluginKey, [
      { from: words.two[0], to: words.two[1] },
    ]);
    let decorations = applyErrorHighlightTransaction(tr, DecorationSet.empty);
    state = state.apply(tr);

    // Edit "one" -> "1", well before "two".
    tr = state.tr.insertText("1", 2, 5);
    decorations = applyErrorHighlightTransaction(tr, decorations);
    state = state.apply(tr);

    const found = decorations.find();
    expect(found.length).toBe(1);
    expect(state.doc.textBetween(found[0].from, found[0].to)).toBe("two");
  });
});
