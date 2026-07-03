// -*- typescript-indent-level: 2 -*-
import { Toast, ToastrService } from "ngx-toastr";
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
import {
  DocumentWord,
  diffWordSequences,
  remapWordIndex,
  walkDocumentWords,
} from "../shared/textarea-overlay/document-words";
import {
  isG2pAssembleErrorBody,
  mapG2pErrorsToRanges,
} from "./g2p-error-mapping";

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
  // Later bumped to 400 to accommodate a real life use case.
  private maxRasSizeKB = 400;
  private currentToast: number;
  // The exact text sent in the last alignment request — g2p error offsets
  // must be resolved against this, not the (possibly since-edited) live
  // textarea value.
  private lastSubmittedText = "";
  // Indices (into trackedWords) of words currently flagged by a g2p error.
  private erroringIndices: number[] = [];
  // The word sequence erroringIndices refers to, i.e. as of the last
  // syncErrorMarks() call — needed to remap indices forward across edits
  // elsewhere in the document. See syncErrorMarks().
  private trackedWords: DocumentWord[] = [];
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

    // Keep g2p error underlines in sync with edits: remap their current
    // positions across the latest edit, dropping any that fell inside it.
    // Unfiltered (unlike the subscription above) so clearing the textarea
    // also clears any lingering marks.
    this.studioService.$textInput
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((text) => this.syncErrorMarks(text));
  }

  /**
   * Remaps `erroringIndices` from `trackedWords` onto `currentText`'s word
   * sequence, dropping any that fell inside the edited region, and
   * publishes the survivors' current character ranges for the overlay to
   * underline.
   *
   * This is index-based rather than a simple "does the word at its
   * original index still read the same" check: editing *any* word shifts
   * the indices of every word after it, so a naive check would spuriously
   * drop unrelated marks whenever an earlier flagged word was edited
   * (e.g. "hello 1 2 3" with 1/2/3 all flagged — deleting "2" alone must
   * not also clear the mark on "3", which simply moved to a new index).
   * diffWordSequences finds the unaffected prefix/suffix around the edit
   * so indices outside it can be carried forward correctly instead.
   */
  private syncErrorMarks(currentText: string): void {
    if (this.erroringIndices.length === 0) {
      return;
    }
    const currentWords = walkDocumentWords(currentText);
    const diff = diffWordSequences(this.trackedWords, currentWords);
    this.erroringIndices = this.erroringIndices
      .map((index) => remapWordIndex(diff, index))
      .filter((index): index is number => index !== null);
    this.trackedWords = currentWords;
    this.studioService.$textInputErrors.next(
      this.erroringIndices.map((index) => {
        const word = currentWords[index];
        return { start: word.start, end: word.end };
      }),
    );
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
      if (
        isG2pAssembleErrorBody(err.error) &&
        this.applyG2pErrorRanges(err.error.partial_ras)
      ) {
        this.toastr.error(
          $localize`Some words couldn't be processed — see the highlighted text.`,
          $localize`Text processing failed.`,
          { timeOut: 30000, closeButton: true },
        );
        return;
      }

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
      });
    } else {
      this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        { timeOut: 60000 },
      );
    }
  }

  /**
   * Attempts to positionally map a g2p assemble error onto the words that
   * were actually submitted, and — if that succeeds — flags them for the
   * overlay to underline. Returns false (without flagging anything) if the
   * mapping isn't trustworthy, so the caller can fall back to the generic
   * error toast rather than silently pointing at the wrong word.
   */
  private applyG2pErrorRanges(partialRas: string | undefined): boolean {
    if (!partialRas) {
      return false;
    }
    const errors = mapG2pErrorsToRanges(this.lastSubmittedText, partialRas);
    if (errors === null || errors.length === 0) {
      return false;
    }
    // Seed tracking from the submitted text's word sequence, then
    // immediately sync forward to whatever the textarea holds *now* (the
    // user may have kept typing while the request was in flight) — same
    // remapping logic as any later edit.
    this.trackedWords = walkDocumentWords(this.lastSubmittedText);
    this.erroringIndices = errors.map((error) => error.index);
    this.syncErrorMarks(this.studioService.$textInput.value);
    return true;
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
      let message;
      if (err.name === "NotAllowedError") {
        message = $localize`Microphone access was denied. Please grant microphone access to use this feature.`;
      } else {
        message = err.toString();
      }
      this.toastr.error(message, $localize`Could not start recording!`, {
        timeOut: 15000,
      });
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

    // Don't leave stale g2p error marks from a previous failed attempt
    // showing while this new one is in flight.
    this.erroringIndices = [];
    this.studioService.$textInputErrors.next([]);

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
            this.lastSubmittedText = text;
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
          if (ras.log) {
            console.log("RAS Web API assemble/ log:\n" + ras.log);
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
            this.toastr.toasts.forEach((toast) => {
              // clean all outstanding success and error toasts on alignment success,
              // they are no longer relevant, but keep the warnings, they are typically
              // about having to relax alignment parameters.
              let type = (toast.toastRef.componentInstance as Toast)
                .toastPackage.toastType;
              if (type === "toast-error" || type === "toast-success") {
                this.toastr.clear(toast.toastId);
              }
            });
            this.stepChange.emit([
              "aligned",
              this.studioService.audioControl$.value,
              progress.xml,
              progress.hypseg,
            ]);
            if (this.ssjsService.mode !== BeamDefaults.strict) {
              this.toastr.success(
                $localize`Alignment succeeded, but with relaxed parameters. Please check the results for alignment errors, and please check your text and audio for quality and to make sure they are a good match.`,
                $localize`Relaxed alignment succeeded.`,
                { timeOut: 20000 },
              );
            }
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
