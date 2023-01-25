import {Howl} from 'howler';
import {BehaviorSubject, Subject} from 'rxjs';
import {Alignment, Page} from "../index.ds";

/**
 * Inspect path
 * @param path
 * @return boolean
 */
export function looksLikeRelativePath(path: string): boolean {
  return !(/^(https?:\/|assets)\/\b/).test(path);
}

/**
 * Gets Document from path
 * @param {string} path - the path to the xml file
 */
function fetchDoc(path: string): Promise<string> {

  return fetch(path, {method: "GET", mode: "cors"}).then((response) => {
    if (!response.ok) {

      return Promise.reject(response.status + ": " + path + " " + response.statusText);
    }
    return response.text()
  }).catch((error) => {

    return Promise.reject(error)

  })

}


/**
 * Return list of nodes from XPath
 * @param {string} xpath - the xpath to evaluate with
 * @param {Document} xml - the xml to evaluate
 */
function getNodeByXpath(xpath: string, xml: Document): Node[] {
  let xmlns = xml.lookupNamespaceURI(null);
  if (xmlns === null) {
    // console.error("Your XML file is missing an XML namespace.");
  }
  function nsResolver(prefix) {
    const ns = {
      'i': xmlns
    };
    return ns[prefix] || null;
  }

  let result_container: Node[] = []
  let results = xml.evaluate(xpath, xml, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  let node = results.iterateNext();
  while (node) {
    result_container.push(node);
    node = results.iterateNext()
  }
  return result_container
}


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
 * Return sentences from TEI xml file
 * @param {string} path the path to the TEI file
 */
export async function parseTEI(path: string): Promise<Page[]> {
  let xmlDocument
  try {
    xmlDocument = await fetchDoc(path)
  } catch (e) {

    return Promise.reject(e)
  }
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xmlDocument, "text/xml")
  try {
    let pages = getNodeByXpath('.//div[@type="page"]', xml_text)
    return pages.map((p: Element) => {
      let id = p.id;
      let img_xpath = `.//div[@id='${id}']/graphic/@url`
      let img = getNodeByXpath(img_xpath, xml_text)
      let p_xpath = `.//div[@id='${id}']/p`
      let paragraphs = getNodeByXpath(p_xpath, xml_text)
      let parsed_page = {id: id, paragraphs: paragraphs}
      if (img.length > 0) {
        parsed_page['img'] = img[0].nodeValue;
      }
      if (p.attributes) parsed_page["attributes"] = p.attributes;
      return parsed_page
    });

  } catch (e) {
    return Promise.reject("Parsing ERROR: " + e)
  }

}


/**
 * Return useful data from SMIL xml file
 * @param {string} path the path to the SMIL file
 */
export async function parseSMIL(path: string): Promise<Alignment> {
  let xmlDocument
  try {
    xmlDocument = await fetchDoc(path)
  } catch (e) {
    return Promise.reject(e)
  }

  try {
    let parser = new DOMParser();
    let xml_text = parser.parseFromString(xmlDocument, "text/xml")
    let text = getNodeByXpath('/i:smil/i:body/i:par/i:text/@src', xml_text).map(x => {
        let split = x['value'].split('#');
        return split[split.length - 1]
      }
    )
    let audio_begin = getNodeByXpath('/i:smil/i:body/i:par/i:audio/@clipBegin', xml_text).map(x => x['value'] * 1000)
    let audio_end = getNodeByXpath('/i:smil/i:body/i:par/i:audio/@clipEnd', xml_text).map(x => x['value'] * 1000)
    let audio_duration = []
    for (let i = 0; i < audio_begin.length; i++) {
      let duration = audio_end[i] - audio_begin[i]
      audio_duration.push(duration)
    }
    let audio = zip([audio_begin, audio_duration])
    let result = {}
    for (let i = 0; i < text.length; i++) {
      result[text[i]] = audio[i]
    }
    return result
  } catch (e) {
    return Promise.reject("Parsing ERROR: " + e);
  }


}

/**
 * Sprite class containing the state of our sprites to play and their progress.
 * @param {Object} options Settings to pass into and setup the sound and visuals.
 */
export var Sprite = function (options) {
  let self = this;

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
   * @param  {String} sprite Key in the sprite map object.
   */
  play: function (sprite: string): number {
    const self = this;
    self._spriteLeft = self._tinySprite

    // Play the sprite sound and capture the ID.
    return self.sound.play(sprite);

  },

  pause: function (): number {
    const self = this;
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
    const self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.
    //FIXME Duplicate declaration
    if (self.sound.seek(id = id) - s > 0) {
      //FIXME Duplicate declaration
      var id: number = self.sound.seek(self.sound.seek(id = id) - s, id);
      // move highlight back TODO: refactor out into its own function and combine with version in step()
      let seek = self.sound.seek(id = id)
      for (let j = 0; j < self._spriteLeft.length; j++) {
        // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
        if (seek * 1000 >= self._spriteLeft[j][0]) {
          self._reading$.next(self._spriteLeft[j][1])
          self._spriteLeft = self._spriteLeft.slice(j, self._spriteLeft.length)
        }
      }
      // else, return back to beginning
    } else {
      //FIXME Duplicate declaration
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
    const self = this;
    // reset sprites left
    self._spriteLeft = self._tinySprite
    // if current_seek - s is greater than 0, find the closest sprite
    // and highlight it; seek to current_seek -s.
    //FIXME Duplicate declaration
    var id: number = self.sound.seek(s, id);
    // move highlight back TODO: refactor out into its own function and combine with version in step()
    let seek = self.sound.seek(id = id)//FIXME
    let end_point = 0;
    for (let j = 0; j < self._spriteLeft.length; j++) {

      if (seek * 1000 >= self._spriteLeft[j][0]) {
        //self._reading$.next(self._spriteLeft[j][1])
        end_point = j;
      } else {
        break;
      }
    }
    self._reading$.next(self._spriteLeft[end_point][1])
    // if seek passes sprite start point, replace self._reading with that sprite and slice the array of sprites left
    if (end_point != 0) {
      if (self._spriteLeft.length > end_point + 1) {
        self._percentPlayed = Math.floor((end_point / self._spriteLeft.length) * 100)
        self._spriteLeft = self._spriteLeft.slice(end_point, self._spriteLeft.length)
      } else {
        self._spriteLeft = []
      }
    }
    console.log("end goTo", id, s, seek, end_point, self._spriteLeft.length)

    return seek
  },

  /**
   * Stop the sound
   */
  stop: function (): number {
    const self = this;
    // remove reading
    self._reading$.next('')
    // Play the sprite sound and capture the ID.
    return self.sound.stop();

  },

  /**
   * The step called within requestAnimationFrame to update the playback positions.
   */
  step: function (): void {
    const self = this;
    // // Loop through all active sounds and update their progress bar.
    for (let i = 0; i < self.sounds.length; i++) {
      let seek = (self.sound.seek() || 0);
      for (let j = 0; j < self._spriteLeft.length; j++) { // TODO: refactor out into its own function and combine with version in step()
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


