import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';
import { NgxRAWebComponentModule } from '@readalongs/ngx-web-component';

@NgModule({
  declarations: [
    AppComponent,
    NxWelcomeComponent
  ],
  imports: [
    BrowserModule,
    NgxRAWebComponentModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
