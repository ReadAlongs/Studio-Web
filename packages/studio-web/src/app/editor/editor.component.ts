import WaveSurfer from "wavesurfer.js";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { BehaviorSubject, takeUntil, Subject, combineLatest, take } from "rxjs";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import SegmentsPlugin, { Segment } from "./segments";
import { ReadAlongSlots } from "../ras.service";
import { Alignment, Components } from "@readalongs/web-component/loader";
import { B64Service } from "../b64.service";
import { ToastrService } from "ngx-toastr";
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
@Component({
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.sass"],
})
export class EditorComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild("wavesurferContainer") wavesurferContainer!: ElementRef;
  wavesurfer: WaveSurfer;
  @ViewChild("readalongContainer") readalongContainerElement: ElementRef;
  audioControl$ = new FormControl<File | null>(null, Validators.required);
  rasControl$ = new FormControl<Document | null>(null, Validators.required);
  readalong: Components.ReadAlong;
  slots: ReadAlongSlots = {
    title: "Title",
    subtitle: "Subtitle",
  };
  language: "eng" | "fra" | "spa" = "eng";
  audioB64Control$ = new FormControl<string | null>(null, Validators.required);
  public uploadFormGroup = this._formBuilder.group({
    audio: this.audioControl$,
    ras: this.rasControl$,
    audioB64: this.audioB64Control$,
  });
  unsubscribe$ = new Subject<void>();
  constructor(
    private _formBuilder: FormBuilder,
    public b64Service: B64Service,
    private fileService: FileService,
    private toastr: ToastrService,
    public shepherdService: ShepherdService,
  ) {
    this.audioControl$.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((audioFile) => {
        // If an audio file is loaded, then load the blob to wave surfer and clear any segments
        if (audioFile) {
          this.wavesurfer.loadBlob(audioFile);
          this.wavesurfer.clearSegments();
          this.fileService
            .readFileAsData$(audioFile)
            .pipe(take(1))
            .subscribe((audiob64) => {
              this.audioB64Control$.setValue(audiob64);
            });
        }
      });
  }

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
    this.wavesurfer.on("segment-updated", async (segment, e) => {
      // Each time a segment is updated we have to update it in both the demo ReadAlong
      // as well as the XML. This is faster than just editing the XML and asking the
      // ReadAlong to re-render, which would create all the new audio sprites again etc
      // when we are just editing a single element at a time.
      if (e.action == "contentEdited") {
        // Update Demo text
        let readalongContainerElement =
          await this.readalong.getReadAlongElement();
        let changedSegment =
          readalongContainerElement.shadowRoot?.getElementById(segment.data.id);
        if (changedSegment) {
          changedSegment.innerHTML = segment.data.text;
        }
        // Update XML text
        if (this.rasControl$.value) {
          changedSegment = this.rasControl$.value.getElementById(
            segment.data.id,
          );
          if (changedSegment) {
            changedSegment.innerHTML = segment.data.text;
          }
        }
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
        if (this.rasControl$.value) {
          let changedSegment = this.rasControl$.value.getElementById(
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
  }
  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  async onRasFileSelected(event: any) {
    let file: File = event.target.files[0];
    const text = await file.text();
    await this.parseReadalong(text);
  }

  async parseReadalong(text: string): Promise<Document | null> {
    const parser = new DOMParser();
    const readalong = parser.parseFromString(text, "text/html");
    const element = readalong.querySelector("read-along");
    if (element === null) return null;

    // Store the element as parsed XML
    // Create missing body element
    const body = document.createElement("body");
    body.id = "t0b0";
    const textNode = element.children[0];
    if (textNode) {
      while (textNode.hasChildNodes()) {
        // @ts-ignore
        body.appendChild(textNode.firstChild);
      }
      textNode.appendChild(body);
    }
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(element);
    this.rasControl$.setValue(parser.parseFromString(xmlString, "text/xml")); // re-parse as XML

    // Oh, there's an audio file, okay, try to load it
    const audio = element.getAttribute("audio");
    if (audio !== null) {
      const reply = await fetch(audio);
      // Did that work? Great!
      if (reply.ok) {
        const blob = await reply.blob();
        this.audioControl$.setValue(
          new File([blob], "test-audio.webm", { type: "audio/webm" }),
        );
      }
    }
    // Is read-along linked (including data URI) or embedded?
    const href = element.getAttribute("href");
    if (href === null) {
      this.createSegments(element);
    } else {
      const reply = await fetch(href);
      if (reply.ok) {
        const text2 = await reply.text();
        // FIXME: potential zip-bombing?
        this.parseReadalong(text2);
      }
    }
    let readalongBody = readalong.querySelector("body")?.innerHTML;
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
        this.slots.title = titleSlot.innerText;
        titleSlot.setAttribute("contenteditable", true);
        // Because we're just loading this from the single-file HTML, it's cumbersome to
        // use Angular event input event listeners like we do in the demo
        titleSlot.addEventListener(
          "input",
          (ev: any) => (this.slots.title = ev.target?.innerHTML),
        );
      }
      if (subtitleSlot) {
        this.slots.subtitle = subtitleSlot.innerText;
        subtitleSlot.setAttribute("contenteditable", true);
        subtitleSlot.addEventListener(
          "input",
          (ev: any) => (this.slots.subtitle = ev.target?.innerHTML),
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
    return readalong;
  }

  createSegments(element: Element) {
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
          await this.onRasFileSelected({ target: { files: [indexFile] } });
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
