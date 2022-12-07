import { from, sample } from "rxjs";

import { Injectable } from "@angular/core";
import { AudioContext } from "standardized-audio-context";

@Injectable({
  providedIn: "root",
})
export class AudioService {
  constructor() {}

  loadAudioBufferFromFile$(file: File, sampleRate: number) {
    var audioCtx = new AudioContext({ sampleRate });
    var audioFile = file.arrayBuffer().then((buffer: any) => {
      return audioCtx.decodeAudioData(buffer);
    });
    return from(audioFile);
  }
}
