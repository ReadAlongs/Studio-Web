import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { environment } from "../environments/environment";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
  standalone: false,
})
export class AppComponent implements OnInit {
  private destroyRef$ = inject(DestroyRef);
  version = environment.packageJson.singleFileBundleVersion;
  currentURL = signal("/");
  languages: (typeof environment)["languages"];

  constructor(
    private dialog: MatDialog,
    public router: Router,
  ) {
    const currentLanguage = $localize.locale ?? "en";
    this.languages = environment.languages.filter(
      (l) => l.code != currentLanguage,
    );
  }

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((event) => {
        if (event.type === 1) {
          this.currentURL.set(event.url);
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

  switchLanguage(url: string) {
    window.open(url, "_blank");
  }
}

@Component({
  selector: "privacy-dialog",
  templateUrl: "privacy-dialog.html",
  standalone: false,
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
