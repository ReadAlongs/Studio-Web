import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { WcStylingService } from "./wc-styling.service";
import {
  MatDialog,
  MatDialogRef,
  MatDialogModule,
} from "@angular/material/dialog";
import { B64Service } from "../../b64.service";
import { MatButtonModule } from "@angular/material/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-wc-styling",
  templateUrl: "./wc-styling.component.html",
  styleUrl: "./wc-styling.component.sass",
  standalone: false,
})
export class WcStylingComponent implements OnInit {
  styleText$ = new BehaviorSubject<string>("");
  fontDeclaration$ = new BehaviorSubject<string>("");
  inputType = "edit";
  private destroyRef$ = inject(DestroyRef);
  collapsed$ = new BehaviorSubject<boolean>(true);
  @ViewChild("styleInputElement") styleInputElement: ElementRef;
  @ViewChild("fontInputElement") fontInputElement: ElementRef;
  @ViewChild("styleSection") styleSection: ElementRef;
  canUseClipBoard = false;

  constructor(
    private toastr: ToastrService,
    private wcStylingService: WcStylingService,
    private dialog: MatDialog,
    private b64Service: B64Service,
  ) {
    //when a new file is uploaded
    this.wcStylingService.$wcStyleInput.subscribe((css) => {
      if (css !== this.styleText$.getValue()) {
        this.styleText$.next(css);
        //this.collapsed = false;
      }
    });
    this.wcStylingService.$wcStyleFonts.subscribe((font) => {
      if (font !== this.fontDeclaration$.getValue()) {
        this.fontDeclaration$.next(font);
        //this.collapsed = false;
      }
    });
    //check if clipboard access is allowed
    navigator.permissions
      .query({ name: "clipboard-write" as PermissionName })
      .then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
          this.canUseClipBoard = true;
        } else {
          this.canUseClipBoard = false;
        }
      })
      .catch((err) => {
        console.error("Failed to query clipboard permissions", err);
        this.canUseClipBoard = false;
      });
  }
  onFontSelected(event: any) {
    const file: File = event.target.files[0];
    const type = file.name.split(".").pop();
    if (file.size > 10048576) {
      //10MB
      this.toastr.error(
        $localize`File ` + file.name + $localize` could not be processed.`,
        $localize`File is too big.`,
        { timeOut: 2000 },
      );

      return;
    }
    // type == "ttf" ? "font/ttf" : "application/x-font-" + type + ";charset=utf-8"
    this.b64Service
      .blobToB64(file)
      .then((data) => {
        this.fontDeclaration$.next(
          this.fontDeclaration$.getValue() +
            (this.fontDeclaration$.getValue().length > 1 ? ", " : "") +
            `url(${(data as string).replace("application/octet-stream", type == "ttf" ? "application/x-ttf;charset=utf-8" : "application/x-font-" + type + ";charset=utf-8")}) format('${type?.replace("ttf", "truetype")}')`,
        );
        this.updateStyle();
        this.toastr.success(
          $localize`File ` + file.name + $localize` processed.`,
          $localize`Great!`,
          { timeOut: 10000 },
        );
      })
      .catch((err) => {
        this.toastr.error(
          $localize`File ` + file.name + $localize` could not be processed.`,
          err,
          { timeOut: 2000 },
        );
      });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file.size > 1048576) {
      //1MB
      this.toastr.error(
        $localize`File ` + file.name + $localize` could not be processed.`,
        $localize`File is too big.`,
        { timeOut: 2000 },
      );

      return;
    }

    file
      .text()
      .then((val) => {
        this.styleText$.next(val);

        this.wcStylingService.$wcStyleInput.next(val);
        this.inputType = "edit";
        this.toastr.success(
          $localize`File ` +
            file.name +
            $localize` processed.` +
            $localize` Content loaded in the text box.`,
          $localize`Great!`,
          { timeOut: 10000 },
        );
      })
      .catch((err) => {
        this.toastr.error(
          $localize`File ` + file.name + $localize` could not be processed.`,
          err,
          { timeOut: 2000 },
        );
      });
  }
  getFontDeclarations(): string {
    return this.fontDeclaration$.getValue().length > 1
      ? `@charset "utf-8";

/* Define default font */
@font-face {
    font-family: "RADefault";
    src: ${this.fontDeclaration$.getValue()};
    font-weight: normal;
    font-style: normal;
}
/* Replace aligned text font*/
span.theme--light.sentence__word,
span.theme--light.sentence__text,
span.theme--dark.sentence__word,
span.theme--dark.sentence__text {
    font-family: RADefault, BCSans, "Noto Sans", Verdana, Arial, sans-serif !important;
  }
`
      : "";
  }
  updateStyle() {
    this.wcStylingService.$wcStyleInput.next(
      (this.fontDeclaration$.getValue().length > 1
        ? `/* Replace aligned text font*/
span.theme--light.sentence__word,
span.theme--light.sentence__text,
span.theme--dark.sentence__word,
span.theme--dark.sentence__text {
    font-family: RADefault, BCSans, "Noto Sans", Verdana, Arial, sans-serif !important;
  }`
        : "") + this.styleText$.getValue(),
    );
    this.wcStylingService.$wcStyleFonts.next(this.getFontDeclarations());
  }

  downloadStyle() {
    if (this.styleText$) {
      let textBlob = new Blob([this.styleText$.getValue()], {
        type: "text/css",
      });
      var url = window.URL.createObjectURL(textBlob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "ras-style-" + Date.now() + ".css";
      a.click();
      a.remove();
    } else {
      this.toastr.error($localize`No text to download.`, $localize`Sorry!`);
    }
  }
  toggleStyleInput(event: any) {
    this.inputType = event.value;
  }
  async ngOnInit() {
    this.wcStylingService.$wcStyleInput
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((css) => {
        if (this.styleText$.getValue().length < 1) {
          this.styleText$.next(css);
          this.collapsed$.next(css.length < 1);
        }
      });
  }

  openHelpDialog(): void {
    this.dialog.open(WCStylingHelper, {
      width: "80vw",
      maxWidth: "80vw", // maxWidth is required to force material to use justify-content: flex-start
      minWidth: "50vw",
    });
  }
  toggleCollapse() {
    this.collapsed$.next(!this.collapsed$.getValue());
  }
  pasteStyle() {
    if (this.canUseClipBoard) {
      navigator.clipboard
        .readText()
        .then((text) => {
          this.styleText$.next(text);
          this.wcStylingService.$wcStyleInput.next(text);
          this.inputType = "edit";
          this.toastr.success(
            $localize`Style sheet pasted from clipboard.`,
            undefined,
            { timeOut: 10000 },
          );
        })
        .catch((err) => {
          this.toastr.error($localize`Failed to read clipboard content.`, err, {
            timeOut: 2000,
          });
        });
    } else {
      this.toastr.error(
        $localize`Clipboard access is not allowed.`,
        $localize`Error`,
      );
    }
  }

  copyStyle() {
    if (this.canUseClipBoard) {
      navigator.clipboard
        .writeText(this.styleText$.getValue())
        .then(() => {
          this.toastr.success(
            $localize`Style sheet copied to clipboard.`,
            undefined,
            { timeOut: 10000 },
          );
        })
        .catch((err) => {
          this.toastr.error(
            $localize`Failed to copy style sheet to clipboard.`,
            err,
            {
              timeOut: 2000,
            },
          );
        });
    } else {
      this.toastr.error(
        $localize`Clipboard access is not allowed.`,
        $localize`Error`,
      );
    }
  }
}

@Component({
  selector: "wc-styling-helper",
  templateUrl: "./wc-styling-helper.html",
  styleUrl: "./wc-styling.component.sass",
  imports: [MatDialogModule, MatButtonModule],
})
export class WCStylingHelper {
  constructor(public dialogRef: MatDialogRef<WCStylingHelper>) {}
  closeDialog(): void {
    this.dialogRef.close();
  }
}
