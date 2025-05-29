import { Component, EventEmitter, Output } from "@angular/core";
import { SupportedOutputs } from "../../ras.service";

@Component({
  selector: "ras-shared-download",
  templateUrl: "./download.component.html",
  styleUrl: "./download.component.sass",
  standalone: false,
})
export class DownloadComponent {
  @Output() downloadButtonClicked = new EventEmitter<SupportedOutputs>();
  outputFormats = [
    { value: SupportedOutputs.html, display: $localize`Offline HTML` },
    { value: SupportedOutputs.zip, display: $localize`Web Bundle` },
    { value: SupportedOutputs.eaf, display: $localize`Elan File` },
    { value: SupportedOutputs.textgrid, display: $localize`Praat TextGrid` },
    { value: SupportedOutputs.srt, display: $localize`SRT Subtitles` },
    { value: SupportedOutputs.vtt, display: $localize`WebVTT Subtitles` },
  ];
  selectedOutputFormat: SupportedOutputs = SupportedOutputs.html;
  constructor() {}

  download() {
    this.downloadButtonClicked.emit(this.selectedOutputFormat);
  }
}
