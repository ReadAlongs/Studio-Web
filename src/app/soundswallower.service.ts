/* -*- mode: javascript; js-indent-level: 2 -*- */
import { BehaviorSubject, from } from "rxjs";

import { Injectable } from "@angular/core";

import soundswallower_factory from "soundswallower";
import { Decoder, SoundSwallowerModule } from "soundswallower";
var soundswallower: SoundSwallowerModule = null;

@Injectable({
  providedIn: "root",
})
export class SoundswallowerService {
  alignerReady$ = new BehaviorSubject<boolean>(false);
  constructor() {}

  decoder: Decoder;
  async initialize$({
    hmm = "model/en-us",
    loglevel = "INFO",
    samprate = 44100,
    beam = 1e-100,
    wbeam = 1e-100,
    pbeam = 1e-100,
  }) {
    if (soundswallower === null)
      soundswallower = await soundswallower_factory();
    this.decoder = new soundswallower.Decoder({
      loglevel,
      hmm,
      samprate,
      beam,
      wbeam,
      pbeam,
    });
    return await this.decoder.initialize();
  }

  async addDict(dict: any) {
    const n = dict.length;
    let idx = 0;
    for (const word in dict) {
      const pron = dict[word];
      console.log(`adding word ${word} with phones ${pron}`);
      await this.decoder.add_word(word, pron, idx === n - 1);
      ++idx;
    }
    console.log("finished adding words");
  }

  async createGrammarFromJSGF(jsgf: string) {
    const fsg = this.decoder.parse_jsgf(jsgf);
    await this.decoder.set_fsg(fsg);
    fsg.delete();
    console.log("finished creating grammar");
  }

  async createGrammar$(jsgf: string, dict: any) {
    await this.addDict(dict);
    console.log("Added words to dictionary");
    await this.createGrammarFromJSGF(jsgf);
    console.log("Added grammar");
    console.log("Grammar ready.");
  }

  async align$(audio: any, text: string) {
    if (this.decoder.config.get("samprate") != audio.sampleRate) {
      this.decoder.config.set("samprate", audio.sampleRate);
      await this.decoder.reinitialize_audio();
      console.log(
        "Updated decoder sampling rate to " +
          this.decoder.config.get("samprate")
      );
    }
    console.log("Audio sampling rate is " + audio.sampleRate);
    await this.decoder.start();
    await this.decoder.process(audio.getChannelData(0), false, true);
    await this.decoder.stop();
    const e = this.decoder.get_hypseg();
    console.log(e);
    return e;
  }
}
