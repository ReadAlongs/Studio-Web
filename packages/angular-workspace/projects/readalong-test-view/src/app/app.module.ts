import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ReadalongModule } from '../../../readalong/src/lib/readalong.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReadalongModule
  ],
  exports: [
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
