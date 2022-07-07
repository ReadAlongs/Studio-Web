import { BehaviorSubject, from } from "rxjs";
import { take } from "rxjs/operators";
import * as soundswallower from "soundswallower";

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SoundswallowerService {
  alignerReady$ = new BehaviorSubject<boolean>(false);
  constructor() {}

  async initialize$({
    hmm = "assets/model/en-us",
    samprate = 44100,
    beam = 1e-100,
    wbeam = 1e-100,
    pbeam = 1e-100,
  }) {
    return await soundswallower.initialize({
      hmm,
      samprate,
      beam,
      wbeam,
      pbeam,
    });
  }

  async createGrammar$(jsgf: string, dict: object) {
    return await soundswallower.createFSG(jsgf, dict);
  }

  async align$(audio: any, text: string) {
    return await soundswallower.align(audio, text);
  }
}
