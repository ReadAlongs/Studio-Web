import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DownloadComponent } from "./download/download.component";
import { BrowserModule } from "@angular/platform-browser";
import { MaterialModule } from "../material.module";
import { FormsModule } from "@angular/forms";
import { WcStylingComponent } from "./wc-styling/wc-styling.component";
@NgModule({
  declarations: [DownloadComponent, WcStylingComponent],
  imports: [BrowserModule, MaterialModule, FormsModule, CommonModule],
  exports: [DownloadComponent, WcStylingComponent],
})
export class SharedModule {}
