import {Howl} from 'howler';
import {BehaviorSubject, Subject} from 'rxjs';
import {Alignment, Page} from "../index.ds";


/**
 * Return a zipped array of arrays
 * @param {array[]} arrays
 */
export function zip(arrays): Array<any[]> {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) { return array[i] })
  });
}


/**
 * Return sentences from readalong XML file
 * @param {string} - the path to the readalong file
 */
export async function parseRAS(path: string): Promise<Array<Page>> {
  let response = await fetch(path);
  if (!response.ok) {
    console.log(`fetch(${path}) failed with status ${response.status}`);
    return [];
  }
  let xmlDocument = await response.text();
  let parser = new DOMParser();
  let xml = parser.parseFromString(xmlDocument, "text/xml");
  let parsed_pages = Array.from(xml.querySelectorAll("div[type=page]")).map((page) => {
    let img = page.querySelector("graphic[url]");
    let paragraphs = page.querySelectorAll("p");
    let parsed_page = { id: page.getAttribute("id"), paragraphs: Array.from(paragraphs) }
    if (img !== null) {
      parsed_page['img'] = img.getAttribute("url");
    }
    if (page.attributes)
      parsed_page["attributes"] = page.attributes;
    return parsed_page;
  });
  return parsed_pages;
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

  self.sounds = [];
  // Setup the options to define this sprite display.
  self._sprite = options.sprite;
  // Create new Subject tracking which element is being read
  self._reading$ = new Subject;
  // List of all non-"all" sprites
  self._tinySprite = Object.keys(options.sprite).map((str) => [self._sprite[str][0], str]);
  // remove the 'all' sprite
  self._tinySprite.pop()
  // percentage finished
  self._percentPlayed = new BehaviorSubject<string>('0%');

  // Create our audio sprite definition.
  self.sound = new Howl({
    src: options.src,
    sprite: options.sprite,
    rate: options.rate
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
    self._spriteLeft = self._tinySprite
    var sprite = key;
    // Play the sprite sound and capture the ID.
    var id = self.sound.play(sprite);
    return id
  },

  pause: function (): number {
    var self = this;
    self.sound.pause()
    return self.sound.id
  },

  /**
   * Go back s seconds, or if current position - s is less than 0
   * go back to the beginning.
   *
   * @param id - the id of the audio to roll back
   * @param s - the number of seconds to go back
   */
  goBack: function (id : number, s: number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.
    if (self.sound.seek(id = id) - s > 0) {
      var id : number = self.sound.seek(self.sound.seek(id = id) - s, id);
      // move highlight back TODO: refactor out into its own function and combine with version in step()
      var seek = self.sound.seek(id = id)
      for (var j = 0; j < self._spriteLeft.length; j++) {
        // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
        if (seek * 1000 >= self._spriteLeft[j][0]) {
          self._reading$.next(self._spriteLeft[j][1])
          self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
        }
      }
      // else, return back to beginning
    } else {
      var id : number = self.sound.seek(0, id);
      self._reading$.next(self._spriteLeft[0][1])
    }
    return id
  },

  /**
 * Go back s seconds, or if current position - s is less than 0
 * go back to the beginning.
 *
 * @param id - the id of the audio to roll back
 * @param s - the number of seconds to go back
 */
  goTo: function (id : number, s : number): number {
    var self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.

    var id : number = self.sound.seek(s, id);
    // move highlight back TODO: refactor out into its own function and combine with version in step()
    var seek = self.sound.seek(id = id)
    for (var j = 0; j < self._spriteLeft.length; j++) {
      // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
      if (seek * 1000 >= self._spriteLeft[j][0]) {
        self._reading$.next(self._spriteLeft[j][1])
        self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
      }
    }
    // else, return back to beginning
    return id
  },

  /**
   * Stop the sound
   */
  stop: function (): number {
    var self = this;
    // remove reading
    self._reading$.next('')
    // Play the sprite sound and capture the ID.
    var id = self.sound.stop();
    return id
  },

  /**
   * The step called within requestAnimationFrame to update the playback positions.
   */
  step: function (): void {
    var self = this;
    // // Loop through all active sounds and update their progress bar.
    for (var i = 0; i < self.sounds.length; i++) {
      var seek = (self.sound.seek() || 0);
      for (var j = 0; j < self._spriteLeft.length; j++) { // TODO: refactor out into its own function and combine with version in step()
        // if stopped
        if (seek > 0) {
          // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
          if (seek * 1000 >= self._spriteLeft[j][0]) {
            self._reading$.next(self._spriteLeft[j][1])
            self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
          }
        }
      }
      let percent = (((seek / self.sound.duration()) * 100) || 0) + '%';
      self.sounds[i].style.width = percent;
      self.sounds[i].setAttribute("offset", percent)
    }
    requestAnimationFrame(self.step.bind(self));
  }
};


