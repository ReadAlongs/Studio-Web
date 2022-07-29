import { ShepherdService } from "angular-shepherd";
import { ToastrService } from "ngx-toastr";
import { forkJoin, from, of, Subject } from "rxjs";
import { map } from "rxjs/operators";

import { Component, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";

import { B64Service } from "./b64.service";
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
  @ViewChild("upload", { static: false }) upload?: UploadComponent;
  @ViewChild("stepper") private stepper: MatStepper;
  constructor(
    private b64Service: B64Service,
    private fileService: FileService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public shepherdService: ShepherdService
  ) {}
  ngOnInit(): void {
    this.b64Inputs$.subscribe((x) => console.log(x));
    this.toastr.warning(
      "This app has not been officially released and should not be expected to work properly yet.",
      "Warning",
      { timeOut: 10000 }
    );
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
      forkJoin([
        this.fileService.readFileAsData$(event[1]),
        of(
          `data:application/xml;base64,${this.b64Service.xmlStringToB64(
            event[2]
          )}`
        ),
        from(event[3]).pipe(
          map((smil) => this.b64Service.alignmentToSmil(smil, "test", "test"))
        ),
        this.b64Service.getBundle$(),
      ]).subscribe((x: any) => this.b64Inputs$.next(x));
      this.stepper.next();
    }
  }
}

@Component({
  selector: "privacy-dialog",
  templateUrl: "privacy-dialog.html",
})
export class PrivacyDialog {
  constructor(public dialogRef: MatDialogRef<PrivacyDialog>) {}
}
