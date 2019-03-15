
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
function zip(arrays): Array<string> {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) { return array[i] })
  });
}

/**
 * Return useful data from TEI xml file
 * @param {string} - the path to the TEI file
 */
export function parseTEI(path: string) {
  let xmlDocument = getXML(path)
  let parser = new DOMParser();
  let xml_text = parser.parseFromString(xmlDocument, "text/xml")
  let word_ids = getElementByXpath('/document/s/w/@id', xml_text).map(x => x['value'])
  let word_vals = getElementByXpath('document/s/w', xml_text).map(x => x['innerHTML'])
  let result = zip([word_ids, word_vals])
  return result
}

/**
 * Return useful data from SMIL xml file
 * @param {string} - the path to the SMIL file
 */
export function parseSMIL(path: string) {
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