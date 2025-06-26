import { Subject, takeUntil } from "rxjs";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { environment } from "../environments/environment";
import { Router } from "@angular/router";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
  standalone: false,
})
export class AppComponent implements OnDestroy, OnInit {
  unsubscribe$ = new Subject<void>();
  version = environment.packageJson.singleFileBundleVersion;
  currentURL = "/";

  languages = environment.languages;
  currentLanguage: string = "en";

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

    // support for En/Fr switch with PR preview functionality.
    let pathname = location.pathname;
    if (pathname.startsWith("/pr-preview/")) {
      const prPreviewPath = pathname.split("/").slice(1, 3).join("/");
      this.languages.en = this.languages.en + prPreviewPath + "/";
      this.languages.fr = this.languages.fr.replace(
        "fr/",
        prPreviewPath + "/fr/",
      );
      this.languages.es = this.languages.es.replace(
        "es/",
        prPreviewPath + "/es/",
      );
    }

    // Use the location information to determine the site's current language.
    const lookupKey = `${location.protocol}//${location.host}${pathname}`;
    const lookup = Object.entries(this.languages).filter(
      ([_, url]) => url === lookupKey,
    );
    this.currentLanguage = lookup.length == 1 ? lookup[0][0] : "en";
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
