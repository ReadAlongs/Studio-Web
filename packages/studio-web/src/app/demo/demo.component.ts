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
  ) {
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
