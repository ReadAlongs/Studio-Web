import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.sass']
})
export class DemoComponent implements OnInit {
  @Input() b64Inputs: string[];
  constructor() { }

  ngOnInit(): void {
  }

  download() {
    var element = document.createElement('a');
    // TODO: Offline compatibility
    let blob = new Blob([`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
      <title>Test ReadAlong</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet">
      <script type="module" src="https://unpkg.com/@roedoejet/readalong/dist/read-along/read-along.esm.js"></script>
      <script nomodule src="https://unpkg.com/@roedoejet/readalong/dist/read-along/read-along.js"></script>
    </head>
    <body>
        <read-along text="${this.b64Inputs[1]}" alignment="${this.b64Inputs[2]}" audio="${this.b64Inputs[0]}" use-assets-folder="false">
        </read-along>
    </body>
    </html>`], { type: "text/html;charset=utf-8" });
    element.href = window.URL.createObjectURL(blob);
    element.download = 'readalong.html';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
