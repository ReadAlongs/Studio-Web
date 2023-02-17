import { ShepherdService } from "./shepherd.service";
import { ToastrService } from "ngx-toastr";
import { forkJoin, of, BehaviorSubject, Subject, take } from "rxjs";
import { map } from "rxjs/operators";
import { Segment } from "soundswallower";

import { Component, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";

import { B64Service } from "./b64.service";
import { createAlignedXML } from "./soundswallower.service";
import { FileService } from "./file.service";
import {
  audio_file_step,
  audio_record_step,
  data_step,
  step_one_final_step,
  step_two_intro_step,
  intro_step,
  language_step,
  readalong_play_step,
  readalong_play_word_step,
  readalong_add_image_step,
  readalong_add_translation_step,
  readalong_change_title_step,
  readalong_export_step,
  readalong_go_back_step,
  text_file_step,
  text_write_step,
} from "./shepherd.steps";
import { DemoComponent } from "./demo/demo.component";
import { UploadComponent } from "./upload/upload.component";
import { StepperSelectionEvent } from "@angular/cdk/stepper";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent {
  firstFormGroup: any;
  title = "readalong-studio";
  alignment = new Subject<string>();
  text = new Subject<string>();
  audio = new Subject<string>();
  b64Inputs$ = new Subject<[string, Document, [string, string]]>();
  render$ = new BehaviorSubject<boolean>(false);
  @ViewChild("upload", { static: false }) upload?: UploadComponent;
  @ViewChild("demo", { static: false }) demo?: DemoComponent;
  @ViewChild("stepper") private stepper: MatStepper;
  constructor(
    private b64Service: B64Service,
    private fileService: FileService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    public shepherdService: ShepherdService
  ) {}
  ngOnInit(): void {
    this.toastr.warning(
      $localize`This app has not been officially released and should not be expected to work properly yet.`,
      $localize`Warning`,
      { timeOut: 10000 }
    );
  }

  selectionChange(event: StepperSelectionEvent) {
    if (event.selectedIndex === 0) {
      this.render$.next(false);
    } else if (event.selectedIndex === 1) {
      this.render$.next(true);
    }
  }

  ngAfterViewInit() {

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
    text_file_step["when"] = {
      show: () => {
        if (this.upload) {
          this.upload.inputMethod.text = "upload";
        }
      },
      hide: () => {
        if (this.upload) {
          this.upload.inputMethod.text = "edit";
        }
      },
    };
    audio_file_step["when"] = {
      show: () => {
        if (this.upload) {
          this.upload.inputMethod.audio = "upload";
        }
      },
      hide: () => {
        if (this.upload) {
          this.upload.inputMethod.audio = "mic";
        }
      },
    };
    step_one_final_step['buttons'][1]['action'] = () => {
      this.fileService.returnFileFromPath$('assets/hello-world.mp3').subscribe((audioFile) => {
        if (!(audioFile instanceof HttpErrorResponse) && this.upload) {
          this.upload.textInput = "Hello world!"
          this.upload.inputMethod.text = "edit"
          this.upload.audioControl.setValue(audioFile);
          this.upload?.nextStep()
          this.stepper.animationDone.pipe(take(1)).subscribe(() => {
            // We can only attach to the shadow dom once it's been created, so unfortunately we need to define the steps like this.
            readalong_play_step["attachTo"] = {
              element: document.querySelector('#readalong')?.shadowRoot?.querySelector('div.control-panel__buttons--left'),
              on: "top"
            };
            readalong_play_word_step["attachTo"] = {
              element: document.querySelector('#readalong')?.shadowRoot?.querySelector('#t0b0d0p0s0w0'),
              on: "bottom"
            };
            readalong_add_image_step["attachTo"] = {
              element: document.querySelector('#readalong')?.shadowRoot?.querySelector('div.drop-area'),
              on: "bottom"
            };
            readalong_add_translation_step["attachTo"] = {
              element: document.querySelector('#readalong')?.shadowRoot?.querySelector('div.sentence'),
              on: "bottom"
            };
            this.shepherdService.next(); 
            // Strangely, adding steps actually removes all previous steps so we need to start the tour again here.
            this.shepherdService.addSteps([step_two_intro_step, readalong_play_step, readalong_play_word_step, readalong_change_title_step, readalong_add_image_step, readalong_add_translation_step, readalong_export_step, readalong_go_back_step]); 
            this.shepherdService.start()
          })
        } else {
          this.shepherdService.cancel()
        }
      }
      )
    }
    this.shepherdService.modal = true;
    this.shepherdService.confirmCancel = false;
    // Add initial steps for part one of the tour, other steps are added later
    // once the Web-Component is added to the DOM.
    this.shepherdService.addSteps([
      intro_step,
      data_step,
      text_write_step,
      text_file_step,
      audio_record_step,
      audio_file_step,
      language_step,
      step_one_final_step,
    ]);
    this.shepherdService.start()
  }

  openPrivacyDialog(): void {
    this.dialog.open(PrivacyDialog, {
      width: "250px",
    });
  }

  formChanged(formGroup: FormGroup) {
    this.firstFormGroup = formGroup;
  }

  stepChange(event: any[]) {
    if (event[0] === "aligned") {
      const aligned_xml = createAlignedXML(event[2], event[3] as Segment);
      forkJoin([
        this.fileService.readFileAsData$(event[1]),
        of(aligned_xml),
        this.b64Service.getBundle$(),
      ]).subscribe((x: any) => {
        this.b64Inputs$.next(x);
        this.stepper.next();
      });
    }
  }
}

@Component({
  selector: "privacy-dialog",
  templateUrl: "privacy-dialog.html",
})
export class PrivacyDialog {
  constructor(public dialogRef: MatDialogRef<PrivacyDialog>) {}
  ngOnInit() {
    this.dialogRef.updateSize("400px");
  }
}
