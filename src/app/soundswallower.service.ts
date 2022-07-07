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

  async initialize$(model = "assets/model/en-us") {
    return await soundswallower.initialize(model);
  }

  async createGrammar$(jsgf: string, dict: object) {
    return await soundswallower.createFSG(jsgf, dict);
  }

  async align$(audio: any, text: string) {
    return await soundswallower.align(audio, text);
  }
}
