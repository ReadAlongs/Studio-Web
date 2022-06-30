import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UploadComponent } from './upload/upload.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  firstFormGroup: any;
  title = 'readalong-studio';
  @ViewChild('upload', { static: false }) upload?: UploadComponent;
  constructor() {

  }
  ngOnInit(): void {

  }
  formChanged(formGroup: FormGroup) {
    this.firstFormGroup = formGroup
  }
}
