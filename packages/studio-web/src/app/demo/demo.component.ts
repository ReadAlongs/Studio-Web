import { Subject } from "rxjs";

import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";
import { StudioService } from "../studio/studio.service";
import { DownloadService } from "../shared/download/download.service";
import { SupportedOutputs } from "../ras.service";
import { ToastrService } from "ngx-toastr";
import { WcStylingService } from "../shared/wc-styling/wc-styling.service";
import { UploadResult } from "../upload/upload.component";
import { FileService } from "../file.service";

type rasLanguages = "eng" | "fra" | "spa";
const localizationToRASLanguage: Record<string, rasLanguages> = {
  en: "eng",
  fr: "fra",
  es: "spa",
};

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
  standalone: false,
})
export class DemoComponent implements OnDestroy {
  @ViewChild("readalong") readalong: Components.ReadAlong;
  language: rasLanguages = "eng";
  unsubscribe$ = new Subject<void>();

  protected fileService = inject(FileService);
  uploadResult = input<UploadResult | null>(null);

  audioDataURL = computed(async () => {
    const uploadResult = this.uploadResult();
    return !uploadResult
      ? undefined
      : await this.fileService.readFileAsDataURL(uploadResult.audio);
  });

  rasDataURL = computed(async () => {
    const uploadResult = this.uploadResult();
    return !uploadResult
      ? undefined
      : await this.b64Service.rasAsDataURL(uploadResult.ras);
  });

  constructor(
    public b64Service: B64Service,
    public studioService: StudioService,
    private downloadService: DownloadService,
    private toastr: ToastrService,
    private wcStylingService: WcStylingService,
  ) {
    this.language =
      localizationToRASLanguage[$localize.locale ? $localize.locale : "en"];

    this.wcStylingService.$wcStyleInput.subscribe((css) =>
      this.updateWCStyle(css),
    );
    this.wcStylingService.$wcStyleFonts.subscribe((font) =>
      this.addWCCustomFont(font),
    );
  }

  download(download_type: SupportedOutputs) {
    if (
      this.studioService.b64Inputs$.value &&
      this.studioService.b64Inputs$.value[1]
    ) {
      this.downloadService.download(
        download_type,
        this.studioService.b64Inputs$.value[0],
        this.studioService.b64Inputs$.value[1],
        this.studioService.slots,
        this.readalong,
        "Studio",
        this.wcStylingService,
      );
    } else {
      this.toastr.error($localize`Download failed.`, $localize`Sorry!`, {
        timeOut: 10000,
      });
    }
  }

  async ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // Save translations, images and all other edits to the studio service when we exit
    if (this.studioService.b64Inputs$.value[1]) {
      await this.downloadService.updateTranslations(
        this.studioService.b64Inputs$.value[1],
        this.readalong,
      );
      await this.downloadService.updateImages(
        this.studioService.b64Inputs$.value[1],
        true,
        "image",
        this.readalong,
      );
    }
  }

  async updateWCStyle($event: string) {
    const dataURL = this.b64Service.blobAsDataURL(
      new Blob([$event ?? ""], { type: "text/css" }),
    );
    console.log(dataURL);

    this.readalong?.setCss(dataURL);
  }

  async addWCCustomFont($font: string) {
    this.readalong?.addCustomFont($font);
  }
}
