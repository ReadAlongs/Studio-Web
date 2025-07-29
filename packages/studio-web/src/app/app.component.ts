import { Subject, takeUntil } from "rxjs";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { environment } from "../environments/environment";
import { EventType, Router, Event as RouterEvent } from "@angular/router";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
  standalone: false,
})
export class AppComponent implements OnDestroy, OnInit {
  private unsubscribe$ = new Subject<void>();
  protected version = environment.packageJson.singleFileBundleVersion;
  protected currentURL = signal("/");
  protected languages: (typeof environment)["languages"];
  protected router = inject(Router);
  private dialog = inject(MatDialog);

  constructor() {
    const currentLanguage = $localize.locale ?? "en";
    this.languages = environment.languages.filter(
      (l) => l.code != currentLanguage,
    );
  }

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((event: RouterEvent) => {
        if (event.type === EventType.NavigationEnd) {
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

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

const plausibleKey = "plausible_ignore";

@Component({
  selector: "privacy-dialog",
  templateUrl: "privacy-dialog.html",
  standalone: false,
})
export class PrivacyDialog {
  private dialogRef = inject(MatDialogRef<PrivacyDialog>);
  protected analyticsExcluded = localStorage.getItem(plausibleKey) === "true";

  ngOnInit() {
    this.dialogRef.updateSize("100%");
  }

  toggleAnalytics() {
    if (this.analyticsExcluded) {
      localStorage.removeItem(plausibleKey);
      this.analyticsExcluded = false;
    } else {
      localStorage.setItem(plausibleKey, "true");
      this.analyticsExcluded = true;
    }
  }
}
