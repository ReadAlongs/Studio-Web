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
      //if there are no translations
      //remove all existing translations
      doc
        .querySelectorAll("s.translation, s.sentence__translation")
        .forEach((sentence: Element) => {
          sentence.remove();
        });
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
      //update current text or remove deleted translation
      doc
        .querySelectorAll("s.translation, s.sentence__translation")
        .forEach((sentence: Element) => {
          const sentenceID: string = sentence.hasAttribute("sentence-id")
            ? (sentence.getAttribute("sentence-id") as string)
            : sentence.id;
          if (sentenceID in translations) {
            sentence.textContent = translations[sentenceID];
          } else {
            //remove deleted translations
            sentence.remove();
          }
        });
      // Add new translations
      sentence_nodes.forEach((sentence: Element) => {
        if (
          sentence.id in translations &&
          !translation_node_ids.has(sentence.id)
        ) {
          // No namespaces!! NO! NO! NO!
          let newSentence = document.createElementNS(null, "s");
          newSentence.setAttribute("do-not-align", "true");
          newSentence.setAttribute("id", `${sentence.id}`);
          newSentence.setAttribute("sentence-id", sentence.id);
          newSentence.setAttribute(
            "class",
            "sentence__translation editable__translation",
          );
          newSentence.setAttribute("xml:lang", "eng");
          newSentence.append(translations[sentence.id]);
          sentence.insertAdjacentElement("afterend", newSentence);
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

  registerDownloadEvent(selectedOutputFormat: SupportedOutputs, from: string) {
    try {
      const win = window;
      (win as any).plausible(`Download`, {
        props: { fileType: selectedOutputFormat, downloadSource: from },
      });
    } catch (err) {
      console.error(err);
    }
  }

  async createSingleFileBlob(
    rasDoc: Document,
    readalong: Components.ReadAlong,
    slots: ReadAlongSlots,
    b64Audio: string,
  ) {
    await this.updateImages(rasDoc, true, "image", readalong);
    await this.updateTranslations(rasDoc, readalong);
    let rasB64 = this.b64Service.xmlToB64(rasDoc);
    if (this.b64Service.jsAndFontsBundle$.value !== null) {
      let blob = new Blob(
        [
          `
            <!DOCTYPE html>

            <!--

                                Instructions for Opening this File

            This is a read-along file that can be opened in a web browser without
            requiring Internet access.

            If you see this text, you probably downloaded a ReadAlong HTML file from a
            cloud storage service, and it's showing you the raw contents instead of
            displaying your readalong.

            To view the file:

            1. Download the file to your computer -- there should be a download button
               visible or hidden in the three dot menu in your cloud storage service.

            2. Once downloaded, open the file in a web browser. You can do this by
               double-clicking it in your file explorer or in your browser's downloaded
               files list.

            -->

            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="application-name" content="read along">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
                <meta name="generator" content="@readalongs/studio-web ${environment.packageJson.singleFileBundleVersion}">
                <title>${slots.title}</title>
                <style>
            ${this.b64Service.indent(this.b64Service.jsAndFontsBundle$.value[1], 6)}
                </style>
                <script name="@readalongs/web-component" version="${environment.packageJson.singleFileBundleVersion}" timestamp="${environment.packageJson.singleFileBundleTimestamp}">
            ${this.b64Service.indent(this.b64Service.jsAndFontsBundle$.value[0], 6)}
                </script>
              </head>
              <body>
                <read-along
                  version="${environment.packageJson.singleFileBundleVersion}"
                  href="data:application/readalong+xml;base64,${rasB64}"
                  audio="${b64Audio}"
                  image-assets-folder=""
                >
                  <span slot="read-along-header">${slots.title}</span>
                  <span slot="read-along-subheader">${slots.subtitle}</span>
                </read-along>
              </body>
            </html>
          `
            .replace(/\n            /g, "\n")
            .trim(),
        ],
        { type: "text/html;charset=utf-8" },
      );
      return blob;
    }
    return undefined;
  }

  createRASBasename(title: string) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    return (title ? slugify(title, 15) : "readalong") + `-${timestamp}`;
  }

  async download(
    selectedOutputFormat: SupportedOutputs,
    b64Audio: string,
    rasXML: Document,
    slots: ReadAlongSlots,
    readalong: Components.ReadAlong,
    from = "Studio",
  ) {
    if (selectedOutputFormat == SupportedOutputs.html) {
      var element = document.createElement("a");
      const blob = await this.createSingleFileBlob(
        rasXML,
        readalong,
        slots,
        b64Audio,
      );
      if (blob) {
        const basename = this.createRASBasename(slots.title);
        element.href = window.URL.createObjectURL(blob);
        element.download = `${basename}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.registerDownloadEvent(selectedOutputFormat, from);
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
      let audioExtension = "wav";
      let zipFile = new JSZip();
      // Create inner folder
      const innerFolder = zipFile.folder("www");
      const innerFolderEditable = zipFile.folder("Offline-HTML");
      const assetsFolder = innerFolder?.folder("assets");
      const blob = await this.createSingleFileBlob(
        rasXML,
        readalong,
        slots,
        b64Audio,
      );
      const basename = this.createRASBasename(slots.title);

      if (blob) {
        innerFolderEditable?.file(`${basename}.html`, blob);
      }

      // - add audio file
      if (b64Audio) {
        const [_, audioData] = b64Audio.split(";base64,");
        const rawBytes = window.atob(audioData);
        const byteArray = new Uint8Array(new ArrayBuffer(rawBytes.length));
        [...rawBytes].forEach(
          (_, i) => (byteArray[i] = rawBytes.charCodeAt(i)),
        );
        assetsFolder?.file(`${basename}.${audioExtension}`, byteArray);
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
            <meta name="application-name" content="read along">
            <meta name="generator" content="@readalongs/studio-web ${environment.packageJson.singleFileBundleVersion}">
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <!-- Import fonts. Material Icons are needed by the web component -->
            <link href="https://fonts.googleapis.com/css?family=Lato%7CMaterial+Icons%7CMaterial+Icons+Outlined" rel="stylesheet">
          </head>

          <body>
            <!-- Here is how you declare the Web Component. Supported languages: eng, fra, spa -->
            <read-along
              href="assets/${basename}.readalong"
              audio="assets/${basename}.${audioExtension}"
              theme="light"
              language="eng"
              image-assets-folder="assets/"
            >
              <span slot='read-along-header'>${slots.title}</span>
              <span slot='read-along-subheader'>${slots.subtitle}</span>
            </read-along>
          </body>

          <!-- The last step needed is to import the package -->
          <script type="module" src='https://unpkg.com/@readalongs/web-component@^${environment.packageJson.singleFileBundleVersion}/dist/web-component/web-component.esm.js'></script>
        </html>
      `
        .replace(/\n        /g, "\n")
        .trim();
      const indexHtmlFile = new Blob([sampleHtml], { type: "text/html" });
      innerFolder?.file("index.html", indexHtmlFile);
      //snippet for WP deployment
      const today = new Date();
      const month =
        today.getMonth() < 9
          ? `0${today.getMonth() + 1}`
          : `${today.getMonth() + 1}`;
      const WP_UPLOAD_FOLDER = `/wp-content/uploads/${today.getFullYear()}/${month}/`;
      const WP_deployment_readme = new Blob([
        this.readmeFile,
        `

WordPress Deployment Guide


Setup the plugin (do this once)

Install and activate our plugin 'wp-read-along-web-app-loader' on your WordPress site.

See https://github.com/ReadAlongs/Studio-Web/tree/main/packages/web-component/wordpress-plugin for more information.


Deploy the read-along

Upload the images, ${basename}.readalong and ${basename}.mp3 to your Media Library of your WordPress site.

Use the text editor to paste the snippet below in your WordPress page:

        ---- WordPress Deployment SNIPPET ----

<!-- wp:html -->
[read_along_web_app_loader version="^${environment.packageJson.singleFileBundleVersion}"]
  <read-along href="${WP_UPLOAD_FOLDER}${basename}.readalong" audio="${WP_UPLOAD_FOLDER}${basename}.mp3" theme="light" language="eng" image-assets-folder="${WP_UPLOAD_FOLDER}">
            <span slot='read-along-header'>${slots.title}</span>
            <span slot='read-along-subheader'>${slots.subtitle}</span>
        </read-along>
[/read_along_web_app_loader]
<!-- /wp:html -->
        ----- END OF SNIPPET----
`,
      ]);

      // - add plain text readme with regular and WordPress installation instructions
      innerFolder?.file("readme.txt", WP_deployment_readme);
      // - write zip
      zipFile.generateAsync({ type: "blob" }).then(
        (content) => saveAs(content, `${basename}.zip`),
        (err: HttpErrorResponse) =>
          this.toastr.error(err.error.detail, $localize`Download failed.`, {
            timeOut: 30000,
          }),
      );
      this.registerDownloadEvent(selectedOutputFormat, from);
    } else {
      let audio: HTMLAudioElement = new Audio(b64Audio);
      // - update .readalong file translation
      await this.updateTranslations(rasXML, readalong);

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
      this.registerDownloadEvent(selectedOutputFormat, from);
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
