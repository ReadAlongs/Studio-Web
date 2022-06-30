import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { G2pService } from '../g2p.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RasService } from '../ras.service';
import { FileService } from '../file.service';
import { catchError, Subject, switchAll, take } from 'rxjs';
import { map } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.sass']
})
export class UploadComponent implements OnInit {
  langs$ = this.g2pService.getLangs$()
  $loading = new Subject<boolean>();
  langControl = new FormControl<string | null>(null, Validators.required);
  textControl = new FormControl<any>(null, Validators.required);
  audioControl = new FormControl<File | null>(null, Validators.required);
  @Output() stepChange = new EventEmitter<any[]>();
  public uploadFormGroup = this._formBuilder.group({ 'lang': this.langControl, 'text': this.textControl, 'audio': this.audioControl })
  constructor(private _formBuilder: FormBuilder, private g2pService: G2pService, private toastr: ToastrService, private rasService: RasService, private fileService: FileService) { }

  ngOnInit(): void {
  }


  nextStep() {
    if (this.uploadFormGroup.valid) {
      // Loading
      this.$loading.next(true)
      // Determine text type
      let text_type = 'text'
      if (this.textControl.value.name.endsWith('xml')) {
        text_type = 'xml'
      }
      let body: any = {
        "text_languages": [this.langControl.value, 'und'], "encoding": "utf8"
      }
      // Read file
      this.fileService.readFile$(this.textControl.value).pipe(
        // Only take first response
        take(1),
        // Query RAS service
        map((xml: any) => { body[text_type] = xml; return this.rasService.getReadalong$(body) }),
        // Switch to RAS observable
        switchAll(),
        // Catch Errors
        catchError((err) => {
          this.toastr.error("Please try again, or contact us if the problem persists.", 'Hmm, something went wrong...');
          this.$loading.next(false);
          throw 'error in source. Details: ' + err;
        }),
        // Emit change with response to parent
      ).subscribe((x: any) => { this.$loading.next(false); this.stepChange.emit(['align', x]) })
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
