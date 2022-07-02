import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
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
</smil>`
  constructor() { }
  utf8_to_b64(str: string) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }
  alignmentToSmil(alignment: any, text_path: string, audio_path: string) {
    // console.log(alignment)
    // let topLine = '<smil xmlns="http://www.w3.org/ns/SMIL" version="3.0"><body>'
    // let bottomLine = "</body></smil>"
    // let middle = alignment.map((x: any) =>
    //   `<par id="par-${x['word']}">
    //  <text src="${text_path}#${x['word']}"/>
    // <audio src="${audio_path}" clipBegin="${x['start']}" clipEnd="${x['end']}"/>
    // </par>`)
    // console.log(topLine + middle + bottomLine)
    // let results = {"words": alignment, text_path, audio_path}
    // let rendered = Mustache.render(this.smilTemplate, results)
    // console.log(rendered)
    // return `data:application/xml;base64,${this.utf8_to_b64(rendered)}`
  }
}
