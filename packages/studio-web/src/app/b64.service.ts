import { forkJoin, Observable, BehaviorSubject } from "rxjs";
import { switchMap } from "rxjs/operators";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { FileService } from "./file.service";
import { deprecate } from "node:util";

@Injectable({
  providedIn: "root",
})
export class B64Service {
  readonly JS_BUNDLE_URL = "assets/bundle.js";
  readonly FONTS_BUNDLE_URL = "assets/fonts.b64.css";
  /**
   * Creates an instance of B64Service, a service for B64 encoding assets.
   * @param {HttpClient} http - The HttpClient service for making HTTP requests.
   * @param {FileService} fileService - The FileService for handling file operations.
   */
  jsAndFontsBundle$ = new BehaviorSubject<[string, string] | null>(null);
  constructor(
    private http: HttpClient,
    private fileService: FileService,
  ) {
    this.getBundle$().subscribe((bundle) => {
      this.jsAndFontsBundle$.next([
        this.indent(bundle[0], 6), //apply the indentation to the js bundle
        this.indent(bundle[1], 6),
      ]);
    });
  }
  getBundle$(): Observable<[string, string]> {
    return forkJoin([
      this.http
        .get(this.JS_BUNDLE_URL, { responseType: "blob" })
        .pipe(switchMap((blob: Blob) => this.fileService.readFile$(blob))),

      this.http
        .get(this.FONTS_BUNDLE_URL, { responseType: "blob" })
        .pipe(switchMap((blob: Blob) => this.fileService.readFile$(blob))),
    ]);
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

  rasAsDataURL(xml: Document): Promise<string> {
    return this.blobAsDataURL(
      new Blob(
        [
          new XMLSerializer()
            .serializeToString(xml)
            .replace("?><read", "?>\n<read"),
        ],
        { type: "application/readalongs+xml" },
      ),
    );
  }

  /**
   * @deprecated
   */
  xmlToB64(xml: Document) {
    return this.utf8_to_b64(
      new XMLSerializer()
        .serializeToString(xml)
        .replace("?><read", "?>\n<read"),
    );
  }

  blobAsDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  indent(str: string, level: number) {
    const indent = " ".repeat(level);

    return str
      .split("\n")
      .map((line) => (line.trim() ? indent + line : line))
      .join("\n");
  }
}
