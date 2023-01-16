import { Component, ViewChild } from '@angular/core';
import { Components } from '@readalongs/web-component/loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('readalong') readalong!: Components.ReadAlong
  title = 'angular-demo';
  language = 'fra';
  hidden = false;

  toggleHidden() {
    this.hidden = !this.hidden
  }

  changeTheme() {
    // This function changes the theme by directly changing the readalong component
    if (this.readalong.theme === 'light') {
      this.readalong.theme = 'dark'
    } else {
      this.readalong.theme = 'light'
    }
    
  }

  changeLanguage() {
    // This function changes the language by changing the language property on the AppComponent
    // which is input to the readalong component.
    if (this.language === 'fra'){
      this.language = 'eng'
    } else {
      this.language = 'fra'
    }
  }
}
