import { Component, EventEmitter, Output } from "@angular/core";
import { SupportedOutputs } from "../../ras.service";

@Component({
  selector: "ras-shared-download",
  templateUrl: "./download.component.html",
  styleUrl: "./download.component.sass",
  standalone: false,
})
export class DownloadComponent {
  @Output() private downloadButtonClicked =
    new EventEmitter<SupportedOutputs>();

  protected outputFormats = [
    { value: SupportedOutputs.html, display: $localize`Offline HTML` },
    { value: SupportedOutputs.zip, display: $localize`Web Bundle` },
    { value: SupportedOutputs.eaf, display: $localize`Elan File` },
    { value: SupportedOutputs.textgrid, display: $localize`Praat TextGrid` },
    { value: SupportedOutputs.srt, display: $localize`SRT Subtitles` },
    { value: SupportedOutputs.vtt, display: $localize`WebVTT Subtitles` },
  ];
  protected selectedOutputFormat: SupportedOutputs = SupportedOutputs.html;

  download() {
    this.downloadButtonClicked.emit(this.selectedOutputFormat);
  }
}
