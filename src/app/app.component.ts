import { forkJoin, from, of, Subject } from "rxjs";
import { map } from "rxjs/operators";

import { Component, ViewChild } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";

import { B64Service } from "./b64.service";
import { FileService } from "./file.service";
import { SoundswallowerService } from "./soundswallower.service";
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
    private fileService: FileService
  ) {}
  ngOnInit(): void {
    this.b64Inputs$.subscribe((x) => console.log(x));
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
      ]).subscribe((x: any) => this.b64Inputs$.next(x));
      this.stepper.next();
    }
  }
}
