import { Subject, takeUntil } from "rxjs";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { environment } from "../environments/environment";
import { Router } from "@angular/router";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
})
export class AppComponent implements OnDestroy, OnInit {
  unsubscribe$ = new Subject<void>();
  version = environment.packageJson.singleFileBundleVersion;
  currentURL = "/";
  constructor(
    private dialog: MatDialog,
    public router: Router,
  ) {}
  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
      if (event.type === 1) {
        this.currentURL = event.url;
      }
    });
  }

  openPrivacyDialog(): void {
    this.dialog.open(PrivacyDialog, {
      width: "50vw",
      maxWidth: "60vw", // maxWidth is required to force material to use justify-content: flex-start
      minWidth: "60vw",
      maxHeight: "95vh",
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit() {}
}

@Component({
  selector: "privacy-dialog",
  templateUrl: "privacy-dialog.html",
})
export class PrivacyDialog {
  analyticsExcluded =
    window.localStorage.getItem("plausible_ignore") === "true";
  constructor(public dialogRef: MatDialogRef<PrivacyDialog>) {}
  ngOnInit() {
    this.dialogRef.updateSize("100%");
  }

  toggleAnalytics() {
    if (this.analyticsExcluded) {
      window.localStorage.removeItem("plausible_ignore");
    } else {
      window.localStorage.setItem("plausible_ignore", "true");
    }
    this.analyticsExcluded =
      window.localStorage.getItem("plausible_ignore") === "true";
  }
}
