import { Subject } from "rxjs";

import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";
import { StudioService } from "../studio/studio.service";
import { DownloadService } from "../shared/download/download.service";

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
})
export class DemoComponent implements OnDestroy, OnInit {
  @ViewChild("readalong") readalong!: Components.ReadAlong;
  language: "eng" | "fra" | "spa" = "eng";
  unsubscribe$ = new Subject<void>();

  constructor(
    public b64Service: B64Service,
    public studioService: StudioService,
    private downloadService: DownloadService,
  ) {
    // If we do more languages, this should be a lookup table
    if ($localize.locale == "fr") {
      this.language = "fra";
    } else if ($localize.locale == "es") {
      this.language = "spa";
    }
  }

  ngOnInit(): void {}

  async ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // Save translations, images and all other edits to the studio service when we exit
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
