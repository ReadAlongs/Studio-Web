import { Observable } from "rxjs";

import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Components } from "@readalongs/web-component/loader";

import { B64Service } from "../b64.service";

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
})
export class DemoComponent implements OnInit {
  @Input() b64Inputs: string[];
  @Input() render$: Observable<boolean>;
  @ViewChild("readalong") readalong!: Components.ReadAlong;
  slots: any = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
    pageTitle: $localize`PageTitle`,
  };

  constructor(public titleService: Title, private b64Service: B64Service) {
    titleService.setTitle(this.slots.pageTitle);
  }

  onPageTitleChange(e: Event): void {
    const titleValue: string = (<HTMLTextAreaElement>e.target).value;
    this.slots.pageTitle = titleValue;
    this.titleService.setTitle(titleValue);
  }

  ngOnInit(): void {}

  async getImages(originalDoc: string) {
    const images = await this.readalong.getImages();
    if (images) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalDoc, "application/xml");
      const pages = doc.evaluate("//div[@type='page']", doc);
      const page_nodes = [];
      let node = pages.iterateNext();
      while (node) {
        page_nodes.push(node);
        node = pages.iterateNext();
      }
      for (const [i, img] of Object.entries(images)) {
        let currentPage = page_nodes[parseInt(i)];
        if (currentPage && img) {
          let graphic = doc.createElement("graphic");
          let blob = await fetch(img).then((r) => r.blob());
          let b64 = await this.b64Service.blobToB64(blob);
          // @ts-ignore
          graphic.setAttribute("url", b64);
          currentPage.appendChild(graphic);
        }
      }
      return `data:application/xml;base64,${this.b64Service.utf8_to_b64(
        new XMLSerializer().serializeToString(doc)
      )}`;
    } else {
      return false;
    }
  }

  async download() {
    let updatedImages = await this.getImages(this.b64Inputs[4]);
    let text = this.b64Inputs[1];
    if (updatedImages !== false) {
      text = updatedImages;
    }
    var element = document.createElement("a");
    let blob = new Blob(
      [
        `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
      <title>${this.slots.pageTitle}</title>
      <link rel="stylesheet" href="${this.b64Inputs[3][1]}">
      <script src="${this.b64Inputs[3][0]}"></script>
    </head>
    <body>
        <read-along text="${text}" alignment="${this.b64Inputs[2]}" audio="${this.b64Inputs[0]}" use-assets-folder="false">
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
