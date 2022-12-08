// -*- typescript-indent-level: 2 -*-
import { ToastrService } from "ngx-toastr";
import { forkJoin, from, Subject, zip } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";

import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";

import { AudioService } from "../audio.service";
import { FileService } from "../file.service";
import { MicrophoneService } from "../microphone.service";
import { RasService } from "../ras.service";
import { SoundswallowerService } from "../soundswallower.service";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.sass"],
})
export class UploadComponent implements OnInit {
  langs$ = this.rasService.getLangs$().pipe(
    map((langs: object) =>
      Object.entries(langs).map(
        ([lang_code, lang_name]: Array<Array<string>>) => {
          return { id: lang_code, name: lang_name };
        }
      )
    )
  );
  $loading = new Subject<boolean>();
  langControl = new FormControl<string>("und", Validators.required);
  textControl = new FormControl<any>(null, Validators.required);
  audioControl = new FormControl<File | Blob | null>(null, Validators.required);
  recording = false;
  playing = false;
  @Output() stepChange = new EventEmitter<any[]>();
  public uploadFormGroup = this._formBuilder.group({
    lang: this.langControl,
    text: this.textControl,
    audio: this.audioControl,
  });
  processedXML = "";
  maxAudioSize = 10 * 1024 ** 2; // Max 10 MB audio file size
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
    private microphoneService: MicrophoneService
  ) {
    this.microphoneService.recorderError.subscribe((recorderErrorCase) => {
      this.toastr.error(
        recorderErrorCase.toString(),
        "Whoops, something went wrong!"
      );
    });
  }

  ngOnInit(): void {
    this.ssjsService.initialize$({}).then(
      (_) => {
        this.ssjsService.alignerReady$.next(true);
      },
      (err) => console.log(err)
    );
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
      this.toastr.error("No audio to download", "Sorry!");
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
      this.toastr.error("No text to download", "Sorry!");
    }
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
        this.toastr.success("Audio was successfully recorded", "Yay!");
        this.audioControl.setValue(output as Blob);
        // do post output steps
      })
      .catch((errorCase) => {
        this.toastr.error(
          "Please try again, or upload a file.",
          "Audio not recorded!"
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
      let inputText = new Blob([this.textInput], {
        type: "text/plain",
      });
      this.textControl.setValue(inputText);
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
      let body: any = {
        text_languages: [this.langControl.value, "und"],
        encoding: "utf8",
      };
      // Combine audio and text observables
      // Read file
      let currentAudio: any = this.audioControl.value;
      let sampleRate = this.ssjsService.decoder.get_config(
        "samprate"
      ) as number;
      forkJoin({
        audio: this.audioService.loadAudioBufferFromFile$(
          currentAudio,
          sampleRate
        ),
        ras: this.fileService.readFile$(this.textControl.value).pipe(
          // Only take first response
          take(1),
          // Query RAS service
          switchMap((xml: any) => {
            console.log("query api");
            body[text_type] = xml;
            return this.rasService.assembleReadalong$(body);
          })
        ),
      }).subscribe((response: any) => {
        let { audio, ras } = response;
        let hypseg = this.ssjsService.align$(
          audio,
          ras["text_ids"],
          ras["lexicon"]
        );
        this.processedXML = ras["processed_xml"];
        this.$loading.next(false);
        this.stepChange.emit([
          "aligned",
          this.audioControl.value,
          this.processedXML,
          hypseg,
        ]);
      });
    } else {
      this.toastr.error(
        "Please upload a text and audio file and select the language.",
        "Form not complete!"
      );
    }
  }

  onFileSelected(type: any, event: any) {
    const file: File = event.target.files[0];
    if (file.size > this.maxAudioSize) {
      this.toastr.error("File too large", "Sorry!");
    } else {
      if (type === "audio") {
        if (file.type == "video/webm") {
          // No, it is audio, because we say so.
          const audioFile = new File([file], file.name, { type: "audio/webm" });
          this.audioControl.setValue(audioFile);
        } else {
          this.audioControl.setValue(file);
        }
        this.toastr.success(
          "File " +
            file.name +
            " processed, but not uploaded. Your audio will stay on your computer.",
          "Great!"
        );
      } else if (type === "text") {
        this.textControl.setValue(file);
        this.toastr.success(
          "File " + file.name + " uploaded through an encrypted connection",
          "Great!"
        );
      }
    }
  }
}
