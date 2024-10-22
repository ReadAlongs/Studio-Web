import { forkJoin, Observable, BehaviorSubject } from "rxjs";
import { switchMap } from "rxjs/operators";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { FileService } from "./file.service";

@Injectable({
  providedIn: "root",
})
export class B64Service {
  JS_BUNDLE_URL = "assets/bundle.js";
  FONTS_BUNDLE_URL = "assets/fonts.b64.css";
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
      this.jsAndFontsBundle$.next(bundle);
    });
  }
  getBundle$(): Observable<[string, string]> {
    return forkJoin([
      this.http
        .get(this.JS_BUNDLE_URL, { responseType: "blob" })
        .pipe(
          switchMap((blob: Blob) => this.fileService.readFileAsData$(blob)),
        ),
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

  xmlToB64(xml: Document) {
    return this.utf8_to_b64(new XMLSerializer().serializeToString(xml));
  }

  blobToB64(blob: any) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      // @ts-ignore
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
}
