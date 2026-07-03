import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DownloadComponent } from "./download/download.component";
import { BrowserModule } from "@angular/platform-browser";
import { MaterialModule } from "../material.module";
import { FormsModule } from "@angular/forms";
import { ErrorPopoverComponent } from "./tiptap-editor/popover/error-popover.component";
import { TiptapEditorComponent } from "./tiptap-editor/tiptap-editor.component";

@NgModule({
  declarations: [
    DownloadComponent,
    TiptapEditorComponent,
    ErrorPopoverComponent,
  ],
  imports: [BrowserModule, MaterialModule, FormsModule, CommonModule],
  exports: [DownloadComponent, TiptapEditorComponent],
})
export class SharedModule {}
