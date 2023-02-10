import { Observable } from "rxjs";

import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";

import { compress } from "image-conversion";

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
})
export class DemoComponent implements OnInit {
  @Input() b64Inputs: [string, Document, [string, string]];
  @Input() render$: Observable<boolean>;
  @ViewChild("readalong") readalong!: Components.ReadAlong;
  slots: any = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
    pageTitle: $localize`PageTitle`,
  };

  constructor(public titleService: Title, public b64Service: B64Service) {
    titleService.setTitle(this.slots.pageTitle);
  }

  onPageTitleChange(e: Event): void {
    const titleValue: string = (<HTMLTextAreaElement>e.target).value;
    this.slots.pageTitle = titleValue;
    this.titleService.setTitle(titleValue);
  }

  ngOnInit(): void {}

  async updateTranslations(doc: Document): Promise<boolean> {
    const translations: any = await this.readalong.getTranslations();
    if (Object.keys(translations).length == 0) {
      return false;
    } else {
      const sentence_nodes = doc.querySelectorAll("s")
      // represents all translation nodes that have already been added
      const translation_node_ids = Array.from(doc.querySelectorAll(".sentence__translation")).map((t_node) => t_node.id)
      sentence_nodes.forEach((sentence: HTMLElement) => {
        // Add a translation
        if (sentence.id in translations && translation_node_ids.indexOf(sentence.id) < 0) {
          let newSentence = document.createElement('s')
          newSentence.setAttribute('do-not-align', "true")
          newSentence.setAttribute("id", sentence.id)
          newSentence.setAttribute("class", "sentence__translation")
          newSentence.setAttribute("xml:lang", "eng")
          newSentence.innerText = translations[sentence.id]
          sentence.insertAdjacentElement('afterend', newSentence)
        }
        // Remove a translation
        if (sentence.id in translations && translations[sentence.id] === null && translation_node_ids.indexOf(sentence.id) > -1) {
          let elementToRemove = doc.querySelector(`#${sentence.id}.sentence__translation`)
          elementToRemove?.remove()
        }

      })
      return true
    }
  }

  async updateImages(doc: Document): Promise<boolean> {
    const images = await this.readalong.getImages();
    if (Object.keys(images).length == 0)
      return false;
    else {
      const page_nodes = doc.querySelectorAll("div[type=page]");
      for (const [i, img] of Object.entries(images)) {
        let currentPage = page_nodes[parseInt(i)];
        if (currentPage && img) {
          let graphic = doc.createElement("graphic");
          // @ts-ignore
          let blob = await fetch(img).then((r) => r.blob());
          blob = await compress(blob, 0.75);
          let b64 = await this.b64Service.blobToB64(blob);
          // @ts-ignore
          graphic.setAttribute("url", b64);
          currentPage.appendChild(graphic);
        }
      }
      return true;
    }
  }

  async download() {
    let ras = this.b64Inputs[1];
    await this.updateImages(ras);
    await this.updateTranslations(ras);
    let b64ras = this.b64Service.xmlToB64(ras);
    var element = document.createElement("a");
    let blob = new Blob(
      [
        `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
      <title>${this.slots.pageTitle}</title>
      <link rel="stylesheet" href="${this.b64Inputs[2][1]}">
      <script src="${this.b64Inputs[2][0]}"></script>
    </head>
    <body>
        <read-along href="data:application/readalong+xml;base64,${b64ras}" audio="${this.b64Inputs[0]}" use-assets-folder="false">
        <span slot="read-along-header">${this.slots.title}</span>
        <span slot="read-along-subheader">${this.slots.subtitle}</span>
        </read-along>
    </body>
    </html>`,
      ],
      { type: "text/html;charset=utf-8" }
    );
    element.href = window.URL.createObjectURL(blob);
    element.download = "readalong.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
