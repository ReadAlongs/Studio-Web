import WaveSurfer from "wavesurfer.js";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { BehaviorSubject, takeUntil, Subject, combineLatest } from "rxjs";
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
import { Components } from "@readalongs/web-component/loader";
import { HttpClient } from "@angular/common/http";
import { B64Service } from "../b64.service";
import { ToastrService } from "ngx-toastr";

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
  // readalong: Document | null;
  readalong_element: Element;
  audioControl$ = new FormControl<File | null>(null, Validators.required);
  rasControl$ = new FormControl<any>(null, Validators.required);
  b64Inputs: [string, Document, [string, string]] = [
    "",
    new Document(),
    ["", ""],
  ];
  readalong: Components.ReadAlong;
  slots: ReadAlongSlots = {
    title: "test",
    subtitle: "test",
  };
  public uploadFormGroup = this._formBuilder.group({
    audio: this.audioControl$,
    ras: this.rasControl$,
  });
  unsubscribe$ = new Subject<void>();
  constructor(
    private _formBuilder: FormBuilder,
    private http: HttpClient,
    private b64Service: B64Service,
    private toastr: ToastrService,
  ) {
    this.audioControl$.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((audioFile) => {
        // If an audio file is loaded, then load the blob to wave surfer and clear any segments
        if (audioFile) {
          this.wavesurfer.loadBlob(audioFile);
          this.wavesurfer.clearSegments();
        }
      });
    // this.loadSampleAudio(); // Just for mocking
    this.audio_input = document.getElementById(
      "audio-input",
    ) as HTMLInputElement;
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
  ngAfterViewInit(): void {
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

  onTextFileSelected(event: any) {
    let file: File = event.target.files[0];
    this.load_readalong(file);
  }

  async load_readalong(ras_file: File) {
    const text = await ras_file.text();
    await this.parse_readalong(text);
  }

  async parse_readalong(text: string): Promise<Document | null> {
    const parser = new DOMParser();
    const readalong = parser.parseFromString(text, "text/html");
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
        this.audio_input.value = "";
        this.$downloadable.next(false);
      }
    }
    // Is read-along linked (including data URI) or embedded?
    const href = element.getAttribute("href");
    if (href === null) this.create_segments(element);
    else {
      const reply = await fetch(href);
      if (reply.ok) {
        const text2 = await reply.text();
        // FIXME: potential zip-bombing?
        this.parse_readalong(text2);
      }
    }
    return readalong;
  }

  adjust_alignment(element: Element) {
    const segments: { [id: string]: Segment } = {};
    for (const s of Object.values(this.wavesurfer.segments.list)) {
      const segment = s as Segment;
      segments[segment.data.id as string] = segment;
    }
    for (const w of Array.from(element.querySelectorAll("w[id]"))) {
      const wordId = w.getAttribute("id");
      if (wordId == null) continue;
      const segment = segments[wordId];
      if (!segment)
        // deletions not allowed for now
        throw `missing segment for ${wordId}`;
      w.setAttribute("time", segment.start.toFixed(3));
      w.setAttribute("dur", (segment.end - segment.start).toFixed(3));
      w.textContent = segment.data.text as string;
    }
  }

  create_segments(element: Element) {
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
