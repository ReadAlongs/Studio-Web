import { from, sample } from "rxjs";

import { Injectable } from "@angular/core";
import { AudioContext } from "standardized-audio-context";

@Injectable({
  providedIn: "root",
})
export class AudioService {
  constructor() {}

  loadAudioBufferFromFile$(file: File) {
    var audioCtx = new AudioContext({ sampleRate: 16000 });
    var audioFile = file.arrayBuffer().then((buffer: any) => {
      return audioCtx.decodeAudioData(buffer);
    });
    return from(audioFile);
  }
}
