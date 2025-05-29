// -*- typescript-indent-level: 2 -*-
import { ToastrService } from "ngx-toastr";
import {
  Observable,
  BehaviorSubject,
  Subject,
  catchError,
  finalize,
  forkJoin,
  retry,
  of,
  switchMap,
  map,
  takeUntil,
  throwError,
} from "rxjs";

import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { HttpErrorResponse } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { FileService } from "../file.service";
import { MicrophoneService } from "../microphone.service";
import {
  RasService,
  ReadAlong,
  ReadAlongRequest,
  SupportedLanguage,
} from "../ras.service";
import { UploadService } from "../upload.service";
import { BeamDefaults, SoundswallowerService } from "../soundswallower.service";
import { TextFormatDialogComponent } from "../text-format-dialog/text-format-dialog.component";
import { StudioService } from "../studio/studio.service";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.sass"],
  standalone: false,
})
export class UploadComponent implements OnDestroy, OnInit {
  isLoaded = false;
  langs: Array<SupportedLanguage> = [];
  loading = false;
  starting_to_record = false;
  recording = false;
  playing = false;
  player: any = null;
  contactLink = environment.packageJson.contact;
  progressMode: ProgressBarMode = "indeterminate";
  progressValue = 0;
  // Max plain text file size: 40KB is OK but takes around 15-20s on Heroku
  maxTxtSizeKB = 40;
  // Max .readalong XML text size: text * 5 is a rough heuristic; the XML is much bloated from the text.
  maxRasSizeKB = 200;
  currentToast: number;
  @ViewChild("textInputElement") textInputElement: ElementRef;
  @ViewChild("audioFileUpload") audioFileUpload: ElementRef<HTMLFormElement>;
  @Output() stepChange = new EventEmitter<any[]>();

  unsubscribe$ = new Subject<void>();
  private route: ActivatedRoute;
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private rasService: RasService,
    private fileService: FileService,
    private ssjsService: SoundswallowerService,
    private microphoneService: MicrophoneService,
    private uploadService: UploadService,
    private dialog: MatDialog,
    public studioService: StudioService,
  ) {
    this.studioService.audioControl$.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((audio) => this.uploadService.$currentAudio.next(audio));
    this.studioService.textControl$.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((textBlob) => this.uploadService.$currentText.next(textBlob));
    this.studioService.$textInput
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((textString) => {
        //provides user with warning if text size is above limit
        if (this.checkIsTextSizeBelowLimit())
          this.uploadService.$currentText.next(textString);
      });
    this.ssjsService.modelLoaded
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((loaded) => {
        this.isLoaded = loaded;
      });
  }

  async ngOnInit() {
    this.rasService
      .getLangs$()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (langs: Array<SupportedLanguage>) => {
          this.langs = langs
            .filter((lang) => lang.code != "und")
            .sort((a, b) => a.names["_"].localeCompare(b.names["_"]));
        },
        error: (err) => {
          this.router.navigate(["error"], {
            relativeTo: this.route,
            queryParams: { msg: err.message },
            skipLocationChange: true,
          });
          console.log(err);
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  reportRasError(err: HttpErrorResponse) {
    if (err.status == 422) {
      if (err.error.detail.includes("is empty")) {
        this.toastr.error(
          $localize`Your text may contain unpronounceable characters or numbers.
Please check it to make sure all words are spelled out completely, e.g. write "42" as "forty two".`,
          $localize`Pronunciation mapping issues.`,
          { timeOut: 30000 },
        );
      }
      this.toastr.error(err.error.detail, $localize`Text processing failed.`, {
        timeOut: 30000,
      });
    } else {
      this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        { timeOut: 60000 },
      );
    }
  }

  reportUnpronounceableError(err: Error) {
    this.toastr.error(
      $localize`Your text may contain unpronounceable characters or numbers.
Please check it to make sure all words are spelled out completely, e.g. write "42" as "forty two".`,
      $localize`Alignment failed.`,
      { timeOut: 30000 },
    );
  }

  reportDifficultAlignment(err: Error, mode: BeamDefaults) {
    if (mode === BeamDefaults.strict) {
      this.toastr.warning(
        $localize`Hmm, this is harder than usual, please wait while we try again.`,
        $localize`Alignment failed.`,
        { timeOut: 5000 },
      );
    } else {
      this.toastr.error(
        $localize`This is really difficult. We'll try one last time, but it might take a long time and produce poor results. Please make sure your text matches your audio and that there is as little background noise as possible.`,
        $localize`Alignment failed.`,
        { timeOut: 30000 },
      );
    }
  }

  reportAudioError(err: Error) {
    this.toastr.error(err.message, $localize`Audio processing failed.`, {
      timeOut: 15000,
    });
  }

  downloadRecording() {
    if (this.studioService.audioControl$.value !== null) {
      let blob = new Blob([this.studioService.audioControl$.value], {
        type: this.studioService.audioControl$.value.type,
      });
      let ext;
      switch (blob.type) {
        case "audio/mpeg":
          ext = ".mp3";
          break;
        case "audio/wav":
          ext = ".wav";
          break;
        case "audio/webm":
          ext = ".webm";
          break;
        case "audio/m4a":
          ext = ".m4a";
          break;
        default:
          ext = ".wav";
      }
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ras-audio-" + Date.now() + ext;
      a.click();
      a.remove();
    } else {
      this.toastr.error($localize`No audio to download.`, $localize`Sorry!`);
    }
  }

  downloadText() {
    if (this.studioService.$textInput.value) {
      let textBlob = new Blob([this.studioService.$textInput.value], {
        type: "text/plain",
      });
      var url = window.URL.createObjectURL(textBlob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ras-text-" + Date.now() + ".txt";
      a.click();
      a.remove();
    } else {
      this.toastr.error($localize`No text to download.`, $localize`Sorry!`);
    }
  }

  displayFormatHelp(): void {
    this.dialog.open(TextFormatDialogComponent);
  }

  async startRecording() {
    if (this.recording)
      // Not sure why the button stays clickable, but oh well
      return;
    try {
      this.starting_to_record = true;
      await this.microphoneService.startRecording();
      this.recording = true;
    } catch (err: any) {
      this.toastr.error(err.toString(), $localize`Could not start recording!`);
    } finally {
      this.starting_to_record = false;
    }
  }

  pauseRecording() {
    this.microphoneService.pause();
    this.recording = false;
  }

  resumeRecording() {
    this.microphoneService.resume();
    this.recording = true;
  }

  playRecording() {
    if (!this.playing && this.studioService.audioControl$.value !== null) {
      let player = new window.Audio();
      this.player = player;
      player.src = URL.createObjectURL(this.studioService.audioControl$.value);
      player.onended = () => this.stopPlayback();
      player.onerror = () => this.stopPlayback();
      player.load();
      this.playing = true;
      player.play();
    }
  }

  stopPlayback() {
    this.playing = false;
    this.player?.pause();
    this.player = null;
  }

  deleteRecording() {
    this.audioFileUpload.nativeElement.value = "";
    this.studioService.audioControl$.setValue(null);
  }

  async stopRecording() {
    this.recording = false;
    try {
      let output = await this.microphoneService.stopRecording();
      // possibly check for zero-length output and throw here
      this.toastr.success(
        $localize`Audio was successfully recorded. Please listen to your recording to make sure it's OK, and save it for reuse if so.`,
        $localize`Yay!`,
        { timeOut: 10000 },
      );
      this.studioService.audioControl$.setValue(output);
      // do any post output steps
    } catch (err: any) {
      if (err === "Recorder didn't hear anything") {
        this.toastr.error(
          $localize`We couldn't record anything, is your microphone blocked or disconnected? If the problem persists please try with a headset or other microphone.`,
          $localize`Audio not recorded!`,
        );
      } else {
        this.toastr.error(
          $localize`Please try again, or select a pre-recorded file.`,
          $localize`Audio not recorded!`,
        );
      }

      console.log(err);
    }
  }

  toggleAudioInput(event: any) {
    this.studioService.inputMethod.audio = event.value;
  }

  toggleLangMode(event: any) {
    if (event.value === "generic") {
      this.studioService.langControl$.setValue("und");
    } else {
      this.studioService.langControl$.setValue("");
    }
    this.studioService.langMode$.next(event.value);
  }

  toggleTextInput(event: any) {
    this.studioService.inputMethod.text = event.value;
  }

  checkIsTextSizeBelowLimit(): boolean {
    if (this.studioService.$textInput.value) {
      const inputLength = this.studioService.$textInput.value.length;
      if (this.currentToast) {
        this.toastr.clear(this.currentToast);
      }
      if (inputLength > this.maxTxtSizeKB * 1024) {
        this.currentToast = this.toastr.error(
          $localize`Text too large. ` +
            $localize`Max size: ` +
            this.maxTxtSizeKB +
            $localize` KB.` +
            $localize` Current size: ` +
            Math.ceil(inputLength / 1024) +
            $localize` KB.`,
          $localize`Sorry!`,
          { timeOut: 15000 },
        ).toastId;
        return false;
      }
    }
    return true;
  }

  nextStep() {
    if (this.studioService.langControl$.value === "") {
      this.toastr.error(
        $localize`Please select a language or choose the default option`,
        $localize`No language selected`,
        { timeOut: 15000 },
      );
      return;
    }
    if (this.studioService.inputMethod.text === "edit") {
      this.studioService.textControl$.setValue(null);
      if (this.studioService.$textInput.value) {
        const inputLength = this.studioService.$textInput.value.length;
        if (this.checkIsTextSizeBelowLimit()) {
          let inputText = new Blob([this.studioService.$textInput.value], {
            type: "text/plain",
          });
          this.studioService.textControl$.setValue(inputText);
        } else {
          return;
        }
      } else {
        this.toastr.error(
          $localize`Please enter text to align.`,
          $localize`No text`,
          { timeOut: 15000 },
        );
      }
    } else {
      if (this.studioService.textControl$.value === null) {
        this.toastr.error(
          $localize`Please select a text file.`,
          $localize`No text`,
          { timeOut: 15000 },
        );
      }
    }
    if (!this.ssjsService.modelLoaded) {
      this.toastr.error(
        $localize`Sorry, the alignment model isn't loaded yet. Please wait a while and try again if you're on a slow connection. If the problem persists, please contact us.`,
        $localize`No model loaded`,
        { timeOut: 15000 },
      );
    } else if (
      this.studioService.uploadFormGroup.valid &&
      this.studioService.audioControl$.value !== null
    ) {
      // Show progress bar
      this.loading = true;
      this.progressMode = "query";
      // Determine text type for API request
      let input_type;
      if (
        this.studioService.inputMethod.text === "upload" &&
        (this.studioService.textControl$.value.name
          .toLowerCase()
          .endsWith(".xml") ||
          this.studioService.textControl$.value.name
            .toLowerCase()
            .endsWith(".readalong"))
      ) {
        input_type = "application/readalong+xml";
      } else {
        input_type = "text/plain";
      }
      // Create request (text is possibly read from a file later...)
      let body: ReadAlongRequest = {
        text_languages: [
          this.studioService.langControl$.value as string,
          "und",
        ],
        type: input_type,
      };
      forkJoin({
        audio: this.fileService.loadAudioBufferFromFile$(
          this.studioService.audioControl$.value as File,
          8000,
        ),
        ras: this.fileService
          .readFile$(this.studioService.textControl$.value)
          .pipe(
            switchMap((text: string): Observable<ReadAlong> => {
              body.input = text;
              this.progressMode = "determinate";
              this.progressValue = 0;
              return this.rasService.assembleReadalong$(body);
            }),
          ),
      })
        .pipe(
          switchMap(
            ({ audio, ras }: { audio: AudioBuffer; ras: ReadAlong }) => {
              if (ras.log !== null) {
                const fallbackRx = /^.*g2p.*$/gim;
                const matches = ras.log.match(fallbackRx);
                if (matches) {
                  this.toastr.warning(
                    matches.join("\n"),
                    $localize`Possible text processing issues.`,
                    { timeOut: 30000 },
                  );
                }
              }
              return this.ssjsService.align$(audio, ras as ReadAlong);
            },
          ),
          catchError((err: Error) => {
            // Catch all errors. If error message is "No alignment found" then gradually loosen the beam defaults.
            // and then throw an error so that retry will get triggered. If it's any other type of error, just return
            // an observable of it so that it bypasses retry.
            if (err.message === "No alignment found") {
              if (this.ssjsService.mode === BeamDefaults.strict) {
                this.reportDifficultAlignment(err, this.ssjsService.mode);
                this.ssjsService.mode = BeamDefaults.moderate;
              } else if (this.ssjsService.mode === BeamDefaults.moderate) {
                this.reportDifficultAlignment(err, this.ssjsService.mode);
                this.ssjsService.mode = BeamDefaults.loose;
              }
              return throwError(() => err);
            } else {
              return of(err);
            }
          }),
          retry(2),
          // Here, we want to intercept the observable from the catchError operator above and throw a new error of it
          map((possibleError) => {
            if (
              possibleError instanceof Error ||
              possibleError instanceof HttpErrorResponse
            ) {
              throw possibleError;
            } else {
              return possibleError;
            }
          }),
          takeUntil(this.unsubscribe$),
          finalize(() => (this.ssjsService.mode = BeamDefaults.strict)),
        )
        .subscribe({
          next: (progress) => {
            if (progress.hypseg !== undefined) {
              this.loading = false;
              this.stepChange.emit([
                "aligned",
                this.studioService.audioControl$.value,
                progress.xml,
                progress.hypseg,
              ]);
            } else {
              this.progressValue = Math.round(
                (progress.pos / progress.length) * 100,
              );
            }
          },
          error: (err: Error) => {
            this.loading = false;
            if (err instanceof HttpErrorResponse) {
              this.reportRasError(err);
            } else if (err.message.includes("align")) {
              this.reportUnpronounceableError(err);
            } else {
              this.reportAudioError(err);
            }
          },
        });
    } else {
      if (this.studioService.langControl$.value === null) {
        this.toastr.error(
          $localize`Please select a language.`,
          $localize`No language`,
          { timeOut: 15000 },
        );
      }
      if (this.studioService.audioControl$.value === null) {
        this.toastr.error(
          $localize`Please (re-)record some audio or select an audio file.`,
          $localize`No audio`,
          { timeOut: 15000 },
        );
      }
      this.toastr.error(
        $localize`Please select or write text, select or record audio data, and select the language.`,
        $localize`Form not complete`,
        { timeOut: 15000 },
      );
    }
  }

  onFileSelected(type: any, event: any) {
    const file: File = event.target.files[0];
    if (type === "audio") {
      if (file.type == "video/webm") {
        // No, it is audio, because we say so.
        const audioFile = new File([file], file.name, { type: "audio/webm" });
        this.studioService.audioControl$.setValue(audioFile);
      } else {
        this.studioService.audioControl$.setValue(file);
      }
      this.toastr.success(
        $localize`File ` +
          file.name +
          $localize` processed, but not uploaded. Your audio will stay on your computer.`,
        $localize`Great!`,
        { timeOut: 10000 },
      );
    } else if (type === "text") {
      let maxSizeKB;
      let fileTooBigMessage;
      if (file.name.split(".").pop() === "readalong") {
        maxSizeKB = this.maxRasSizeKB;
        fileTooBigMessage = $localize`.readalong file too large. `;
      } else {
        maxSizeKB = this.maxTxtSizeKB;
        fileTooBigMessage = $localize`Text file too large. `;
      }
      if (file.size > maxSizeKB * 1024) {
        this.toastr.error(
          fileTooBigMessage +
            $localize`Max size: ` +
            maxSizeKB +
            $localize` KB.`,
          $localize`Sorry!`,
          { timeOut: 15000 },
        );
        this.textInputElement.nativeElement.value = "";
      } else {
        this.studioService.textControl$.setValue(file);
        this.toastr.success(
          $localize`File ` +
            file.name +
            $localize` processed. It will be uploaded through an encrypted connection when you go to the next step.`,
          $localize`Great!`,
          { timeOut: 10000 },
        );
      }
    }
  }
}
