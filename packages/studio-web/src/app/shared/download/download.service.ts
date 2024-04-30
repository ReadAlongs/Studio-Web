import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Observable, Subject, takeUntil } from "rxjs";
import { slugify } from "../../utils/utils";
import { UploadService } from "../../upload.service";
import { ToastrService } from "ngx-toastr";

import { compress } from "image-conversion";
import { saveAs } from "file-saver";
import { environment } from "../../../environments/environment";
import JSZip from "jszip";
import mime from "mime";
import { B64Service } from "../../b64.service";
import {
  RasService,
  ReadAlongSlots,
  SupportedOutputs,
} from "../../ras.service";
import { Components } from "@readalongs/web-component/loader";

interface Image {
  path: string;
  blob: Blob;
}

@Injectable({
  providedIn: "root",
})
export class DownloadService {
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
    },
  );

  constructor(
    private uploadService: UploadService,
    private rasService: RasService,
    private b64Service: B64Service,
    private toastr: ToastrService,
  ) {}

  async updateTranslations(
    doc: Document,
    readalong: Components.ReadAlong,
  ): Promise<boolean> {
    const translations: any = await readalong.getTranslations();
    if (Object.keys(translations).length == 0) {
      return false;
    } else {
      const sentence_nodes = doc.querySelectorAll(
        "s:not(.sentence__translation)",
      );
      // represents all translation nodes that have already been added
      const translation_node_ids = new Set(
        Array.from(doc.querySelectorAll(".editable__translation")).map(
          (t_node) => t_node.id,
        ),
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
            "sentence__translation editable__translation",
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
            `#${sentence.id}.sentence__translation`,
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
    imagePrefix = "image",
    readalong: Components.ReadAlong,
  ): Promise<boolean | Image[]> {
    const images = await readalong.getImages();
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

  registerDownloadEvent(selectedOutputFormat: SupportedOutputs) {
    const win = window;
    (win as any).plausible("Download", {
      props: { fileType: selectedOutputFormat },
    });
  }

  async createSingleFileBlob(
    rasDoc: Document,
    rasB64: string,
    readalong: Components.ReadAlong,
    slots: ReadAlongSlots,
    b64Audio: string,
  ) {
    await this.updateImages(rasDoc, true, "image", readalong);
    await this.updateTranslations(rasDoc, readalong);

    if (this.b64Service.jsAndFontsBundle$.value !== null) {
      let blob = new Blob(
        [
          `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
        <title>${slots.title}</title>
        <link rel="stylesheet" href="${this.b64Service.jsAndFontsBundle$.value[1]}">
        <script src="${this.b64Service.jsAndFontsBundle$.value[0]}" version="${environment.packageJson.singleFileBundleVersion}" timestamp="${environment.packageJson.singleFileBundleTimestamp}"></script>
      </head>
      <body>
          <read-along href="data:application/readalong+xml;base64,${rasB64}" audio="${b64Audio}" image-assets-folder="">
          <span slot="read-along-header">${slots.title}</span>
          <span slot="read-along-subheader">${slots.subtitle}</span>
          </read-along>
      </body>
      </html>`,
        ],
        { type: "text/html;charset=utf-8" },
      );
      return blob;
    }
    return undefined;
  }

  async download(
    selectedOutputFormat: SupportedOutputs,
    b64Audio: string,
    rasXML: Document,
    slots: ReadAlongSlots,
    readalong: Components.ReadAlong,
  ) {
    let rasB64 = this.b64Service.xmlToB64(rasXML);

    if (selectedOutputFormat == SupportedOutputs.html) {
      var element = document.createElement("a");
      const blob = await this.createSingleFileBlob(
        rasXML,
        rasB64,
        readalong,
        slots,
        b64Audio,
      );
      if (blob) {
        const timestamp = new Date()
          .toISOString()
          .replace(/[^0-9]/g, "")
          .slice(0, -3);
        const basename =
          (slots.title ? slugify(slots.title, 15) : "readalong") +
          `-${timestamp}`;
        element.href = window.URL.createObjectURL(blob);
        element.download = `${basename}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.registerDownloadEvent(selectedOutputFormat);
      } else {
        this.toastr.error(
          "JS & Fonts Bundle did not get loaded",
          $localize`Download failed.`,
          {
            timeOut: 30000,
          },
        );
      }
    } else if (selectedOutputFormat === SupportedOutputs.zip) {
      let zipFile = new JSZip();
      // Create inner folder
      const innerFolder = zipFile.folder("readalong");
      const innerFolderEditable = zipFile.folder("editable");
      const assetsFolder = innerFolder?.folder("assets");
      const blob = await this.createSingleFileBlob(
        rasXML,
        rasB64,
        readalong,
        slots,
        b64Audio,
      );
      if (blob) {
        innerFolderEditable?.file("editable.html", blob);
      }
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, -3);
      const basename =
        (slots.title ? slugify(slots.title, 15) : "readalong") +
        `-${timestamp}`;
      // - add audio file
      // Add uploaded file/recorded audio
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
          this.uploadService.$currentAudio.value,
        );
      }
      // - add images
      // @ts-ignore
      const images: Image[] = await this.updateImages(
        rasXML,
        false,
        `image-${basename}`,
        readalong,
      );
      for (let image of images) {
        assetsFolder?.file(image.path, image.blob);
      }
      // - add plain text file
      if (this.uploadService.$currentText.value !== null) {
        innerFolder?.file(
          `${basename}.txt`,
          this.uploadService.$currentText.value,
        );
      }
      // - add .readalong file
      await this.updateTranslations(rasXML, readalong);

      const xmlString = this.xmlSerializer.serializeToString(
        rasXML.documentElement,
      );
      const rasFile = new Blob([xmlString], { type: "application/xml" });
      assetsFolder?.file(`${basename}.readalong`, rasFile);
      // - add index.html file
      const sampleHtml = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${slots.title}</title>
                <!-- Import fonts. Material Icons are needed by the web component -->
                <link href="https://fonts.googleapis.com/css?family=Lato%7CMaterial+Icons%7CMaterial+Icons+Outlined" rel="stylesheet">
            </head>

            <body>
                <!-- Here is how you declare the Web Component. Supported languages: en, fr -->
                <read-along href="assets/${basename}.readalong" audio="assets/${basename}.mp3" theme="light" language="en" image-assets-folder="assets/">
                    <span slot='read-along-header'>${slots.title}</span>
                    <span slot='read-along-subheader'>${slots.subtitle}</span>
                </read-along>
            </body>

            <!-- The last step needed is to import the package -->
            <script type="module" src='https://unpkg.com/@readalongs/web-component@^${environment.packageJson.singleFileBundleVersion}/dist/web-component/web-component.esm.js'></script>
        </html>
        `;
      const indexHtmlFile = new Blob([sampleHtml], { type: "text/html" });
      innerFolder?.file("index.html", indexHtmlFile);
      //snippet for WP deployment
      const WP_deployment_readme = new Blob([
        this.readmeFile,
        `

WordPress Deployment Guide
        
        
Setup the plugin (do this once)

Install and activate our plugin 'wp-read-along-web-app-loader' on your WordPress site. 


Deploy the read-along

Upload the ${basename}.readalong and ${basename}.mp3 to your Media Library of your WordPress site.

Use the text editor to paste the snippet below in your WordPress page 

Replace assets/ with the path from your Media Library 

        ---- WordPress Deployment SNIPPET ----

<!-- Here is how you declare the Web Component. Supported languages: en, fr -->
[read_along_web_app_loader image-asset-folder="./" version="^${environment.packageJson.singleFileBundleVersion}"]
  <read-along href="assets/${basename}.readalong" audio="assets/${basename}.mp3" theme="light" language="en" image-assets-folder="assets/">
            <span slot='read-along-header'>${slots.title}</span>
            <span slot='read-along-subheader'>${slots.subtitle}</span>
        </read-along>
[/read_along_web_app_loader]

        ----- END OF SNIPPET----

        
        `,
      ]);

      // - add plain text readme
      // TODO: switch to this when the WP installation instructions are added
      // innerFolder?.file("README.txt", WP_deployment_readme);
      innerFolder?.file("README.txt", this.readmeFile);
      // - write zip
      zipFile.generateAsync({ type: "blob" }).then(
        (content) => saveAs(content, `${basename}.zip`),
        (err: HttpErrorResponse) =>
          this.toastr.error(err.error.detail, $localize`Download failed.`, {
            timeOut: 30000,
          }),
      );
    } else {
      let audio: HTMLAudioElement = new Audio(b64Audio);
      this.rasService
        .convertRasFormat$(
          {
            dur: audio.duration,
            ras: new XMLSerializer().serializeToString(rasXML.documentElement),
          },
          selectedOutputFormat,
        )
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: (x: Blob) => saveAs(x, `readalong.${selectedOutputFormat}`),
          error: (err: HttpErrorResponse) => this.reportRasError(err),
        });

      audio.remove();
      this.registerDownloadEvent(selectedOutputFormat);
    }
  }

  reportRasError(err: HttpErrorResponse) {
    if (err.status == 422) {
      this.toastr.error(
        err.message,
        $localize`ReadAlong format conversion failed.`,
        {
          timeOut: 15000,
        },
      );
    } else {
      this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        },
      );
    }
  }
}
