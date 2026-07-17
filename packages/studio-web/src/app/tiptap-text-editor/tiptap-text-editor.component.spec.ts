import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TiptapTextEditorComponent } from "./tiptap-text-editor.component";
import { docToReadAlongXml } from "./schema/serializers";
import { MaterialModule } from "../material.module";

describe("TiptapTextEditorComponent", () => {
  let component: TiptapTextEditorComponent;
  let fixture: ComponentFixture<TiptapTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [TiptapTextEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TiptapTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("normalizes a paste with a multi-blank-line gap into proportional empty paragraphs, not a page break", () => {
    // Pastes directly into the freshly-created, still-empty editor —
    // exercises the isEmpty branch in handlePaste, not just the
    // normalization logic (already covered by serializers.spec.ts).
    const editor = (component as any).editor;
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "Hello world.\n\n\nGoodbye world.");
    editor.view.dom.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      }),
    );

    const blocks = editor.getJSON().content.map((node: any) => ({
      type: node.type,
      sentenceCount: node.content?.length ?? 0,
    }));
    expect(blocks).toEqual([
      { type: "paragraph", sentenceCount: 1 },
      { type: "paragraph", sentenceCount: 0 },
      { type: "paragraph", sentenceCount: 0 },
      { type: "paragraph", sentenceCount: 1 },
    ]);
  });

  it("leaves a paragraph to type into after inserting a page break at the end of the doc", () => {
    const editor = (component as any).editor;
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "sentence",
              content: [{ type: "text", text: "Page one." }],
            },
          ],
        },
      ],
    });
    editor.commands.focus("end");

    component.insertPageBreak();

    const blocks = editor.getJSON().content.map((node: any) => node.type);
    expect(blocks).toEqual(["paragraph", "pagebreak", "paragraph"]);
    // The cursor must land inside that trailing paragraph's sentence, not
    // e.g. remain a NodeSelection on the pagebreak, so typing works.
    expect(editor.state.selection.$from.parent.type.name).toBe("sentence");
  });

  it("adds a paragraph to type into when Enter is pressed on a selected trailing page break", () => {
    const editor = (component as any).editor;
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "sentence",
              content: [{ type: "text", text: "Page one." }],
            },
          ],
        },
        { type: "pagebreak" },
      ],
    });
    const pagebreakPos = editor.state.doc.content.firstChild.nodeSize;
    editor.commands.setNodeSelection(pagebreakPos);
    expect(editor.state.selection.node.type.name).toBe("pagebreak");

    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    const blocks = editor.getJSON().content.map((node: any) => node.type);
    expect(blocks).toEqual(["paragraph", "pagebreak", "paragraph"]);
    expect(editor.state.selection.$from.parent.type.name).toBe("sentence");
  });

  it("turns Enter-on-an-empty-line into a paragraph break while typing live", () => {
    const editor = (component as any).editor;
    const pressEnter = () =>
      editor.view.dom.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );

    // "hello" [Enter] "hello" [Enter][Enter] "hello" [Enter][Enter][Enter] "hello"
    editor.commands.focus("end");
    editor.commands.insertContent("hello");
    pressEnter();
    editor.commands.insertContent("hello");
    pressEnter();
    pressEnter();
    editor.commands.insertContent("hello");
    pressEnter();
    pressEnter();
    pressEnter();
    editor.commands.insertContent("hello");

    const xml = docToReadAlongXml(editor.state.doc);
    expect(xml).toContain(
      '<body><div type="page">' +
        "<p><s>hello</s><s>hello</s></p>" +
        "<p><s>hello</s></p>" +
        "<p><s></s></p>" +
        "<p><s>hello</s></p>" +
        "</div></body>",
    );
  });
});
