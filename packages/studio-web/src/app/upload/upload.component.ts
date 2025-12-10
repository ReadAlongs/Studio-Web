// -*- typescript-indent-level: 2 -*-
import { ToastrService } from "ngx-toastr";
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  retry,
  of,
  switchMap,
  map,
  throwError,
  firstValueFrom,
  take,
  filter,
} from "rxjs";

import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
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
import { validateFileType } from "../utils/utils";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IAudioBuffer } from "standardized-audio-context";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.sass"],
  standalone: false,
})
export class UploadComponent implements OnInit {
  protected isLoaded = false;
  protected langs: Array<SupportedLanguage> = [];
  protected loading = false;
  protected starting_to_record = false;
  protected recording = false;
  protected playing = false;
  private player: any = null;
  protected contactLink = environment.packageJson.contact;
  protected progressMode: ProgressBarMode = "indeterminate";
  protected progressValue = 0;
  // Max plain text file size: 40KB is OK but takes around 15-20s on Heroku
  private maxTxtSizeKB = 40;
  // Max .readalong XML text size: text * 5 is a rough heuristic; the XML is much bloated from the text.
  private maxRasSizeKB = 200;
  private currentToast: number;
  @ViewChild("textFileUpload")
  private textFileUpload: ElementRef<HTMLFormElement>;
  @ViewChild("audioFileUpload")
  private audioFileUpload: ElementRef<HTMLFormElement>;
  @Output() public stepChange = new EventEmitter<any[]>();

  // value passed to input[type=file] accept's attribute which expects
  // a comma separated list of file extensions or mime types.
  protected textUploadAccepts = ".txt,.xml,.readalong";
  protected audioUploadAccepts = ".mp3,.wav,.webm,.m4a";

  private destroyRef$ = inject(DestroyRef);
  private route: ActivatedRoute;
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private rasService = inject(RasService);
  private fileService = inject(FileService);
  private ssjsService = inject(SoundswallowerService);
  private microphoneService = inject(MicrophoneService);
  private uploadService = inject(UploadService);
  private dialog = inject(MatDialog);
  public studioService = inject(StudioService);

  constructor() {
    this.studioService.audioControl$.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((audio) => this.uploadService.$currentAudio.next(audio));
    this.studioService.textControl$.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((textBlob) => this.uploadService.$currentText.next(textBlob));
    this.ssjsService.modelLoaded
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((loaded) => {
        this.isLoaded = loaded;
      });

    // If the textControl$ changes to a Blob or null, reset the
    // input[type=file] value.
    this.studioService.textControl$.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(() => Boolean(this.textFileUpload)),
        filter((val) => !(val instanceof File)),
      )
      .subscribe(() => {
        this.textFileUpload.nativeElement.value = "";
      });

    // If the audioControl$ changes to a Blob or null, reset the
    // input[type=file] value.
    this.studioService.audioControl$.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(() => Boolean(this.audioFileUpload)),
        filter((val) => !(val instanceof File)),
      )
      .subscribe(() => {
        this.audioFileUpload.nativeElement.value = "";
      });

    // As the user is entering text, validate the length of the string
    // and set the textControl$ to the new value.
    this.studioService.$textInput
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        filter((val) => val !== ""),
        filter(() => this.checkIsTextSizeBelowLimit()),
      )
      .subscribe((textString) => {
        this.studioService.textControl$.setValue(
          new Blob([textString], { type: "text/plain" }),
        );
      });
  }

  async ngOnInit() {
    this.rasService
      .getLangs$()
      .pipe(takeUntilDestroyed(this.destroyRef$))
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
        timeOut: 180000,
        closeButton: true,
        tapToDismiss: false,
        disableTimeOut: "extendedTimeOut",
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
      $localize`Unable to align even with loose alignment parameters. Please check your text and audio for quality and make sure they are a good match.`,
      $localize`Alignment failed.`,
      { timeOut: 30000 },
    );
  }

  reportDifficultAlignment(err: Error, mode: BeamDefaults) {
    if (mode === BeamDefaults.strict) {
      this.toastr.warning(
        $localize`Hmm, this is harder than usual, please wait while we try again.`,
        $localize`Alignment failed.`,
        { timeOut: 10000 },
      );
    } else {
      this.toastr.warning(
        $localize`This is really difficult. We'll try one last time, but it might take a long time and produce poor results. Please make sure your text matches your audio and that there is as little background noise as possible.`,
        $localize`Alignment failed.`,
        { timeOut: 20000 },
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

  private validateLangControl(): boolean {
    if (this.studioService.langControl$.value) {
      return true;
    }

    this.toastr.error(
      $localize`Please select a language or choose the default option`,
      $localize`No language selected`,
      { timeOut: 15000 },
    );
    return false;
  }

  private validateTextControl(): boolean {
    switch (this.studioService.inputMethod.text) {
      case "edit":
        if (this.studioService.$textInput.value) {
          return this.checkIsTextSizeBelowLimit();
        }

        this.toastr.error(
          $localize`Please enter text to align.`,
          $localize`No text`,
          { timeOut: 15000 },
        );
        return false;

      case "upload":
        if (this.studioService.textControl$.value) {
          return true;
        }

        this.toastr.error(
          $localize`Please select a text file.`,
          $localize`No text`,
          { timeOut: 15000 },
        );
        return false;
    }

    return true;
  }

  private validateAudioControl(): boolean {
    if (this.studioService.audioControl$.value) {
      return true;
    }

    this.toastr.error(
      $localize`Please (re-)record some audio or select an audio file.`,
      $localize`No audio`,
      { timeOut: 15000 },
    );
    return false;
  }

  private validateAlignmentModel(): boolean {
    if (this.ssjsService.modelLoaded) {
      return true;
    }

    this.toastr.error(
      $localize`Sorry, the alignment model isn't loaded yet. Please wait a while and try again if you're on a slow connection. If the problem persists, please contact us.`,
      $localize`No model loaded`,
      { timeOut: 15000 },
    );
    return false;
  }

  private validateUploadFormGroup(): boolean {
    if (this.studioService.uploadFormGroup.valid) {
      return true;
    }
    this.toastr.error(
      $localize`Please select or write text, select or record audio data, and select the language.`,
      $localize`Form not complete`,
      { timeOut: 15000 },
    );
    return false;
  }

  nextStep() {
    const isValid =
      this.validateLangControl() &&
      this.validateTextControl() &&
      this.validateAlignmentModel() &&
      this.validateAudioControl() &&
      this.validateUploadFormGroup();
    if (!isValid) {
      return;
    }

    if (this.studioService.inputMethod.text === "edit") {
      const inputText = new Blob([this.studioService.$textInput.value], {
        type: "text/plain",
      });
      this.studioService.textControl$.setValue(inputText);
    }

    // Show progress bar
    this.loading = true;
    this.progressMode = "query";
    // Determine text type for API request
    let input_type;
    if (
      this.studioService.inputMethod.text === "upload" &&
      this.studioService.textControl$.value instanceof File &&
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
      text_languages: [this.studioService.langControl$.value as string, "und"],
      type: input_type,
    };
    forkJoin({
      audio: this.fileService.loadAudioBufferFromFile$(
        this.studioService.audioControl$.value as File,
        8000,
      ),
      ras: firstValueFrom(
        this.fileService.readFile$(this.studioService.textControl$.value!).pipe(
          switchMap((text: string): Observable<ReadAlong> => {
            body.input = text;
            this.progressMode = "determinate";
            this.progressValue = 0;
            return this.rasService.assembleReadalong$(body);
          }),
          take(1),
        ),
      ),
    })
      .pipe(
        switchMap(({ audio, ras }: { audio: IAudioBuffer; ras: ReadAlong }) => {
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
        }),
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
        takeUntilDestroyed(this.destroyRef$),
        finalize(() => (this.ssjsService.mode = BeamDefaults.strict)),
      )
      .subscribe({
        next: (progress) => {
          if (progress.hypseg !== undefined) {
            this.loading = false;
            this.toastr.clear(); // clean all outstanding toasts on alignment success
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
  }

  onAudioFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (!el.files || el.files.length !== 1) {
      this.studioService.audioControl$.setValue(null);
      return;
    }

    const file: File = el.files[0];
    if (!validateFileType(file, this.audioUploadAccepts)) {
      this.toastr.error(
        $localize`The file "${file.name}:fileName:" is not a compatible audio file.`,
        $localize`Sorry!`,
        { timeOut: 15000 },
      );
      el.value = "";
      return;
    }

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
  }

  deleteTextUpload() {
    this.textFileUpload.nativeElement.value = "";
    this.studioService.textControl$.setValue(null);
  }

  onTextFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (!el.files || el.files.length !== 1) {
      this.studioService.textControl$.setValue(null);
      return;
    }

    const file: File = el.files[0];
    if (!validateFileType(file, this.textUploadAccepts)) {
      this.toastr.error(
        $localize`The file "${file.name}:fileName:" is not a compatible text file.`,
        $localize`Sorry!`,
        { timeOut: 15000 },
      );
      el.value = "";
      return;
    }

    let maxSizeKB;
    let fileTooBigMessage;
    if (validateFileType(file, ".readalong,.xml")) {
      maxSizeKB = this.maxRasSizeKB;
      fileTooBigMessage = $localize`.readalong file too large. `;
    } else {
      maxSizeKB = this.maxTxtSizeKB;
      fileTooBigMessage = $localize`Text file too large. `;
    }
    if (file.size > maxSizeKB * 1024) {
      this.toastr.error(
        fileTooBigMessage + $localize`Max size: ` + maxSizeKB + $localize` KB.`,
        $localize`Sorry!`,
        { timeOut: 15000 },
      );
      this.textFileUpload.nativeElement.value = "";
    } else {
      // the file has been accepted, clear the user input text.
      this.studioService.$textInput.next("");

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
