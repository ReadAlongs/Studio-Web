/* -*- typescript-indent-level: 2 -*- */
import { Observable } from "rxjs";
import soundswallower_factory, {
  Decoder,
  DictEntry,
  SoundSwallowerModule,
} from "soundswallower";

import { Injectable } from "@angular/core";

var soundswallower: SoundSwallowerModule;

@Injectable({
  providedIn: "root",
})
export class SoundswallowerService {
  constructor() {}

  decoder: Decoder;
  async initialize({
    hmm = "model/en-us",
    loglevel = "INFO",
    samprate = 8000,
    beam = 1e-100,
    wbeam = 1e-100,
    pbeam = 1e-100,
  }) {
    if (soundswallower === undefined)
      soundswallower = await soundswallower_factory();
    this.decoder = new soundswallower.Decoder({
      loglevel,
      hmm,
      samprate,
      beam,
      wbeam,
      pbeam,
    });
    this.decoder.unset_config("dict");
    this.decoder.initialize();
  }

  async align$(audio: AudioBuffer, text: string, dict: any) {
    if (this.decoder.get_config("samprate") != audio.sampleRate) {
      this.decoder.set_config("samprate", audio.sampleRate);
      console.log(
        "Updated decoder sampling rate to " +
          this.decoder.get_config("samprate")
      );
    }
    console.log("Audio sampling rate is " + audio.sampleRate);
    await this.decoder.initialize();
    const words: Array<DictEntry> = [];
    for (const name in dict) words.push([name, dict[name]]);
    this.decoder.add_words(...words);
    console.log("Added words to dictionary");
    this.decoder.set_align_text(text);
    console.log("Added word sequence for alignment");
    this.decoder.start();
    this.decoder.process_audio(audio.getChannelData(0), false, true);
    this.decoder.stop();
    const e = this.decoder.get_alignment();
    console.log(e);
    return e;
  }
}
