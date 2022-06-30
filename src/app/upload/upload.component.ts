import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { G2pService } from '../g2p.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RasService } from '../ras.service';
import { Observable, switchAll } from 'rxjs';
import { map } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.sass']
})
export class UploadComponent implements OnInit {
  langs$ = this.g2pService.getLangs$()

  langControl = new FormControl<string | null>(null, Validators.required);
  textControl = new FormControl<any>(null, Validators.required);
  audioControl = new FormControl<File | null>(null, Validators.required);
  public uploadFormGroup = this._formBuilder.group({ 'lang': this.langControl, 'text': this.textControl, 'audio': this.audioControl })
  constructor(private _formBuilder: FormBuilder, private g2pService: G2pService, private toastr: ToastrService, private rasService: RasService) { }

  ngOnInit(): void {
  }

  readFile$ = (blob: any) => Observable.create((obs: any) => {
    if (!(blob instanceof Blob)) {
      obs.error(new Error('`blob` must be an instance of File or Blob.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = err => obs.error(err);
    reader.onabort = err => obs.error(err);
    reader.onload = () => obs.next(reader.result);
    reader.onloadend = () => obs.complete();

    return reader.readAsText(blob);
  });

  nextStep() {
    if (this.uploadFormGroup.valid) {
      // if (this.textControl.value?.name.endsWith('xml')) {

      // } else {
      //     fetch(this.textControl.value?.text)        
      // }
      console.log(this.langControl.value)
      this.readFile$(this.textControl.value).pipe(
        map((xml: any) => this.rasService.getReadalong$({ "text_languages": [this.langControl.value, 'und'], "encoding": "utf8", "xml": xml })),
        switchAll()
      ).subscribe((x: any) => console.log(x))
      // this.rasService.getReadalong$({ "text_languages": [this.langControl.value], "encoding": "utf8", "xml": "" })
      // this.toastr.success('This should go to the next step!', 'Success!');
    } else {
      this.toastr.error('Please upload a text and audio file and select the language.', 'Form not complete!');
    }
  }

  onFileSelected(type: any, event: any) {
    const file: File = event.target.files[0];
    if (file.size > 10000000) {
      this.toastr.error("File too large", "Sorry!")
    } else {
      if (type === 'audio') {
        this.audioControl.setValue(file)
        this.toastr.success("File " + file.name + " uploaded", "Great!")
      }
      else if (type === 'text') {
        this.textControl.setValue(file)
        this.toastr.success("File " + file.name + " uploaded", "Great!")
      }
    }
  }

}
