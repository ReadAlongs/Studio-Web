import { Injectable } from '@angular/core';
import { from } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AudioService {

  constructor() { }

  loadAudioBufferFromFile$(file: File) {
    const AudioContext = window.AudioContext
    var audioCtx = new AudioContext();
    console.log(file)
    var audioFile = file.arrayBuffer().then((buffer: any) => { return audioCtx.decodeAudioData(buffer) })
    return from(audioFile)
  }

}
