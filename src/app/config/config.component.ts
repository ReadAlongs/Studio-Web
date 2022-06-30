import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.sass']
})
export class ConfigComponent implements OnInit {
  formGroup = this._formBuilder.group({
    closedCaptioning: '',
    textGrids: '',
    singleHTML: ''
  });
  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit(): void {
  }
  nextStep() {

  }

}
