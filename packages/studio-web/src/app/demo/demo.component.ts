import { Observable, Subject, takeUntil } from "rxjs";
import { ToastrService } from "ngx-toastr";

import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Components } from "@readalongs/web-component/loader";
import { HttpErrorResponse } from "@angular/common/http";

import { B64Service } from "../b64.service";
import { slugify } from "../utils/utils";

import { compress } from "image-conversion";
import { RasService, SupportedOutputs } from "../ras.service";
import { saveAs } from "file-saver";
import { environment } from "../../environments/environment";
import { UploadService } from "../upload.service";
import JSZip from "jszip";
import mime from "mime";

interface Image {
  path: string;
  blob: Blob;
}

@Component({
  selector: "app-demo",
  templateUrl: "./demo.component.html",
  styleUrls: ["./demo.component.sass"],
})
export class DemoComponent implements OnDestroy, OnInit {
  @Input() b64Inputs: [string, Document, [string, string]];
  @Input() render$: Observable<boolean>;
  @ViewChild("readalong") readalong!: Components.ReadAlong;
  slots: any = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
  };
  outputFormats = [
    { value: "html", display: $localize`Offline HTML` },
    { value: "zip", display: $localize`Web Bundle` },
    { value: "eaf", display: $localize`Elan File` },
    { value: "textgrid", display: $localize`Praat TextGrid` },
    { value: "srt", display: $localize`SRT Subtitles` },
    { value: "vtt", display: $localize`WebVTT Subtitles` },
  ];
  selectedOutputFormat: SupportedOutputs | string = "html";
  language: "eng" | "fra" | "spa" = "eng";
  unsubscribe$ = new Subject<void>();
  xmlSerializer = new XMLSerializer();
  readmeFile = new Blob(
    [
      `Web Deployment Guide

This bundle has everything you need to host your ReadAlong on your own server.

Your audio, (optional) image, and alignment (.readalong) assets are stored in the assets folder.

The plain text used to create your ReadAlong is also stored here along with an example index.html file.

Your index.html file demonstrates the snippet and imports needed to host the ReadAlong on your server.

Please host all assets on your server, include the font and package imports defined in the index.html in your website's imports, and include the corresponding <read-along> snippet everywhere you would like your ReadAlong to be displayed.
    `,
    ],
    {
      type: "text/plain",
    }
  );
  constructor(
    public b64Service: B64Service,
    private rasService: RasService,
    private toastr: ToastrService,
    private uploadService: UploadService
  ) {
    // If we do more languages, this should be a lookup table
    if ($localize.locale == "fr") {
      this.language = "fra";
    } else if ($localize.locale == "es") {
      this.language = "spa";
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  reportRasError(err: HttpErrorResponse) {
    if (err.status == 422) {
      this.toastr.error(
        err.message,
        $localize`ReadAlong format conversion failed.`,
        {
          timeOut: 15000,
        }
      );
    } else {
      this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        }
      );
    }
  }

  async updateTranslations(doc: Document): Promise<boolean> {
    const translations: any = await this.readalong.getTranslations();
    if (Object.keys(translations).length == 0) {
      return false;
    } else {
      const sentence_nodes = doc.querySelectorAll(
        "s:not(.sentence__translation)"
      );
      // represents all translation nodes that have already been added
      const translation_node_ids = new Set(
        Array.from(doc.querySelectorAll(".editable__translation")).map(
          (t_node) => t_node.id
        )
      );
      sentence_nodes.forEach((sentence: Element) => {
        // Add a translation
        if (
          sentence.id in translations &&
          !translation_node_ids.has(sentence.id)
        ) {
          // No namespaces!! NO! NO! NO!
          let newSentence = document.createElementNS(null, "s");
          newSentence.setAttribute("do-not-align", "true");
          newSentence.setAttribute("id", sentence.id);
          newSentence.setAttribute(
            "class",
            "sentence__translation editable__translation"
          );
          newSentence.setAttribute("xml:lang", "eng");
          newSentence.append(translations[sentence.id]);
          sentence.insertAdjacentElement("afterend", newSentence);
        }
        // Remove a translation
        if (
          sentence.id in translations &&
          translations[sentence.id] === null &&
          translation_node_ids.has(sentence.id)
        ) {
          let elementToRemove = doc.querySelector(
            `#${sentence.id}.sentence__translation`
          );
          elementToRemove?.remove();
        }
      });
      return true;
    }
  }

  async updateImages(
    doc: Document,
    b64Embed = true,
    imagePrefix = "image"
  ): Promise<boolean | Image[]> {
    const images = await this.readalong.getImages();
    const page_nodes = doc.querySelectorAll("div[type=page]");
    const imageBlobs: Image[] = [];
    for (const [i, img] of Object.entries(images)) {
      let currentPage = page_nodes[parseInt(i)];
      // Add Image
      if (currentPage && img) {
        // Remove any images that are there from before
        currentPage.querySelectorAll("graphic").forEach((e) => e.remove());
        let graphic = doc.createElementNS(null, "graphic");
        // @ts-ignore
        let blob = await fetch(img).then((r) => r.blob());
        blob = await compress(blob, 0.75);
        // Either embed the images directly
        if (b64Embed) {
          let b64 = await this.b64Service.blobToB64(blob);
          // @ts-ignore
          graphic.setAttribute("url", b64);
          // or return a list of blobs and use the filename here
        } else {
          const extension = mime.getExtension(blob.type);
          const path = `${imagePrefix}-${i}.${extension}`;
          imageBlobs.push({ blob: blob, path: path });
          graphic.setAttribute("url", `${path}`);
        }
        currentPage.appendChild(graphic);
        // Remove Images
      } else if (img === null) {
        currentPage.querySelectorAll("graphic").forEach((e) => e.remove());
      }
    }
    if (b64Embed) {
      return true;
    } else {
      return imageBlobs;
    }
  }

  registerDownloadEvent() {
    const win = window;
    (win as any).plausible("Download", {
      props: { fileType: this.selectedOutputFormat },
    });
  }

  async download() {
    let ras = this.b64Inputs[1];
    if (this.selectedOutputFormat == "html") {
      await this.updateImages(ras);
      await this.updateTranslations(ras);
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);
      const basename =
        (this.slots.title ? slugify(this.slots.title, 15) : "readalong") +
        `-${timestamp}`;
      let b64ras = this.b64Service.xmlToB64(ras);
      var element = document.createElement("a");
      let blob = new Blob(
        [
          `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
        <title>${this.slots.title}</title>
        <link rel="stylesheet" href="${this.b64Inputs[2][1]}">
        <script src="${this.b64Inputs[2][0]}" version="${environment.packageJson.singleFileBundleVersion}" timestamp="${environment.packageJson.singleFileBundleTimestamp}"></script>
      </head>
      <body>
          <read-along href="data:application/readalong+xml;base64,${b64ras}" audio="${this.b64Inputs[0]}" image-assets-folder="">
          <span slot="read-along-header">${this.slots.title}</span>
          <span slot="read-along-subheader">${this.slots.subtitle}</span>
          </read-along>
      </body>
      </html>`,
        ],
        { type: "text/html;charset=utf-8" }
      );
      element.href = window.URL.createObjectURL(blob);

      element.download = `${basename}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      this.registerDownloadEvent();
    } else if (this.selectedOutputFormat === "zip") {
      let zipFile = new JSZip();
      // Create inner folder
      const innerFolder = zipFile.folder("readalong");
      const assetsFolder = innerFolder?.folder("assets");
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);
      const basename =
        (this.slots.title ? slugify(this.slots.title, 15) : "readalong") +
        `-${timestamp}`;
      // - add audio file
      if (this.uploadService.$currentAudio.value !== null) {
        // Recorded audio is always mp3
        let audioExtension = "mp3";
        // If the audio is a file, just pull the extension
        if (this.uploadService.$currentAudio.value instanceof File) {
          const file_parts =
            this.uploadService.$currentAudio.value.name.split(".");
          audioExtension = file_parts[file_parts.length - 1];
        }
        assetsFolder?.file(
          `${basename}.${audioExtension}`,
          this.uploadService.$currentAudio.value
        );
      }
      // - add images
      // @ts-ignore
      const images: Image[] = await this.updateImages(
        ras,
        false,
        `image-${basename}`
      );
      for (let image of images) {
        assetsFolder?.file(image.path, image.blob);
      }
      // - add plain text file
      if (this.uploadService.$currentText.value !== null) {
        innerFolder?.file(
          `${basename}.txt`,
          this.uploadService.$currentText.value
        );
      }
      // - add .readalong file
      this.updateTranslations(ras);

      const xmlString = this.xmlSerializer.serializeToString(
        ras.documentElement
      );
      const rasFile = new Blob([xmlString], { type: "application/xml" });
      assetsFolder?.file(`${basename}.readalong`, rasFile);
      // - add index.html file
      const sampleHtml = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${this.slots.title}</title>
                <!-- Import fonts. Material Icons are needed by the web component -->
                <link href="https://fonts.googleapis.com/css?family=Lato%7CMaterial+Icons%7CMaterial+Icons+Outlined" rel="stylesheet">
            </head>

            <body>
                <!-- Here is how you declare the Web Component. Supported languages: en, fr -->
                <read-along href="assets/${basename}.readalong" audio="assets/${basename}.mp3" theme="light" language="en" image-assets-folder="assets/">
                    <span slot='read-along-header'>${this.slots.title}</span>
                    <span slot='read-along-subheader'>${this.slots.subtitle}</span>
                </read-along>
            </body>

            <!-- The last step needed is to import the package -->
            <script type="module" src='https://unpkg.com/@readalongs/web-component@^${environment.packageJson.singleFileBundleVersion}/dist/web-component/web-component.esm.js'></script>
        </html>
        `;
      const indexHtmlFile = new Blob([sampleHtml], { type: "text/html" });
      innerFolder?.file("index.html", indexHtmlFile);
      // - add plain text readme
      innerFolder?.file("README.txt", this.readmeFile);
      // - write zip
      zipFile.generateAsync({ type: "blob" }).then(
        (content) => saveAs(content, `${basename}.zip`),
        (err: HttpErrorResponse) =>
          this.toastr.error(err.error.detail, $localize`Download failed.`, {
            timeOut: 30000,
          })
      );
    } else {
      let audio: HTMLAudioElement = new Audio(this.b64Inputs[0]);
      this.rasService
        .convertRasFormat$(
          {
            dur: audio.duration,
            ras: new XMLSerializer().serializeToString(ras.documentElement),
          },
          this.selectedOutputFormat
        )
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: (x: Blob) =>
            saveAs(x, `readalong.${this.selectedOutputFormat}`),
          error: (err: HttpErrorResponse) => this.reportRasError(err),
        });

      audio.remove();
      this.registerDownloadEvent();
    }
  }
}
