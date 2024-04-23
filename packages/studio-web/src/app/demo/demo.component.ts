import { Observable, Subject } from "rxjs";

import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";
import { ReadAlongSlots } from "../ras.service";

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
})
export class DemoComponent implements OnDestroy, OnInit {
  @Input() b64Inputs: [string, Document, [string, string]];
  @Input() render$: Observable<boolean>;
  @ViewChild("readalong") readalong!: Components.ReadAlong;
  slots: ReadAlongSlots = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
  };
  language: "eng" | "fra" | "spa" = "eng";
  unsubscribe$ = new Subject<void>();

  constructor(public b64Service: B64Service) {
    // If we do more languages, this should be a lookup table
    if ($localize.locale == "fr") {
      this.language = "fra";
    } else if ($localize.locale == "es") {
      this.language = "spa";
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
