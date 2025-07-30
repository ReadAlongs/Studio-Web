import { forkJoin, Observable, BehaviorSubject, lastValueFrom } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { FileService } from "./file.service";

@Injectable({
  providedIn: "root",
})
export class B64Service {
  private readonly JS_BUNDLE_URL = "assets/bundle.js";
  private readonly FONTS_BUNDLE_URL = "assets/fonts.b64.css";
  private http = inject(HttpClient);
  private fileService = inject(FileService);
  private cachedBundle: Promise<[string, string]> | null = null;

  getBundle$(): Observable<[string, string]> {
    return forkJoin([
      this.http
        .get(this.JS_BUNDLE_URL, { responseType: "blob" })
        .pipe(switchMap((blob: Blob) => this.fileService.readFile$(blob))),

      this.http
        .get(this.FONTS_BUNDLE_URL, { responseType: "blob" })
        .pipe(switchMap((blob: Blob) => this.fileService.readFile$(blob))),
    ]).pipe(
      map((bundle) => [this.indent(bundle[0], 6), this.indent(bundle[1], 6)]),
    );
  }

  // A promise implementation of getBundle()$. Additionally, the promise is
  // cached and reused on subsequent bundle requests.
  getBundle(): Promise<[string, string]> {
    if (!this.cachedBundle) {
      this.cachedBundle = lastValueFrom(this.getBundle$());
    }

    return this.cachedBundle;
  }

  utf8_to_b64(str: string) {
    // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  }

  b64_to_utf8(str: string) {
    // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    return decodeURIComponent(
      Array.prototype.map
        .call(window.atob(str), function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
  }

  xmlToB64(xml: Document): string {
    return this.utf8_to_b64(
      new XMLSerializer()
        .serializeToString(xml)
        .replace("?><read", "?>\n<read"),
    );
  }

  // rasToDataURL creates a data URL containing the contents of the RAS document.
  rasToDataURL(xml: Document): Promise<string> {
    const xmlText = new XMLSerializer()
      .serializeToString(xml)
      .replace("?><read", "?>\n<read");

    return this.fileService.readFileAsDataURL(
      xmlText,
      "application/readalong+xml",
    );
  }

  // blobToDataURL encodes the blob to a data URL.
  blobToDataURL(blob: Blob): Promise<string> {
    return this.fileService.readFileAsDataURL(blob);
  }

  private indent(str: string, level: number) {
    const indent = " ".repeat(level);
    return str
      .split("\n")
      .map((line) => (line.trim() ? indent + line : line))
      .join("\n");
  }
}
