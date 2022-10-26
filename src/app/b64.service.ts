import { forkJoin, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { FileService } from "./file.service";

@Injectable({
  providedIn: "root",
})
export class B64Service {
  smilTemplate = `<smil xmlns="http://www.w3.org/ns/SMIL" version="3.0">
  <body>
      {{#words}}
      <par id="par-{{word}}">
          <text src="{{text_path}}#{{word}}"/>
          <audio src="{{audio_path}}" clipBegin="{{start}}" clipEnd="{{end}}"/>
      </par>
      {{/words}}
  </body>
</smil>`;
  JS_BUNDLE_URL =
    "https://unpkg.com/@roedoejet/readalong@^0.1.6/dist/bundle.js";
  FONTS_BUNDLE_URL =
    "https://unpkg.com/@roedoejet/readalong@^0.1.6/dist/fonts.b64.css";
  constructor(private http: HttpClient, private fileService: FileService) {}
  getBundle$(): Observable<any[]> {
    return forkJoin([
      this.http
        .get(this.JS_BUNDLE_URL, { responseType: "blob" })
        .pipe(
          switchMap((blob: Blob) => this.fileService.readFileAsData$(blob))
        ),
      this.http
        .get(this.FONTS_BUNDLE_URL, { responseType: "blob" })
        .pipe(
          switchMap((blob: Blob) => this.fileService.readFileAsData$(blob))
        ),
    ]);
  }
  utf8_to_b64(str: string) {
    // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }
  b64_to_utf8(str: string) {
    // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    return decodeURIComponent(
      Array.prototype.map
        .call(window.atob(str), function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }
  xmlStringToB64(xml: string) {
    let parser = new DOMParser();
    let xml_doc = parser.parseFromString(xml, "application/xml");
    return this.utf8_to_b64(new XMLSerializer().serializeToString(xml_doc));
  }
  alignmentToSmil(alignment: any, text_path: string, audio_path: string) {
    let topLine =
      '<smil xmlns="http://www.w3.org/ns/SMIL" version="3.0"><body>';
    let bottomLine = "</body></smil>";
    let middle = alignment
      .filter((x: any) => x["word"] !== "<sil>")
      .map(
        (x: any) =>
          `<par id="par-${x["word"]}">
     <text src="${text_path}#${x["word"]}"/>
    <audio src="${audio_path}" clipBegin="${x["start"]}" clipEnd="${x["end"]}"/>
    </par>`
      );
    return `data:application/xml;base64,${this.xmlStringToB64(
      topLine + middle + bottomLine
    )}`;
  }
}
