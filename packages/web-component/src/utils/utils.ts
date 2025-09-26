import { Howl } from "howler";
import { BehaviorSubject, Subject } from "rxjs";
import { Alignment, Page, UserPreferences, RASMeta, RASDoc } from "../index.d";

export const USER_PREFERENCE_STORAGE_ID = "RAUserPreferences";

export const USER_PREFERENCE_VERSION = "0.1";
/**
 * Return a zipped array of arrays
 * @param {array[]} arrays
 */
export function zip(arrays): Array<any[]> {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) {
      return array[i];
    });
  });
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Return pages from readalong XML file
 * @param {string} - the path to the readalong file
 */
export async function parseRAS(path: string): Promise<RASDoc> {
  let response = await fetch(path);
  if (!response.ok) {
    console.error(`fetch(${path}) failed with status ${response.status}`);
    return { pages: null, meta: null };
  }
  let xmlDocument = await response.text();
  let parser = new DOMParser();
  let xml = parser.parseFromString(xmlDocument, "text/xml");
  return { pages: extractPages(xml), meta: extractMeta(xml) };
}

/**
 * Return pages from parsed XML
 * @param {xml} - the parsed XML (could be an element)
 */
export function extractPages(xml: Document | Element): Array<Page> {
  let parsed_pages = Array.from(xml.querySelectorAll("div[type=page]")).map(
    (page) => {
      let img = page.querySelector("graphic[url]");
      let paragraphs = page.querySelectorAll("p");
      let parsed_page = {
        id: page.getAttribute("id"),
        paragraphs: Array.from(paragraphs),
      };
      if (img !== null) {
        parsed_page["img"] = img.getAttribute("url");
      }
      if (page.attributes) parsed_page["attributes"] = page.attributes;
      return parsed_page;
    },
  );
  return parsed_pages;
}

/**
 *
 * @param {xml} - the parsed XML
 * @returns {RASMeta} - meta key-values
 */
export function extractMeta(xml: Document | Element): RASMeta {
  let meta = {};
  Array.from(xml.querySelectorAll("meta")).forEach((metaTag) => {
    const key = metaTag.getAttribute("name");
    let value = metaTag.getAttribute("content");
    meta[key] = value.trim();
  });
  return meta;
}

/**
 * Extract alignment data from parsed text
 */
export function extractAlignment(parsed_text: Array<Page>): Alignment {
  let alignment = {};
  for (const page of parsed_text) {
    for (const p of page.paragraphs) {
      for (const w of Array.from(p.querySelectorAll("w[time][dur]"))) {
        const time = w.getAttribute("time");
        const dur = w.getAttribute("dur");
        if (time !== null && dur !== null)
          alignment[w.getAttribute("id")] = [
            Math.round(parseFloat(time) * 1000),
            Math.round(parseFloat(dur) * 1000),
          ];
      }
    }
  }
  return alignment;
}

/**
 * Sprite class containing the state of our sprites to play and their progress.
 * @param {Object} options Settings to pass into and setup the sound and visuals.
 */
export var Sprite = function (options) {
  var self = this;
  const html5 = isIOS();
  self.sounds = [];
  // Setup the options to define this sprite display.
  self._sprite = options.sprite;
  // Create new Subject tracking which element is being read
  self._reading$ = new Subject();
  // List of all non-"all" sprites
  self._tinySprite = Object.keys(options.sprite).map((str) => [
    self._sprite[str][0],
    str,
    self._sprite[str][0] + self._sprite[str][1], //start time + duration (real time upper limit of the sprite)
  ]);
  // remove the 'all' sprite
  self._tinySprite.pop();
  // percentage finished
  self._percentPlayed = new BehaviorSubject<string>("0%");

  // Create our audio sprite definition.
  self.sound = new Howl({
    src: options.src,
    sprite: options.sprite,
    rate: options.rate,
    html5: html5,
    onend: function () {
      self._reading$.next(""); //flush the pipe
    },
  });

  // Begin the progress step tick.
  requestAnimationFrame(self.step.bind(self));
};

Sprite.prototype = {
  /**
   * Play a sprite when clicked and track the progress.
   * @param  {String} key Key in the sprite map object.
   */
  play: function (key: string): number {
    var self = this;
    self._spriteLeft = self._tinySprite;
    var sprite = key;
    // Play the sprite sound and capture the ID.
    var id = self.sound.play(sprite);
    return id;
  },

  pause: function (): number {
    var self = this;
    self.sound.pause();
    return self.sound.id;
  },

  /**
   * Go back s seconds, or if current position - s is less than 0
   * go back to the beginning.
   *
   * @param id - the id of the audio to roll back
   * @param s - the number of seconds to go back
   */
  goBack: function (id: number, s: number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite;
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.
    if (self.sound.seek((id = id)) - s > 0) {
      var id: number = self.sound.seek(self.sound.seek((id = id)) - s, id);
      // move highlight back TODO: refactor out into its own function and combine with version in step()
      var seek = self.sound.seek((id = id));
      for (var j = 0; j < self._spriteLeft.length; j++) {
        // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
        if (seek * 1000 >= self._spriteLeft[j][0]) {
          // only emit sprite if within current audio seek position
          if (seek * 1000 <= self._spriteLeft[j][2]) {
            self._reading$.next(self._spriteLeft[j][1]);
          }
          self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length);
        }
      }
      self._reading$.next(self._spriteLeft[0][1]);
      // else, return back to beginning
    } else {
      var id: number = self.sound.seek(0, id);
      self._reading$.next(self._spriteLeft[0][1]);
    }
    return id;
  },

  /**
   * Go to s seconds in the audio timeline
   * @param id - the id of the audio to roll back
   * @param s - the number of seconds to go back
   */
  goTo: function (id: number, s: number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite;
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.

    var id: number = self.sound.seek(s, id);
    // get the current audio position and convert it from seconds to millisecond
    var seek = self.sound.seek((id = id)) * 1000;
    for (var j = 0; j < self._spriteLeft.length; j++) {
      // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
      if (seek >= self._spriteLeft[j][0]) {
        // only emit sprite if within current audio seek position
        if (seek <= self._spriteLeft[j][2]) {
          self._reading$.next(self._spriteLeft[j][1]);
          //attempt to adjust the audio position
          id = self.sound.seek(self._spriteLeft[j][0], id); //set sound to beginning of word
          self.sound.seek((id = id));
          self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length);
          break;
        }
      }
    }
    //update the progress bar
    if (self.sounds.length) {
      const percentage =
        (Math.round((s / self.sound.duration(id)) * 100) || 0) + "%";

      self.sounds[0].style.width = percentage;
      self.sounds[0].setAttribute("offset", percentage);
    }

    // else, return back to beginning
    return id;
  },

  /**
   * Stop the sound
   */
  stop: function (): number {
    var self = this;
    // remove reading
    self._reading$.next("");
    // Play the sprite sound and capture the ID.
    var id = self.sound.stop();
    return id;
  },

  /**
   * The step called within requestAnimationFrame to update the playback positions.
   */
  step: function (): void {
    var self = this;
    // // Loop through all active sounds and update their progress bar.
    for (var i = 0; i < self.sounds.length; i++) {
      var seek = self.sound.seek() || 0;
      for (var j = 0; j < self._spriteLeft.length; j++) {
        // TODO: refactor out into its own function and combine with version in step()
        // if stopped
        if (seek > 0) {
          // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
          if (seek * 1000 >= self._spriteLeft[j][0]) {
            // only emit sprite if within current audio seek position
            if (seek * 1000 <= self._spriteLeft[j][2]) {
              self._reading$.next(self._spriteLeft[j][1]);
            }
            self._spriteLeft = self._spriteLeft.slice(
              j,
              self._spriteLeft.length,
            );
          }
        }
      }
      let percent = ((seek / self.sound.duration()) * 100 || 0) + "%";
      self.sounds[i].style.width = percent;
      self.sounds[i].setAttribute("offset", percent);
    }
    requestAnimationFrame(self.step.bind(self));
  },
};

export async function isFileAvailable(url) {
  return new Promise(function (resolve, _) {
    let xhr = new XMLHttpRequest();
    xhr.open("HEAD", url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    xhr.onerror = function () {
      resolve(false);
    };
    xhr.send();
  });
}
// returns users preference if it matches current version format
export const getUserPreferences = (): UserPreferences | null => {
  const prefs: string = window.localStorage.getItem(USER_PREFERENCE_STORAGE_ID);
  if (prefs && prefs.length) {
    const user_preferences: UserPreferences = JSON.parse(prefs);
    if (
      user_preferences.version &&
      user_preferences.version === USER_PREFERENCE_VERSION
    ) {
      return user_preferences;
    }
  }
  return null;
};
export const setUserPreferences = (userPref: UserPreferences) => {
  window.localStorage.setItem(
    USER_PREFERENCE_STORAGE_ID,
    JSON.stringify(userPref),
  );
};

export const sentenceIsAligned = (sentence: Element): boolean => {
  return sentence.innerHTML.includes("</w>");
};
