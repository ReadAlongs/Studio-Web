import { BehaviorSubject } from 'rxjs';

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'readalong-test-view';
  text$ = new BehaviorSubject("https://eastcree.org/read_along/northern/beaver/beaver.xml");
  alignment$ = new BehaviorSubject("https://eastcree.org/read_along/northern/beaver/beaver.smil");
  audio$ = new BehaviorSubject("https://eastcree.org/read_along/northern/beaver/beaver.mp3");
  constructor() { }
  ngAfterViewInit() {
    setTimeout(() => {
      console.log("switching");
      this.text$.next("https://eastcree.org/read_along/northern/winter/winter.xml");
      this.alignment$.next("https://eastcree.org/read_along/northern/winter/winter.smil");
      this.audio$.next("https://eastcree.org/read_along/northern/winter/winter.mp3");
    }, 3000)
  }
}
