import { ToastrModule } from "ngx-toastr";

import { HttpClientModule } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatToolbarModule } from "@angular/material/toolbar";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent, PrivacyDialog } from "./app.component";
import { ConfigComponent } from "./config/config.component";
import { DemoComponent } from "./demo/demo.component";
import { MaterialModule } from "./material.module";
import { UploadComponent } from "./upload/upload.component";
import { TextFormatDialogComponent } from "./text-format-dialog/text-format-dialog.component";

@NgModule({
  declarations: [
    AppComponent,
    ConfigComponent,
    DemoComponent,
    UploadComponent,
    PrivacyDialog,
    TextFormatDialogComponent,
    // ShepherdComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    MatToolbarModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
