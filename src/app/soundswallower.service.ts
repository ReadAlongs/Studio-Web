/* -*- typescript-indent-level: 2 -*- */
import { Observable } from "rxjs";
import soundswallower_factory, {
  Decoder,
  DictEntry,
  Segment,
  SoundSwallowerModule,
} from "soundswallower";

import { Injectable } from "@angular/core";

var soundswallower: SoundSwallowerModule;

export interface AlignmentProgress {
  pos: number;
  length: number;
  hypseg?: Segment;
}

@Injectable({
  providedIn: "root",
})
export class SoundswallowerService {
  constructor() {}

  async initialize() {
    if (soundswallower === undefined)
      soundswallower = await soundswallower_factory();
  }

  align$(
    audio: AudioBuffer,
    text: string,
    dict: { [id: string]: string }
  ): Observable<AlignmentProgress> {
    return new Observable((subscriber) => {
      // Do synchronous (and hopefully fast) initialization
      const decoder = new soundswallower.Decoder({
        loglevel: "INFO",
        beam: 1e-100,
        wbeam: 1e-100,
        pbeam: 1e-80,
        samprate: audio.sampleRate,
      });
      decoder.unset_config("dict");
      let cancelled = false;
      // Now do some async (and interruptible) stuff
      decoder
        .initialize()
        .then(async () => {
          // Not async but we have to initialize() first, so...
          const words: Array<DictEntry> = [];
          for (const name in dict) words.push([name, dict[name]]);
          decoder.add_words(...words);
          decoder.set_align_text(text);
          decoder.start();
          const channel_data = audio.getChannelData(0);
          const BUFSIZ = 8192;
          let pos = 0;
          subscriber.next({ pos: pos, length: channel_data.length });
          while (pos < channel_data.length) {
            let len = channel_data.length - pos;
            if (len > BUFSIZ) len = BUFSIZ;
            // Do this in a loop with async/await to make it readable
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                decoder.process_audio(
                  channel_data.subarray(pos, pos + len),
                  false,
                  false
                );
                resolve();
              }, 0);
            });
            pos += len;
            subscriber.next({ pos: pos, length: channel_data.length });
            if (cancelled) {
              decoder.stop();
              return;
            }
          }
          decoder.stop();
          subscriber.next({
            pos: pos,
            length: channel_data.length,
            hypseg: decoder.get_alignment(),
          });
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        })
        .finally(() => {
          decoder.delete();
        });
      return () => {
        cancelled = true;
      };
    });
  }
}
