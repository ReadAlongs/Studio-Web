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

@Component({
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.sass"],
})
export class EditorComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild("wavesurferContainer") wavesurferContainer!: ElementRef;
  wavesurfer: WaveSurfer;
  audio_input: HTMLInputElement;
  ras_input: HTMLInputElement;
  zoom_in: HTMLButtonElement;
  zoom_out: HTMLButtonElement;
  $downloadable = new BehaviorSubject(false);
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
  currentWaveSurferCenter = new Subject<number>();
  constructor(
    private _formBuilder: FormBuilder,
    public b64Service: B64Service,
    private fileService: FileService,
    private toastr: ToastrService,
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
    // this.loadSampleAudio(); // Just for mocking
    this.ras_input = document.getElementById("ras-input") as HTMLInputElement;
    this.zoom_in = document.getElementById("zoom-in") as HTMLButtonElement;
    this.zoom_out = document.getElementById("zoom-out") as HTMLButtonElement;
  }
  async loadSampleAudio() {
    const sampleAudio = await fetch(
      "https://roedoejet.github.io/wmrc-gitksan/audio/aluu-VG.mp3",
    ).then((r) => r.blob());
    this.audioControl$.setValue(
      new File([sampleAudio], "test.webm", { type: "audio/webm" }),
    );
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
      if (e.action == "contentEdited") {
        let readalongContainerElement =
          await this.readalong.getReadAlongElement();
        let changedSegment =
          readalongContainerElement.shadowRoot?.getElementById(segment.data.id);
        if (changedSegment) {
          changedSegment.innerText = segment.data.text;
        }
      }
      if (e.action == "resize") {
        let alignments = await this.readalong.getAlignments();
        let start = parseFloat((segment.start * 1000).toFixed(0));
        let end = parseFloat((segment.end * 1000).toFixed(0));
        alignments[segment.data.id] = [start, end];
        const new_al: Alignment = {};
        new_al[segment.data.id] = [start, end];
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

  onAudioFileSelected(event: any) {
    let file: File = event.target.files[0];
    if (file.type == "video/webm") {
      // No, it is audio, because we say so.
      file = new File([file], file.name, { type: "audio/webm" });
    }
    this.audioControl$.setValue(file);
    this.toastr.success(
      $localize`File ` +
        file.name +
        $localize` processed, but not uploaded. Your audio will stay on your computer.`,
      $localize`Great!`,
      { timeOut: 10000 },
    );
  }

  async onRasFileSelected(event: any) {
    let file: File = event.target.files[0];
    const text = await file.text();
    await this.parseReadalong(text);
  }

  async parseReadalong(text: string): Promise<Document | null> {
    const parser = new DOMParser();
    const readalong = parser.parseFromString(text, "text/html");
    this.rasControl$.setValue(readalong);
    const element = readalong.querySelector("read-along");
    if (element === null) return null;
    // We can always download *something* (FIXME: will reconsider)
    this.$downloadable.next(true);
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
        // Clear previously selected file
        this.$downloadable.next(false);
      }
    }
    // Is read-along linked (including data URI) or embedded?
    const href = element.getAttribute("href");
    if (href === null) this.createSegments(element);
    else {
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
      this.slots.title = rasElement.querySelector(
        "span[slot='read-along-header']",
      ).innerText;
      this.slots.subtitle = rasElement.querySelector(
        "span[slot='read-along-subheader']",
      ).innerText;
      // Make Editable
      rasElement.setAttribute("mode", "EDIT");
      this.readalong = rasElement;
      const currentWord$ = await this.readalong.getCurrentWord();
      const alignments = await this.readalong.getAlignments();
      // Subscribe to the current word of the readalong and center the wavesurfer element on it
      currentWord$
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((word) =>
          this.wavesurfer.seekAndCenter(
            alignments[word][0] / 1000 / this.wavesurfer.getDuration(),
          ),
        );
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
}
