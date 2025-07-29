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
  pairwise,
  startWith,
  firstValueFrom,
  take,
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
import { ERR_NO_RECORDING, MicrophoneService } from "../microphone.service";
import {
  RasService,
  ReadAlong,
  ReadAlongRequest,
  SupportedLanguage,
} from "../ras.service";
import { UploadService } from "../upload.service";
import {
  AlignmentProgress,
  BeamDefaults,
  SoundswallowerService,
} from "../soundswallower.service";
import { TextFormatDialogComponent } from "../text-format-dialog/text-format-dialog.component";
import { StudioService } from "../studio/studio.service";
import { validateFileType } from "../utils/utils";
import {
  AbstractControl,
  ControlEvent,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";

import {
  maxInputTextLengthValidator,
  orValidator,
  textFileUploadSizeValidator,
  fileUploadTypeValidator,
} from "./validators";
import { MatButtonToggleChange } from "@angular/material/button-toggle";
import { MatRadioChange } from "@angular/material/radio";
import { audioExtension, textMimeType } from "../utils/mimetype";
import { Segment } from "soundswallower";

// Max plain text file size: 40KB is OK but takes around 15-20s on Heroku
const maxTxtSizeKB = 40;
// Max .readalong XML text size: text * 5 is a rough heuristic; the XML is much bloated from the text.
const maxRasSizeKB = 200;

export interface UploadResult {
  text: Blob;
  audio: Blob;
  segment: Segment;
  ras: Document;
}

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
  player: HTMLAudioElement | null = null;
  contactLink = environment.packageJson.contact;
  progressMode: ProgressBarMode = "indeterminate";
  progressValue = 0;

  @ViewChild("textFileUpload") textFileUpload: ElementRef<HTMLFormElement>;
  @ViewChild("audioFileUpload") audioFileUpload: ElementRef<HTMLFormElement>;
  @Output() stepChange = new EventEmitter<UploadResult>();

  $textInput = new BehaviorSubject<string>("");

  // value passed to input[type=file] accept's attribute which expects
  // a comma separated list of file extensions or mime types.
  textUploadAccepts = ".txt,.xml,.readalong";
  audioUploadAccepts = ".mp3,.wav,.webm,.m4a";

  // Create a FromGroup containing both text input methods. The group ensures that only
  // one of the two controls has a value. Additionally, the group is considered valid
  // if one of the two child control is valid (orValidator).
  textGroup = new FormGroup(
    {
      edit: new FormControl<string | null>(
        null,
        maxInputTextLengthValidator(this.toastr, maxTxtSizeKB),
      ),
      upload: new FormControl<File | null>(null, [
        fileUploadTypeValidator(this.toastr, this.textUploadAccepts),
        textFileUploadSizeValidator(this.toastr, maxTxtSizeKB, maxRasSizeKB),
      ]),
    },
    orValidator,
  );

  // Create a FromGroup containing both audio input methods. The group ensures that only
  // one of the two controls has a value. Additionally, the group is considered valid
  // if one of the two child control is valid (orValidator)
  audioGroup = new FormGroup(
    {
      mic: new FormControl<Blob | null>(null),
      upload: new FormControl<File | null>(null, [
        fileUploadTypeValidator(this.toastr, this.audioUploadAccepts, "audio"),
      ]),
    },
    orValidator,
  );

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
    // exclusive implementation: toggles the current text value between
    // either the edited value and the uploaded file.
    this.textGroup.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((val) => {
        const otherMode =
          this.studioService.inputMethod.text === "edit" ? "upload" : "edit";
        if (val[otherMode]) {
          this.textGroup.controls[otherMode].reset();
        }
      });

    // reflect the file upload model state in the UI.
    this.textGroup.controls.upload.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((val) => {
        if (!val) {
          this.textFileUpload.nativeElement.value = "";
        }
      });

    // exclusive implementation: toggles the current audio value between
    // the user's recording and the uploaded file.
    this.audioGroup.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((val) => {
        const otherMode =
          this.studioService.inputMethod.audio === "mic" ? "upload" : "mic";
        if (val[otherMode]) {
          this.audioGroup.controls[otherMode].reset();
        }
      });

    // reflect the file upload model state in the UI.
    this.audioGroup.controls.upload.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((val) => {
        if (!val) {
          this.audioFileUpload.nativeElement.value = "";
        }
      });

    //TODO    this.studioService.audioControl$.valueChanges
    //TODO      .pipe(takeUntil(this.unsubscribe$))
    //TODO      .subscribe((audio) => this.uploadService.$currentAudio.next(audio));
    //TODO    this.studioService.textControl$.valueChanges
    //TODO      .pipe(takeUntil(this.unsubscribe$))
    //TODO      .subscribe((textBlob) => this.uploadService.$currentText.next(textBlob));
    //TODO    this.$textInput
    //TODO      .pipe(takeUntil(this.unsubscribe$))
    //TODO      .subscribe((textString) => {
    //TODO        //provides user with warning if text size is above limit
    //TODO        if (this.checkIsTextSizeBelowLimit()) {
    //TODO          this.studioService.textControl$.setValue({
    //TODO            source: "edit",
    //TODO            blob: new Blob([textString], {
    //TODO              type: "text/plain",
    //TODO            }),
    //TODO          });
    //TODO          //TODO          this.uploadService.$currentText.next(textString);
    //TODO        }
    //TODO      });

    this.ssjsService.modelLoaded
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((loaded) => {
        this.isLoaded = loaded;
      });

    //this.studioService.textControl$.pipe();
  }

  ngOnInit() {
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
    const currentInput = this.studioService.inputMethod.audio;
    const audio = this.audioGroup.controls[currentInput].value;
    if (!audio) {
      this.toastr.error($localize`No audio to download.`, $localize`Sorry!`);
      return;
    }

    const ext = audioExtension(audio.type);
    this.downloadBlob(audio, "ras-audio-" + Date.now() + ext);
  }

  downloadText() {
    const currentText = this.textGroup.controls.edit.value;
    if (!currentText) {
      this.toastr.error($localize`No text to download.`, $localize`Sorry!`);
      return;
    }

    let textBlob = new Blob([currentText], {
      type: "text/plain",
    });
    this.downloadBlob(textBlob, "ras-text-" + Date.now() + ".txt");
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
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
    const currentInput = this.studioService.inputMethod.audio;
    if (this.playing || this.audioGroup.controls[currentInput].value === null) {
      return;
    }

    this.player = new Audio();
    this.player.src = URL.createObjectURL(
      this.audioGroup.controls[currentInput].value,
    );
    this.player.onended = () => this.stopPlayback();
    this.player.onerror = () => this.stopPlayback();
    this.player.load();
    this.playing = true;
    this.player.play();
  }

  stopPlayback() {
    this.playing = false;
    if (this.player) {
      this.player.pause();
      URL.revokeObjectURL(this.player.src);
    }
    this.player = null;
  }

  deleteRecording() {
    this.audioGroup.reset();
  }

  async stopRecording() {
    this.recording = false;
    try {
      let output = await this.microphoneService.stopRecording();
      this.audioGroup.controls.mic.setValue(output);
      this.audioGroup.controls.mic.markAsDirty();
      if (this.audioGroup.controls.mic.valid) {
        this.toastr.success(
          $localize`Audio was successfully recorded. Please listen to your recording to make sure it's OK, and save it for reuse if so.`,
          $localize`Yay!`,
          { timeOut: 10000 },
        );
      }
    } catch (err: any) {
      if (err === ERR_NO_RECORDING) {
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

  toggleAudioInput(event: MatButtonToggleChange) {
    this.studioService.inputMethod.audio = event.value;
  }

  toggleTextInput(event: MatButtonToggleChange) {
    this.studioService.inputMethod.text = event.value;
  }

  toggleLangMode(event: MatRadioChange) {
    if (event.value === "generic") {
      this.studioService.langControl$.setValue("und");
    } else {
      this.studioService.langControl$.setValue("");
    }
    this.studioService.langMode$.next(event.value);
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

    if (!this.textGroup.valid) {
      const currentMode = this.studioService.inputMethod.text;
      this.toastr.error(
        currentMode === "edit"
          ? $localize`Please enter text to align.`
          : $localize`Please select a text file.`,
        $localize`No text`,
        { timeOut: 15000 },
      );
      return;
    }

    if (!this.audioGroup.valid) {
      this.toastr.error(
        $localize`Please (re-)record some audio or select an audio file.`,
        $localize`No audio`,
        { timeOut: 15000 },
      );
      return;
    }

    if (!this.ssjsService.modelLoaded) {
      this.toastr.error(
        $localize`Sorry, the alignment model isn't loaded yet. Please wait a while and try again if you're on a slow connection. If the problem persists, please contact us.`,
        $localize`No model loaded`,
        { timeOut: 15000 },
      );
      return;
    }

    // else if (
    //TODO       this.studioService.uploadFormGroup.valid &&
    //TODO       this.studioService.audioControl$.value !== null
    //TODO     ) {

    // Show progress bar
    this.loading = true;
    this.progressMode = "query";

    // Determine text type for the RAS API request
    const rasMimeType = this.textGroup.controls.edit.value
      ? "text/plain"
      : textMimeType(this.textGroup.controls.upload.value!.name!);

    // Create request (text is possibly read from a file later...)
    let body: ReadAlongRequest = {
      text_languages: [this.studioService.langControl$.value!, "und"],
      type: rasMimeType,
    };

    forkJoin({
      audio: this.fileService.loadAudioBufferFromFile$(
        this.audioGroup.value.mic
          ? this.audioGroup.value.mic!
          : this.audioGroup.value.upload!,
        8000,
      ),
      ras: firstValueFrom(
        this.fileService
          .readFile$(
            this.textGroup.value.edit
              ? this.textGroup.value.edit!
              : this.textGroup.value.upload!,
          )
          .pipe(
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
        switchMap(({ audio, ras }: { audio: AudioBuffer; ras: ReadAlong }) => {
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
          return this.ssjsService.align$(audio, ras);
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
        takeUntil(this.unsubscribe$),
        finalize(() => (this.ssjsService.mode = BeamDefaults.strict)),
      )
      .subscribe({
        next: (progress: AlignmentProgress) => {
          if (!progress.hypseg) {
            this.progressValue = Math.round(
              (progress.pos / progress.length) * 100,
            );
            return;
          }

          this.loading = false;
          this.stepChange.emit({
            audio: this.audioGroup.controls.upload.value
              ? this.audioGroup.controls.upload.value!
              : this.audioGroup.controls.mic.value!,
            text: this.textGroup.controls.edit.value
              ? new Blob([this.textGroup.controls.edit.value], {
                  type: "text/plain",
                })
              : this.textGroup.controls.upload.value!,
            segment: progress.hypseg,
            ras: new DOMParser().parseFromString(
              progress.xml!,
              "application/xml",
            ),
          });
        },
        error: (err: Error) => {
          this.loading = false;
          if (err instanceof HttpErrorResponse) {
            this.reportRasError(err.error);
          } else if (err.message.includes("align")) {
            this.reportUnpronounceableError(err);
          } else {
            this.reportAudioError(err);
          }
        },
      });

    //TODO         .subscribe({

    //TODO         });
    //TODO     } else {
    //TODO       if (this.studioService.langControl$.value === null) {
    //TODO         this.toastr.error(
    //TODO           $localize`Please select a language.`,
    //TODO           $localize`No language`,
    //TODO           { timeOut: 15000 },
    //TODO         );
    //TODO       }
    //TODO       if (this.studioService.audioControl$.value === null) {
    //TODO         this.toastr.error(
    //TODO           $localize`Please (re-)record some audio or select an audio file.`,
    //TODO           $localize`No audio`,
    //TODO           { timeOut: 15000 },
    //TODO         );
    //TODO       }
    //TODO       this.toastr.error(
    //TODO         $localize`Please select or write text, select or record audio data, and select the language.`,
    //TODO         $localize`Form not complete`,
    //TODO         { timeOut: 15000 },
    //TODO       );
    //TODO     }
  }

  onAudioFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (!el.files || el.files.length !== 1) {
      this.audioGroup.controls.upload.reset();
      return;
    }

    let file: File = el.files[0];
    if (file.type === "video/webm") {
      // No, it is audio, because we say so.
      file = new File([file], file.name, { type: "audio/webm" });
    }
    this.audioGroup.controls.upload.setValue(file);
    this.audioGroup.controls.upload.markAsDirty();
    if (this.audioGroup.controls.upload.valid) {
      this.toastr.success(
        $localize`File ` +
          file.name +
          $localize` processed, but not uploaded. Your audio will stay on your computer.`,
        $localize`Great!`,
        { timeOut: 10000 },
      );
    }
  }

  deleteTextUpload() {
    this.textGroup.controls.edit.reset();
  }

  onTextFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (!el.files || el.files.length !== 1) {
      this.textGroup.controls.upload.reset();
      return;
    }

    const file = el.files[0];
    this.textGroup.controls.upload.setValue(file);
    this.textGroup.controls.upload.markAsDirty();
    if (this.textGroup.controls.upload.valid) {
      this.toastr.success(
        $localize`File ` +
          file.name +
          $localize` processed. It will be uploaded through an encrypted connection when you go to the next step.`,
        $localize`Great!`,
        { timeOut: 10000 },
      );
    }

    //TODO    const el = event.target as HTMLInputElement;
    //TODO    if (!el.files || el.files.length !== 1) {
    //TODO      this.studioService.textControl$.setValue(null);
    //TODO      return;
    //TODO    }
    //TODO
    //TODO    // Validate the user's select file against the accepted file types.
    //TODO    const file: File = el.files[0];
    //TODO    if (!validateFileType(file, this.textUploadAccepts)) {
    //TODO      this.toastr.error(
    //TODO        $localize`The file "${file.name}:fileName:" is not a compatible text file.`,
    //TODO        $localize`Sorry!`,
    //TODO        { timeOut: 15000 },
    //TODO      );
    //TODO      this.textFileUpload.nativeElement.value = "";
    //TODO      return;
    //TODO    }
    //TODO
    //TODO    // Validate the file size against the imposed limits
    //TODO    const isXML = validateFileType(file, ".readalong,.xml");
    //TODO    const maxSizeKB = isXML ? maxRasSizeKB : maxTxtSizeKB;
    //TODO    if (file.size > maxSizeKB * 1024) {
    //TODO      const fileTooBigMessage = isXML
    //TODO        ? $localize`.readalong file too large. `
    //TODO        : $localize`Text file too large. `;
    //TODO
    //TODO      this.toastr.error(
    //TODO        fileTooBigMessage + $localize`Max size: ` + maxSizeKB + $localize` KB.`,
    //TODO        $localize`Sorry!`,
    //TODO        { timeOut: 15000 },
    //TODO      );
    //TODO      this.textFileUpload.nativeElement.value = "";
    //TODO      return;
    //TODO    }
    //TODO
    //TODO    this.studioService.textControl$.setValue({
    //TODO      source: "upload",
    //TODO      blob: file,
    //TODO      filename: file.name,
    //TODO    });
    //TODO    this.toastr.success(
    //TODO      $localize`File ` +
    //TODO        file.name +
    //TODO        $localize` processed. It will be uploaded through an encrypted connection when you go to the next step.`,
    //TODO      $localize`Great!`,
    //TODO      { timeOut: 10000 },
    //TODO    );
  }

  testButton(event: Event) {
    //     console.log("dirty", this.inputText.dirty);
    //     console.log("valid", this.inputText.valid);
    //
    //     console.log(this.inputText.value);
    //     console.log(this.inputText!.updateValueAndValidity());
    //
    //     console.log("dirty", this.inputText.dirty);
    //     console.log("valid", this.inputText.valid);
    //
    //     console.log(this.inputText);
    //     console.log(this.inputTextFile);
    console.log(
      "inputText",
      this.textGroup.controls.edit.dirty,
      this.textGroup.controls.edit.valid,
      this.textGroup.controls.edit.value,
    );
    console.log(
      "inputTextFile",
      this.textGroup.controls.upload.dirty,
      this.textGroup.controls.upload.valid,
      this.textGroup.controls.upload.value,
    );
    console.log(
      "textGroup",
      this.textGroup.dirty,
      this.textGroup.valid,
      this.textGroup.value,
    );

    console.log(
      "inputAudioMic",
      this.audioGroup.controls.mic.dirty,
      this.audioGroup.controls.mic.valid,
      this.audioGroup.controls.mic.value,
    );
    console.log(
      "inputAudioFile",
      this.audioGroup.controls.upload.dirty,
      this.audioGroup.controls.upload.valid,
      this.audioGroup.controls.upload.value,
    );
    console.log(
      "audioGroup",
      this.audioGroup.dirty,
      this.audioGroup.valid,
      this.audioGroup.value,
    );
  }
}
