import { from, Observable, sample } from "rxjs";

import { Injectable } from "@angular/core";
import { AudioContext, AudioBuffer } from "standardized-audio-context";

@Injectable({
  providedIn: "root",
})
export class AudioService {
  constructor() {}

  loadAudioBufferFromFile$(
    file: File,
    sampleRate: number
  ): Observable<AudioBuffer> {
    var audioCtx = new AudioContext({ sampleRate });
    var audioFile = file.arrayBuffer().then((buffer: any) => {
      return audioCtx.decodeAudioData(buffer);
    });
    return from(audioFile);
  }
}
