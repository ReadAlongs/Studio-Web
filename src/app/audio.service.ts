import { from, sample } from "rxjs";

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class AudioService {
  constructor() {}

  loadAudioBufferFromFile$(file: File) {
    const AudioContext = window.AudioContext;
    var audioCtx = new AudioContext();
    var audioFile = file.arrayBuffer().then((buffer: any) => {
      return audioCtx.decodeAudioData(buffer);
    });
    return from(audioFile);
  }
}
