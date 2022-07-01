import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UploadComponent } from './upload/upload.component';
import { MatStepper } from '@angular/material/stepper';
import * as soundswallower from 'soundswallower';
import { BehaviorSubject, from } from 'rxjs';
import { take } from 'rxjs/operators'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  firstFormGroup: any;
  title = 'readalong-studio';
  alignerReady$ = new BehaviorSubject<boolean>(false);
  @ViewChild('upload', { static: false }) upload?: UploadComponent;
  @ViewChild("stepper") private stepper: MatStepper;
  constructor() {

  }
  ngOnInit(): void {
    let ssjs$ = from(this.loadSS()).pipe(take(1))
    ssjs$.subscribe((_) => this.alignerReady$.next(true))
  }

  async loadSS() {
    const ssjs = await soundswallower.initialize('assets/model/en-us')
    return ssjs
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
