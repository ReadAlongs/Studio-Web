import { Howl } from 'howler';

/**
 * Gets XML from path
 * @param {string} path - the path to the xml file
 */
function getXML(path: string): string {
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", path, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}

/**
 * Return list of elements from XPath
 * @param {string} xpath - the xpath to evaluate with
 * @param {Document} xml - the xml to evaluate
 */
function getElementByXpath(xpath: string, xml: Document): Node[] {
  let result_container: Node[] = []
  let results = xml.evaluate(xpath, xml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
  let node = results.iterateNext();
  while (node) {
    result_container.push(node);
    node = results.iterateNext()
  }
  return result_container
}


/**
 * Return a zipped array of arrays
 * @param {array[]}
 */
export function zip(arrays): Array<any[]> {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) { return array[i] })
  });
}

/**
 * Return useful data from TEI xml file
 * @param {string} - the path to the TEI file
 */
export function parseTEI(path: string): Array<string[]> {
  let xmlDocument = getXML(path)
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xmlDocument, "text/xml")
  let word_ids = getElementByXpath('/document/s/w/@id', xml_text).map(x => "s2.xml#" + x['value'])
  let word_vals = getElementByXpath('document/s/w', xml_text).map(x => x['innerHTML'])
  let result = zip([word_ids, word_vals])
  return result
}

/**
 * Return useful data from SMIL xml file
 * @param {string} - the path to the SMIL file
 */
export function parseSMIL(path: string): object {
  let xmlDocument = getXML(path)
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xmlDocument, "text/xml")
  let text = getElementByXpath('/smil/body/par/text/@src', xml_text).map(x => x['value'])
  let audio_begin = getElementByXpath('/smil/body/par/audio/@clipBegin', xml_text).map(x => x['value'] * 1000)
  let audio_end = getElementByXpath('/smil/body/par/audio/@clipEnd', xml_text).map(x => x['value'] * 1000)
  let audio_duration = []
  for (var i = 0; i < audio_begin.length; i++){
    let duration = audio_end[i] - audio_begin[i]
    audio_duration.push(duration)
  }
  let audio = zip([audio_begin, audio_duration])
  let result = {}
  for (var i = 0; i < text.length; i++){
    result[text[i]] = audio[i]
  }
  return result
}

/**
 * Sprite class containing the state of our sprites to play and their progress.
 * @param {Object} options Settings to pass into and setup the sound and visuals.
 */
export var Sprite = function(options) {
  var self = this;

  self.sounds = [];

  // Setup the options to define this sprite display.
  self._width = options.width;
  self._left = options.left;
  self._sprite = options.sprite;
  // self.setupListeners();

  // Create our audio sprite definition.
  self.sound = new Howl({
    src: options.src,
    sprite: options.sprite
  });

  // Setup a resize event and fire it to setup our sprite overlays.
  // window.addEventListener('resize', function() {
  //   self.resize();
  // }, false);
  // self.resize();

  // Begin the progress step tick.
  requestAnimationFrame(self.step.bind(self));
};

Sprite.prototype = {
  /**
   * Setup the listeners for each sprite click area.
   */
  // setupListeners: function() {
  //   var self = this;
  //   var keys = Object.keys(self._spriteMap);

  //   keys.forEach(function(key) {
  //     window[key].addEventListener('click', function() {
  //       self.play(key);
  //     }, false);
  //   });
  // },

  /**
   * Play a sprite when clicked and track the progress.
   * @param  {String} key Key in the sprite map object.
   */
  play: function(key) {
    var self = this;
    var sprite = key;
    // Play the sprite sound and capture the ID.
    var id = self.sound.play(sprite);
    return id
    // // Create a progress element and begin visually tracking it.
    // var elm = document.createElement('div');
    // elm.className = 'progress';
    // elm.id = id;
    // elm.dataset.sprite = sprite;
    // // window[key].appendChild(elm); // use shadow dom?
    // self.sounds.push(elm);

    // // When this sound is finished, remove the progress element.
    // self.sound.once('end', function() {
    //   var index = self.sounds.indexOf(elm);
    //   if (index >= 0) {
    //     self.sounds.splice(index, 1);
    //     // window[key].removeChild(elm); // use shadow dom?
    //   }
    // }, id);
  },

  /**
   * Called on window resize to correctly position and size the click overlays.
   */
  resize: function() {
    var self = this;

    // Calculate the scale of our window from "full" size.
    var scale = window.innerWidth / 3600;

    // Resize and reposition the sprite overlays.
    var keys = Object.keys(self._spriteMap);
    for (var i=0; i<keys.length; i++) {
      var sprite = window[keys[i]];
      sprite.style.width = Math.round(self._width[i] * scale) + 'px';
      if (self._left[i]) {
        sprite.style.left = Math.round(self._left[i] * scale) + 'px';
      }
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback positions.
   */
  step: function() {
    var self = this;

    // Loop through all active sounds and update their progress bar.
    for (var i=0; i<self.sounds.length; i++) {
      var id = parseInt(self.sounds[i].id, 10);
      var offset = self._sprite[self.sounds[i].dataset.sprite][0];
      var seek = (self.sound.seek(id) || 0) - (offset / 1000);
      self.sounds[i].style.width = (((seek / self.sound.duration(id)) * 103) || 0) + '%';
    }

    requestAnimationFrame(self.step.bind(self));
  }
};
