import { Component, Input } from "@angular/core";
import { MaterialModule } from "../../material.module";
import { ReadAlongSlots, SupportedOutputs } from "../../ras.service";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { Components } from "@readalongs/web-component/loader";
import { DownloadService } from "./download.service";

@Component({
  selector: "ras-shared-download",
  templateUrl: "./download.component.html",
  styleUrl: "./download.component.sass",
})
export class DownloadComponent {
  @Input() slots: ReadAlongSlots;
  @Input() b64Audio: string;
  @Input() rasXML: Document;
  @Input() readalong: Components.ReadAlong;
  outputFormats = [
    { value: SupportedOutputs.html, display: $localize`Offline HTML` },
    { value: SupportedOutputs.zip, display: $localize`Web Bundle` },
    { value: SupportedOutputs.eaf, display: $localize`Elan File` },
    { value: SupportedOutputs.textgrid, display: $localize`Praat TextGrid` },
    { value: SupportedOutputs.srt, display: $localize`SRT Subtitles` },
    { value: SupportedOutputs.vtt, display: $localize`WebVTT Subtitles` },
  ];
  selectedOutputFormat: SupportedOutputs = SupportedOutputs.html;
  constructor(private downloadService: DownloadService) {}

  download() {
    this.downloadService.download(
      this.selectedOutputFormat,
      this.b64Audio,
      this.rasXML,
      this.slots,
      this.readalong,
    );
  }
}
