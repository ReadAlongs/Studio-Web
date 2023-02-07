import { ShepherdService } from "./shepherd.service";
import { ToastrService } from "ngx-toastr";
import { forkJoin, of, BehaviorSubject, Subject } from "rxjs";
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
  final_step,
  intro_step,
  language_step,
  text_file_step,
  text_write_step,
} from "./shepherd.steps";
import { UploadComponent } from "./upload/upload.component";
import { StepperSelectionEvent } from "@angular/cdk/stepper";

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
  b64Inputs$ = new Subject<string[]>();
  render$ = new BehaviorSubject<boolean>(false);
  @ViewChild("upload", { static: false }) upload?: UploadComponent;
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
    this.shepherdService.defaultStepOptions = {
      classes: "",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
    };
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
    this.shepherdService.modal = true;
    this.shepherdService.confirmCancel = false;
    this.shepherdService.addSteps([
      intro_step,
      data_step,
      text_write_step,
      text_file_step,
      audio_record_step,
      audio_file_step,
      language_step,
      final_step,
    ]);
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
      const b64_xml = this.b64Service.xmlToB64(aligned_xml);
      forkJoin([
        this.fileService.readFileAsData$(event[1]),
        of(`data:application/xml;base64,${b64_xml}`),
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
