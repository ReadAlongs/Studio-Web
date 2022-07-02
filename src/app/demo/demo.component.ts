import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.sass']
})
export class DemoComponent implements OnInit {
  text: ""
  audio: ""
  smil: ""
  constructor() { }

  ngOnInit(): void {
  }

}
