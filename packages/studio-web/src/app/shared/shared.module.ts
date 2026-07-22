import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DownloadComponent } from "./download/download.component";
import { ConfirmDialogComponent } from "./confirm-dialog/confirm-dialog.component";
import { BrowserModule } from "@angular/platform-browser";
import { MaterialModule } from "../material.module";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [DownloadComponent, ConfirmDialogComponent],
  imports: [BrowserModule, MaterialModule, FormsModule, CommonModule],
  exports: [DownloadComponent, ConfirmDialogComponent],
})
export class SharedModule {}
