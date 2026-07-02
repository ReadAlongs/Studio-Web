import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DownloadComponent } from "./download/download.component";
import { TextareaOverlayComponent } from "./textarea-overlay/textarea-overlay.component";
import { TextareaGutterComponent } from "./textarea-overlay/textarea-gutter.component";
import { BrowserModule } from "@angular/platform-browser";
import { MaterialModule } from "../material.module";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [
    DownloadComponent,
    TextareaOverlayComponent,
    TextareaGutterComponent,
  ],
  imports: [BrowserModule, MaterialModule, FormsModule, CommonModule],
  exports: [
    DownloadComponent,
    TextareaOverlayComponent,
    TextareaGutterComponent,
  ],
})
export class SharedModule {}
