import { Subject } from "rxjs";

import { Component, OnDestroy, OnInit } from "@angular/core";
import { environment } from "../environments/environment";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent implements OnDestroy, OnInit {
  unsubscribe$ = new Subject<void>();
  version = environment.packageJson.singleFileBundleVersion;
  constructor() {}
  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit() {}
}
