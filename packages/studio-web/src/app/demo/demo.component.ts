import { Subject } from "rxjs";

import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";
import { StudioService } from "../studio/studio.service";
import { DownloadService } from "../shared/download/download.service";
import { SupportedOutputs } from "../ras.service";
import { ToastrService } from "ngx-toastr";
import { WcStylingService } from "../shared/wc-styling/wc-styling.service";

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
  @ViewChild("readalong") private readalong!: Components.ReadAlong;

  protected language: rasLanguages = "eng";
  private unsubscribe$ = new Subject<void>();
  protected b64Service = inject(B64Service);
  public studioService = inject(StudioService);
  private downloadService = inject(DownloadService);
  private toastr = inject(ToastrService);

  constructor() {
    this.language = localizationToRASLanguage[$localize.locale ?? "en"];
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
}
