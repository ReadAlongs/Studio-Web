import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UploadComponent } from './upload/upload.component';
import { MatStepper } from '@angular/material/stepper';

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
  constructor() {

  }
  ngOnInit(): void {

  }
  formChanged(formGroup: FormGroup) {
    this.firstFormGroup = formGroup
  }
  stepChange(event: any[]) {
    if (event[0] === 'align') {
      console.log('aligning')
      console.log('step')
      this.stepper.next();
    }
  }
}
