import { Injectable } from "@angular/core";

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
  constructor() {}
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
    // console.log(alignment)
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
    let parser = new DOMParser();
    let xml_doc = parser.parseFromString(
      topLine + middle.join("") + bottomLine,
      "application/xml"
    );
    return `data:application/xml;base64,${this.xmlStringToB64(
      topLine + middle + bottomLine
    )}`;
    // let results = {"words": alignment, text_path, audio_path}
    // let rendered = Mustache.render(this.smilTemplate, results)
    // console.log(rendered)
    // return `data:application/xml;base64,${this.utf8_to_b64(rendered)}`
  }
}
