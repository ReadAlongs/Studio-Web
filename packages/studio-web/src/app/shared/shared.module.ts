import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DownloadComponent } from "./download/download.component";
import { BrowserModule } from "@angular/platform-browser";
import { MaterialModule } from "../material.module";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [DownloadComponent],
  imports: [BrowserModule, MaterialModule, FormsModule, CommonModule],
  exports: [DownloadComponent],
})
export class SharedModule {}
