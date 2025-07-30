import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { environment } from "../environments/environment";
import { EventType, Router, Event as RouterEvent } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
  standalone: false,
})
export class AppComponent implements OnInit {
  private destroyRef$ = inject(DestroyRef);
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
      .pipe(takeUntilDestroyed(this.destroyRef$))
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
