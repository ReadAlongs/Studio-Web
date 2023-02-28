// -*- typescript-indent-level: 2 -*-
import { ToastrService } from "ngx-toastr";
import {
  Observable,
  Subject,
  forkJoin,
  finalize,
  switchMap,
  takeUntil,
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
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { HttpErrorResponse } from "@angular/common/http";

import { AudioService } from "../audio.service";
import { environment } from "../../environments/environment";
import { FileService } from "../file.service";
import { MicrophoneService } from "../microphone.service";
import {
  RasService,
  ReadAlong,
  ReadAlongRequest,
  SupportedLanguage,
} from "../ras.service";
import {
  SoundswallowerService,
  AlignmentProgress,
} from "../soundswallower.service";
import { TextFormatDialogComponent } from "../text-format-dialog/text-format-dialog.component";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.sass"],
})
export class UploadComponent implements OnDestroy, OnInit {
  isLoaded = false;
  langs: Array<SupportedLanguage> = [];
  loading = false;
  langControl = new FormControl<string>("und", Validators.required);
  textControl = new FormControl<any>(null, Validators.required);
  audioControl = new FormControl<File | Blob | null>(null, Validators.required);
  starting_to_record = false;
  recording = false;
  playing = false;
  player: any = null;
  contactLink = environment.packageJson.contact;
  progressMode: ProgressBarMode = "indeterminate";
  progressValue = 0;
  maxTxtSizeKB = 10; // Max 10 KB plain text file size
  maxRasSizeKB = 20; // Max 20 KB .readalong XML text size
  @ViewChild("textInputElement") textInputElement: ElementRef;
  @Output() stepChange = new EventEmitter<any[]>();
  public uploadFormGroup = this._formBuilder.group({
    lang: this.langControl,
    text: this.textControl,
    audio: this.audioControl,
  });
  inputMethod = {
    audio: "mic",
    text: "edit",
  };
  textInput: string = "";
  unsubscribe$ = new Subject<void>();
  private route: ActivatedRoute;
  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private toastr: ToastrService,
    private rasService: RasService,
    private fileService: FileService,
    private audioService: AudioService,
    private ssjsService: SoundswallowerService,
    private microphoneService: MicrophoneService,
    private dialog: MatDialog
  ) {}

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
      this.toastr.error(err.error.detail, $localize`Text processing failed.`, {
        timeOut: 15000,
      });
    } else {
      this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        }
      );
    }
  }

  reportSoundSwallowerError(err: Error) {
    if (err.message === "No alignment found") {
      this.toastr.error(
        $localize`Please listen to your audio to make sure it is clear and corresponds
to the text.`,
        $localize`Alignment failed.`,
        {
          timeOut: 15000,
        }
      );
    } else {
      this.toastr.error(
        $localize`Your text may contain unpronounceable characters or numbers.
Please check it to make sure all words are spelled out completely, e.g. write "42" as "forty two".`,
        $localize`Alignment failed.`,
        {
          timeOut: 15000,
        }
      );
    }
  }

  reportAudioError(err: Error) {
    this.toastr.error(err.message, $localize`Audio processing failed.`, {
      timeOut: 15000,
    });
  }

  downloadRecording() {
    if (this.audioControl.value !== null) {
      let blob = new Blob([this.audioControl.value], {
        type: this.audioControl.value.type,
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
    if (this.textInput) {
      let textBlob = new Blob([this.textInput], {
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
    if (!this.playing && this.audioControl.value !== null) {
      let player = new window.Audio();
      this.player = player;
      player.src = URL.createObjectURL(this.audioControl.value);
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
    this.audioControl.setValue(null);
  }

  async stopRecording() {
    this.recording = false;
    try {
      let output = await this.microphoneService.stopRecording();
      // possibly check for zero-length output and throw here
      this.toastr.success(
        $localize`Audio was successfully recorded. Please listen to your recording to make sure it's OK, and save it for reuse if so.`,
        $localize`Yay!`,
        { timeOut: 10000 }
      );
      this.audioControl.setValue(output);
      // do any post output steps
    } catch (err: any) {
      if (err === "Recorder didn't hear anything") {
        this.toastr.error(
          $localize`We couldn't record anything, is your microphone blocked or disconnected? If the problem persists please try with a headset or other microphone.`,
          $localize`Audio not recorded!`
        );
      } else {
        this.toastr.error(
          $localize`Please try again, or select a pre-recorded file.`,
          $localize`Audio not recorded!`
        );
      }

      console.log(err);
    }
  }

  toggleAudioInput(event: any) {
    this.inputMethod.audio = event.value;
  }

  toggleTextInput(event: any) {
    this.inputMethod.text = event.value;
  }

  nextStep() {
    if (this.inputMethod.text === "edit") {
      if (this.textInput) {
        let inputText = new Blob([this.textInput], {
          type: "text/plain",
        });
        this.textControl.setValue(inputText);
      } else {
        this.toastr.error(
          $localize`Please enter text to align.`,
          $localize`No text`,
          { timeOut: 15000 }
        );
      }
    } else {
      if (this.textControl.value === null) {
        this.toastr.error(
          $localize`Please select a text file.`,
          $localize`No text`,
          { timeOut: 15000 }
        );
      }
    }
    if (!this.ssjsService.modelLoaded) {
      this.toastr.error(
        $localize`Sorry, the alignment model isn't loaded yet. Please wait a while and try again if you're on a slow connection. If the problem persists, please contact us.`,
        $localize`No model loaded`,
        { timeOut: 15000 }
      );
    } else if (this.uploadFormGroup.valid && this.audioControl.value !== null) {
      // Show progress bar
      this.loading = true;
      this.progressMode = "query";
      // Determine text type for API request
      let input_type;
      if (
        this.inputMethod.text === "upload" &&
        (this.textControl.value.name.toLowerCase().endsWith(".xml") ||
          this.textControl.value.name.toLowerCase().endsWith(".readalong"))
      )
        input_type = "application/readalong+xml";
      else input_type = "text/plain";
      // Create request (text is possibly read from a file later...)
      let body: ReadAlongRequest = {
        text_languages: [this.langControl.value as string, "und"],
        type: input_type,
      };
      forkJoin({
        audio: this.audioService.loadAudioBufferFromFile$(
          this.audioControl.value as File,
          8000
        ),
        ras: this.fileService.readFile$(this.textControl.value).pipe(
          switchMap((text: string): Observable<ReadAlong> => {
            body.input = text;
            this.progressMode = "determinate";
            this.progressValue = 0;
            return this.rasService.assembleReadalong$(body);
          })
        ),
      })
        .pipe(
          switchMap(({ audio, ras }) =>
            // We can't give the arguments types because RxJS is broken somehow,
            // see https://stackoverflow.com/questions/66615681/rxjs-switchmap-mergemap-resulting-in-obserableunknown
            this.ssjsService.align$(audio, ras as ReadAlong)
          ),
          takeUntil(this.unsubscribe$)
        )
        .subscribe({
          next: (progress) => {
            if (progress.hypseg !== undefined) {
              this.loading = false;
              this.stepChange.emit([
                "aligned",
                this.audioControl.value,
                progress.xml,
                progress.hypseg,
              ]);
            } else {
              this.progressValue = Math.round(
                (progress.pos / progress.length) * 100
              );
            }
          },
          error: (err: Error) => {
            this.loading = false;
            if (err instanceof HttpErrorResponse) {
              this.reportRasError(err);
            } else if (err.message.includes("align")) {
              this.reportSoundSwallowerError(err);
            } else {
              this.reportAudioError(err);
            }
          },
        });
    } else {
      if (this.langControl.value === null) {
        this.toastr.error(
          $localize`Please select a language.`,
          $localize`No language`,
          { timeOut: 15000 }
        );
      }
      if (this.audioControl.value === null) {
        this.toastr.error(
          $localize`Please (re-)record some audio or select an audio file.`,
          $localize`No audio`,
          { timeOut: 15000 }
        );
      }
      this.toastr.error(
        $localize`Please select or write text, select or record audio data, and select the language.`,
        $localize`Form not complete`,
        { timeOut: 15000 }
      );
    }
  }

  onFileSelected(type: any, event: any) {
    const file: File = event.target.files[0];
    if (type === "audio") {
      if (file.type == "video/webm") {
        // No, it is audio, because we say so.
        const audioFile = new File([file], file.name, { type: "audio/webm" });
        this.audioControl.setValue(audioFile);
      } else {
        this.audioControl.setValue(file);
      }
      this.toastr.success(
        $localize`File ` +
          file.name +
          $localize` processed, but not uploaded. Your audio will stay on your computer.`,
        $localize`Great!`,
        { timeOut: 10000 }
      );
    } else if (type === "text") {
      let maxSizeKB =
        file.name.split(".").pop() === "readalong"
          ? this.maxRasSizeKB
          : this.maxTxtSizeKB;
      if (file.size > maxSizeKB * 1024) {
        this.toastr.error(
          $localize`File too large. Max size: ` + maxSizeKB + $localize` KB`,
          $localize`Sorry!`
        );
        this.textInputElement.nativeElement.value = "";
      } else {
        this.textControl.setValue(file);
        this.toastr.success(
          $localize`File ` +
            file.name +
            $localize` processed. It will be uploaded through an encrypted connection when you go to the next step.`,
          $localize`Great!`,
          { timeOut: 10000 }
        );
      }
    }
  }
}
