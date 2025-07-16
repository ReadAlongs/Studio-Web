import WaveSurfer from "wavesurfer.js";

import { takeUntil, Subject, take } from "rxjs";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import SegmentsPlugin from "./segments";
import { Alignment, Components } from "@readalongs/web-component/loader";
import { B64Service } from "../b64.service";
import { FileService } from "../file.service";
import {
  readalong_editor_intro,
  readalong_editor_choose_file,
  readalong_editor_audio_toolbar,
  readalong_editor_file_loaded,
  readalong_editor_audio_toolbar_zoom,
  readalong_editor_audio_wav,
  readalong_export_step,
  readalong_add_translation_step,
  readalong_add_image_step,
  readalong_editor_fix_text,
} from "../shepherd.steps";
import { ShepherdService } from "../shepherd.service";
import { EditorService } from "./editor.service";
import { DownloadService } from "../shared/download/download.service";
import { SupportedOutputs } from "../ras.service";
import { ToastrService } from "ngx-toastr";
import { validateFileType } from "../utils/utils";
@Component({
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.sass"],
  standalone: false,
})
export class EditorComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild("wavesurferContainer") wavesurferContainer!: ElementRef;
  wavesurfer: WaveSurfer;
  @ViewChild("readalongContainer") readalongContainerElement: ElementRef;

  readalong: Components.ReadAlong;

  language: "eng" | "fra" | "spa" = "eng";

  // value passed to input[type=file] accept's attribute which expects
  // a comma separated list of file extensions or mime types.
  htmlUploadAccepts = ".html";

  unsubscribe$ = new Subject<void>();
  constructor(
    public b64Service: B64Service,
    private fileService: FileService,
    public shepherdService: ShepherdService,
    public editorService: EditorService,
    private toastr: ToastrService,
    private downloadService: DownloadService,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.wavesurfer = WaveSurfer.create({
      container: this.wavesurferContainer.nativeElement as HTMLElement,
      progressColor: "#999",
      waveColor: "#999",
      cursorColor: "red",
      plugins: [
        SegmentsPlugin.create({
          contentEditable: true,
        }),
      ],
      scrollParent: true,
      height: 200,
      minPxPerSec: 300, // FIXME: uncertain about this
    });
    this.loadAudioIntoWavesurferElement();

    // reload the temporary saved blob from the service
    if (this.editorService.temporaryBlob) {
      this.loadRasFile(this.editorService.temporaryBlob);
    }

    this.wavesurfer.on("segment-updated", async (segment, e) => {
      // Each time a segment is updated we have to update it in both the demo ReadAlong
      // as well as the XML. This is faster than just editing the XML and asking the
      // ReadAlong to re-render, which would create all the new audio sprites again etc
      // when we are just editing a single element at a time.
      if (e.action == "contentEdited") {
        this.setReadAlongText(segment.data.id, segment.data.text);
      }
      if (e.action == "resize") {
        // Update Demo Alignments (uses milliseconds)
        let alignments = await this.readalong.getAlignments();
        let dur = parseFloat(segment.end) - parseFloat(segment.start);
        let dur_ms = parseInt((dur * 1000).toFixed(0));
        let start_ms = parseInt((segment.start * 1000).toFixed(0));
        alignments[segment.data.id] = [start_ms, dur_ms];
        const new_al: Alignment = {};
        new_al[segment.data.id] = [start_ms, dur_ms];
        // Update XML alignments (uses seconds)
        if (this.editorService.rasControl$.value) {
          let changedSegment =
            this.editorService.rasControl$.value.getElementById(
              segment.data.id,
            );
          if (changedSegment) {
            changedSegment.setAttribute("time", segment.start);
            changedSegment.setAttribute("dur", dur.toString());
          }
        }
        await this.readalong.updateSpriteAlignments(alignments);
      }
    });
    this.wavesurfer.on("segment-click", (segment, e) => {
      e.stopPropagation();
      segment.play();
    });

    if (window.location.hash.endsWith("startTour=yes")) {
      this.startTour();
    }
  }

  ngOnInit(): void {}
  async ngOnDestroy() {
    // Save translations, images and all other edits to a temporary blob before destroying component
    // We just re-use the download service method here for simplicity and reload from this when
    // navigating back to the editor
    if (
      this.editorService.rasControl$.value &&
      this.editorService.audioB64Control$.value
    ) {
      this.editorService.temporaryBlob =
        await this.downloadService.createSingleFileBlob(
          this.editorService.rasControl$.value,
          this.readalong,
          this.editorService.slots,
          this.editorService.audioB64Control$.value,
        );
    }
  }

  download(download_type: SupportedOutputs) {
    if (
      this.editorService.audioB64Control$.value &&
      this.editorService.rasControl$.value
    ) {
      this.downloadService.download(
        download_type,
        this.editorService.audioB64Control$.value,
        this.editorService.rasControl$.value,
        this.editorService.slots,
        this.readalong,
        "Editor", //from
      );
    } else {
      this.toastr.error($localize`Download failed.`, $localize`Sorry!`, {
        timeOut: 10000,
      });
    }
  }

  async setReadAlongText(id: string, text: string) {
    // Update Demo text
    let readalongContainerElement = await this.readalong.getReadAlongElement();
    let changedSegment =
      readalongContainerElement.shadowRoot?.getElementById(id);
    if (changedSegment) {
      changedSegment.textContent = text;
    }
    // Update XML text
    if (this.editorService.rasControl$.value) {
      changedSegment = this.editorService.rasControl$.value.getElementById(id);
      if (changedSegment) {
        changedSegment.textContent = text; // innerText is not supported for XML documents
      }
    }
  }

  loadAudioIntoWavesurferElement() {
    if (this.editorService.audioControl$.value) {
      this.wavesurfer.loadBlob(this.editorService.audioControl$.value);
      this.wavesurfer.clearSegments();
      this.fileService
        .readFileAsData$(this.editorService.audioControl$.value)
        .pipe(take(1))
        .subscribe((audiob64) => {
          this.editorService.audioB64Control$.setValue(audiob64);
        });
    }
    if (this.editorService.rasControl$.value) {
      this.createSegments(this.editorService.rasControl$.value);
    }
  }

  onRasFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (!el.files || el.files.length !== 1) {
      return;
    }

    const file = el.files[0];
    if (validateFileType(file, this.htmlUploadAccepts)) {
      this.loadRasFile(file);
      return;
    }

    this.toastr.error(
      $localize`The file "${file.name}:fileName:" is not an HTML file.`,
      $localize`Sorry!`,
      { timeOut: 15000 },
    );
    el.value = "";
  }

  async loadRasFile(file: File | Blob) {
    const text = await file.text();
    const readalong = await this.parseReadalong(text);
    this.loadAudioIntoWavesurferElement();
    this.renderReadalong(readalong);
  }

  async renderReadalong(readalongBody: string | undefined) {
    if (readalongBody) {
      this.readalongContainerElement.nativeElement.innerHTML = readalongBody;
      const rasElement =
        this.readalongContainerElement.nativeElement.querySelector(
          "read-along",
        );
      // Get Title and Subtitle Slots
      let titleSlot = rasElement.querySelector(
        "span[slot='read-along-header']",
      );
      let subtitleSlot = rasElement.querySelector(
        "span[slot='read-along-subheader']",
      );

      if (titleSlot) {
        this.editorService.slots.title = titleSlot.innerText;
        titleSlot.setAttribute("contenteditable", true);
        // Because we're just loading this from the single-file HTML, it's cumbersome to
        // use Angular event input event listeners like we do in the demo
        titleSlot.addEventListener(
          "input",
          (ev: any) => (this.editorService.slots.title = ev.target?.innerHTML),
        );
      }
      if (subtitleSlot) {
        this.editorService.slots.subtitle = subtitleSlot.innerText;
        subtitleSlot.setAttribute("contenteditable", true);
        subtitleSlot.addEventListener(
          "input",
          (ev: any) =>
            (this.editorService.slots.subtitle = ev.target?.innerHTML),
        );
      }
      // Make Editable
      rasElement.setAttribute("mode", "EDIT");
      this.readalong = rasElement;
      const currentWord$ = await this.readalong.getCurrentWord();
      const alignments = await this.readalong.getAlignments();
      // Subscribe to the current word of the readalong and center the wavesurfer element on it
      currentWord$.pipe(takeUntil(this.unsubscribe$)).subscribe((word) => {
        if (word) {
          this.wavesurfer.seekAndCenter(
            alignments[word][0] / 1000 / this.wavesurfer.getDuration(),
          );
        }
      });
    }
  }

  async parseReadalong(text: string): Promise<string | undefined> {
    // This function is designed to parse three related things:
    //  - An Offline HTML file with the read-along HTML element with attributes href
    //    pointing to the .readalong file, and audio pointing to the audio file,
    //    normally both base64 encoded.
    //  - The .readalong XML file itself
    //  - An HTML file with the read-along HTML element and its audio attribute, but
    //    with the contents of the .readalong file included as descendant elements
    //    of the read-along HTML element.
    // This is why we look for audio and href attributes, and a text child element, but
    // don't expect to always find them.

    const parser = new DOMParser();
    const readalong = parser.parseFromString(text, "text/html");
    const element = readalong.querySelector("read-along");
    if (element === undefined || element === null) {
      return undefined;
    }

    // What is the appropriate source for the XML read along document? Either it was
    // encoded in the element's href attribute, or included as a child element of the
    // <read-along /> element.
    //
    // Prioritize the href implementation since it is more common.
    const href = element.getAttribute("href");
    if (href) {
      const reply = await fetch(href);
      if (reply.ok) {
        // FIXME: potential zip-bombing?
        let xmlString = await reply.text();
        if (!xmlString.startsWith("<?xml")) {
          xmlString = `<?xml version='1.0' encoding='utf-8'?>\n` + xmlString;
        }

        this.editorService.rasControl$.setValue(
          parser.parseFromString(xmlString, "application/xml"),
        );
      }
    } else {
      // Store the element as parsed XML
      // Create body element, which gets removed from the text element. This occurs
      // because the document was parsed with text/html mimetype which only allows
      // a single <body /> element as a child of <html />.
      let textNode = element.querySelector("text");
      if (textNode && !textNode.querySelector("body")) {
        const body = document.createElement("body");
        body.id = "t0b0";
        while (textNode.hasChildNodes()) {
          // @ts-ignore
          body.appendChild(textNode.firstChild);
        }
        textNode.appendChild(body);
      }

      // Similar issue, the document was parsed with a text/html mimetype, attributes
      // in HTML are always lowercased.
      const serializer = new XMLSerializer();
      let xmlString = serializer
        .serializeToString(element)
        .replace(/arpabet=/g, "ARPABET=") // Our DTD says ARPABET is upper case
        .replace(/xmlns="[\w\/\:\.]*"/g, ""); // Our DTD does not accept xmlns that the parser inserts
      if (!xmlString.startsWith("<?xml")) {
        xmlString = `<?xml version='1.0' encoding='utf-8'?>\n` + xmlString;
      }

      this.editorService.rasControl$.setValue(
        parser.parseFromString(xmlString, "application/xml"),
      ); // re-parse as XML
    }

    // Oh, there's an audio file, okay, try to load it
    const audio = element.getAttribute("audio");
    if (audio !== null) {
      const reply = await fetch(audio);
      // Did that work? Great!
      if (reply.ok) {
        const blob = await reply.blob();
        this.editorService.audioControl$.setValue(
          new File([blob], "test-audio.webm", { type: "audio/webm" }),
        );
      }
    }

    if (this.editorService.rasControl$.value) {
      this.createSegments(this.editorService.rasControl$.value);
    }

    return readalong.querySelector("body")?.innerHTML;
  }

  createSegments(element: Document) {
    this.wavesurfer.clearSegments();
    for (const w of Array.from(element.querySelectorAll("w[id]"))) {
      const wordText = w.textContent;
      const wordId = w.getAttribute("id");
      const startText = w.getAttribute("time");
      const durText = w.getAttribute("dur");
      if (wordText == null || startText == null || durText == null) continue;
      const startTime = parseFloat(startText);
      const endTime = startTime + parseFloat(durText);
      this.wavesurfer.addSegment({
        data: { id: wordId, text: wordText.trim() },
        start: startTime,
        end: endTime,
      });
    }
  }

  zoomIn() {
    this.wavesurfer.zoom(this.wavesurfer.params.minPxPerSec * 1.25);
  }

  zoomOut() {
    this.wavesurfer.zoom(this.wavesurfer.params.minPxPerSec / 1.25);
  }
  startTour(): void {
    this.shepherdService.defaultStepOptions = {
      classes: "",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
    };
    this.shepherdService.keyboardNavigation = false;
    readalong_editor_choose_file["buttons"][1]["action"] = () => {
      this.fileService
        .returnFileFromPath$("assets/hello-world.offline.html")
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(async (indexFile) => {
          await this.loadRasFile(indexFile);
          console.log(
            document
              .querySelector("#wavesurferContainer")
              ?.querySelector(".segment-content"),
            document
              .querySelector("#readalongContainer")
              ?.querySelector("read-along"),
          );
          this.shepherdService.next();
          readalong_add_image_step["attachTo"] = {
            element: document
              .querySelector("#readalongContainer")
              ?.querySelector("read-along")
              ?.shadowRoot?.querySelector("div.drop-area"),
            on: "bottom",
          };
          readalong_add_translation_step["attachTo"] = {
            element: document
              .querySelector("#readalongContainer")
              ?.querySelector("read-along")
              ?.shadowRoot?.querySelector("div.sentence"),
            on: "bottom",
          };
          readalong_editor_audio_wav["attachTo"] = {
            element: document
              .querySelector("#wavesurferContainer")
              ?.querySelector(".wavesurfer-segment"),
            on: "top",
          };
          readalong_editor_fix_text["attachTo"] = {
            element: document
              .querySelector("#wavesurferContainer")
              ?.querySelector(".segment-content"),
            on: "bottom-start",
          };
          this.shepherdService.addSteps([
            readalong_editor_file_loaded,
            readalong_add_image_step,
            readalong_add_translation_step,
            readalong_editor_audio_toolbar,
            readalong_editor_audio_toolbar_zoom,
            readalong_editor_audio_wav,
            readalong_editor_fix_text,
            readalong_export_step,
          ]);
          this.shepherdService.start();
        });
    };
    this.shepherdService.modal = true;
    this.shepherdService.confirmCancel = false;
    readalong_export_step["buttons"][1]["type"] = "cancel";
    readalong_export_step["buttons"][1]["text"] = $localize`Close`;
    this.shepherdService.addSteps([
      readalong_editor_intro,
      readalong_editor_choose_file,
    ]);
    this.shepherdService.start();
  }
}
