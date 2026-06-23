import { NgModule, provideZoneChangeDetection } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { NgxRAWebComponentModule } from "@readalongs/ngx-web-component";
import { defineCustomElements } from "@readalongs/web-component/loader";

defineCustomElements();

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, NgxRAWebComponentModule],
  providers: [provideZoneChangeDetection()],
  bootstrap: [AppComponent],
})
export class AppModule {}
