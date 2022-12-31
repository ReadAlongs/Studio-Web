// -*- typescript-indent-level: 2 -*-
import { ToastrService } from "ngx-toastr";
import { forkJoin, of, Subject, zip } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";

import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ProgressBarMode } from "@angular/material/progress-bar";

import { AudioService } from "../audio.service";
import { FileService } from "../file.service";
import { MicrophoneService } from "../microphone.service";
import {
  RasService,
  ReadAlong,
  ReadAlongRequest,
  LanguageMap,
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
export class UploadComponent implements OnInit {
  langs$ = this.rasService.getLangs$().pipe(
    map((langs: LanguageMap) =>
      Object.entries(langs).map(([lang_code, lang_name]) => {
        return { id: lang_code, name: lang_name };
      })
    )
  );
  $loading = new Subject<boolean>();
  langControl = new FormControl<string>("und", Validators.required);
  textControl = new FormControl<any>(null, Validators.required);
  audioControl = new FormControl<File | Blob | null>(null, Validators.required);
  recording = false;
  playing = false;
  progressMode: ProgressBarMode = "indeterminate";
  progressValue = 0;

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
  textInput: any;
  constructor(
    private _formBuilder: FormBuilder,
    private toastr: ToastrService,
    private rasService: RasService,
    private fileService: FileService,
    private audioService: AudioService,
    private ssjsService: SoundswallowerService,
    private microphoneService: MicrophoneService,
    private dialog: MatDialog
  ) {
    this.microphoneService.recorderError.subscribe((recorderErrorCase) => {
      this.toastr.error(
        recorderErrorCase.toString(),
        $localize`Whoops, something went wrong while recording!`
      );
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.ssjsService.initialize();
    } catch (err) {
      console.log(err);
    }
  }

  downloadRecording() {
    if (this.audioControl.value !== null) {
      let blob = new Blob([this.audioControl.value], {
        type: "audio/webm",
      });
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ras-audio-" + Date.now() + ".webm";
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

  handleTextInput(event: any) {
    this.textInput = event.target.value;
  }

  startRecording() {
    this.recording = true;
    this.microphoneService.startRecording();
  }

  pauseRecording() {
    this.recording = false;
    this.microphoneService.pause();
  }

  resumeRecording() {
    this.recording = true;
    this.microphoneService.resume();
  }

  playRecording() {
    if (!this.playing && this.audioControl.value !== null) {
      let player = new window.Audio();
      player.src = URL.createObjectURL(this.audioControl.value);
      player.onended = () => {
        this.playing = false;
      };
      player.load();
      this.playing = true;
      player.play();
    }
  }

  deleteRecording() {
    this.audioControl.setValue(null);
  }

  stopRecording() {
    this.recording = false;
    this.microphoneService
      .stopRecording()
      .then((output) => {
        this.toastr.success(
          $localize`Audio was successfully recorded`,
          $localize`Yay!`
        );
        this.audioControl.setValue(output as Blob);
        // do post output steps
      })
      .catch((errorCase) => {
        this.toastr.error(
          $localize`Please try again, or select a pre-recorded file.`,
          $localize`Audio not recorded!`
        );
        console.log(errorCase);
        // Handle Error
      });
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
    if (this.uploadFormGroup.valid) {
      // Loading
      this.$loading.next(true);
      // Determine text type
      let text_type = "text";
      if (
        this.inputMethod.text === "upload" &&
        this.textControl.value.name.endsWith("xml")
      ) {
        text_type = "xml";
      }
      let body: ReadAlongRequest = {
        text_languages: [this.langControl.value as string, "und"],
      };
      // Combine audio and text observables
      // Read file
      let currentAudio: any = this.audioControl.value;
      forkJoin({
        audio: this.audioService.loadAudioBufferFromFile$(currentAudio, 8000),
        ras: this.fileService.readFile$(this.textControl.value).pipe(
          switchMap((xml: any) => {
            console.log("query api");
            if (text_type == "text") body.text = xml;
            else body.xml = xml;
            return this.rasService.assembleReadalong$(body);
          })
        ),
      })
        .pipe(
          switchMap(({ audio, ras }: { audio: AudioBuffer; ras: any }) => {
            return forkJoin({
              progress: this.ssjsService.align$(
                audio,
                ras["text_ids"],
                ras["lexicon"]
              ),
              xml: of(ras["processed_xml"]),
            });
          })
        )
        .subscribe(
          ({ progress, xml }: { progress: AlignmentProgress; xml: string }) => {
            this.$loading.next(false);
            this.stepChange.emit([
              "aligned",
              this.audioControl.value,
              xml,
              progress.hypseg,
            ]);
          }
        );
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
