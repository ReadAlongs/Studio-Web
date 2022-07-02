import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UploadComponent } from './upload/upload.component';
import { MatStepper } from '@angular/material/stepper';
import { SoundswallowerService } from './soundswallower.service';
import { B64Service } from './b64.service';
import { FileService } from './file.service';
import { forkJoin, from } from 'rxjs';
import { map } from 'rxjs/operators'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  firstFormGroup: any;
  title = 'readalong-studio';
  @ViewChild('upload', { static: false }) upload?: UploadComponent;
  @ViewChild("stepper") private stepper: MatStepper;
  constructor(private b64Service: B64Service, private fileService: FileService) {

  }
  ngOnInit(): void {
  }

  formChanged(formGroup: FormGroup) {
    this.firstFormGroup = formGroup
  }
  stepChange(event: any[]) {
    if (event[0] === 'aligned') {
      console.log(event)
      forkJoin([
        this.fileService.readFileAsData$(event[1]),
        from(event[3]).pipe(map(
          (smil) => this.b64Service.alignmentToSmil(smil, "test", "test")
        ))
      ]).subscribe((x) => console.log(x))
      console.log(`data:application/xml;base64,${this.b64Service.utf8_to_b64(event[2])}`)
      // console.log(`data:application/xml;base64,${Buffer.from(event[2], 'base64')}`)
      this.stepper.next()
    }
  }
}
