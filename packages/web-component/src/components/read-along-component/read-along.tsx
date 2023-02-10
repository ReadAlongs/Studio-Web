import {Howl} from 'howler';
import {Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {Component, Element, h, Listen, Method, Prop, State} from '@stencil/core';

import {parseRAS, Sprite, extractAlignment} from '../../utils/utils';
import {Alignment, Page, InterfaceLanguage, ReadAlongMode, Translation} from "../../index.ds";

const LOADING = 0;
const LOADED = 1;
const ERROR_LOADING = 2;

@Component({
  tag: 'read-along',
  styleUrl: '../../scss/styles.scss',
  shadow: true
})
export class ReadAlongComponent {
  @Element() el: HTMLElement;


  /************
   *  PROPS   *
   ************/

  /**
   * URL of the aligned text as readalong XML
   */
  @Prop() href: string;

  processed_alignment: Alignment;

  /**
   * URL of the audio file
   */
  @Prop() audio: string;

  audio_howl_sprites: any;
  reading$: Subject<string>; // An RxJs Subject for the current item being read.
  duration: number; // Duration of the audio file

  /**
   * Overlay
   * This is an SVG overlay to place over the progress bar
   */
  @Prop() svgOverlay: string;

  /**
   * Theme to use: ['light', 'dark'] defaults to 'dark'
   */
  @Prop({ mutable: true, reflect: true }) theme: string = 'light';

  /**
   * Language  of the interface. In 639-3 code
   * Options are
   * - "eng" for English
   * - "fra" for French
   */
  @Prop({ mutable: true, reflect: true }) language: InterfaceLanguage = 'eng';

  /**
   * Optional custom Stylesheet to override defaults
   */
  @Prop() cssUrl?: string;

  /**
   * Toggle the use of assets folder for resolving urls. Defaults to on
   * to maintain backwards compatibility
   */

  @Prop() useAssetsFolder: boolean = true;

  /**
   * Toggles the page scrolling from horizontal to vertical. Defaults to horizontal
   *
   */

  @Prop() pageScrolling: "horizontal" | "vertical" = "horizontal";

  /**
   * Choose mode of ReadAlong - either view (default) or edit
   */
  @Prop() mode: ReadAlongMode = "VIEW";

  /************
   *  STATES  *
   ************/

  /**
   * Whether audio is playing or not
   */
  @State() playing: boolean = false;

  play_id: number;
  playback_rate: number = 1;

  @State() fullscreen: boolean = false;

  @State() autoScroll: boolean = true;
  @State() isLoaded: boolean = false;
  showGuide: boolean = false;

  parsed_text;
  dropAreas;
  current_page;
  hasTextTranslations: boolean = false;
  @State() images: {[key: string]: string | null};
  @State() translations: {[key: string]: string | null};
  assetsStatus = {
    'AUDIO': LOADING,
    'XML': LOADING,
  };
  alignment_failed: boolean = false;


  /************
   *  LISTENERS  *
   ************/

  @Listen('wheel', { target: 'window' })
  wheelHandler(event: MouseEvent): void {
    // only show guide if there is an actual highlighted element
    if (this.el.shadowRoot.querySelector('.reading')) {
      if (event['path'][0].classList.contains("sentence__word") ||
        event['path'][0].classList.contains("sentence__container") ||
        event['path'][0].classList.contains("sentence")) {
        if (this.autoScroll) {
          let reading_el: HTMLElement = this.el.shadowRoot.querySelector('.reading')
          if (reading_el) {
            this.autoScroll = !this.inPageContentOverflow(reading_el);
            this.showGuide = !this.autoScroll;
          }
        }
      }
    }
  }

  /***********
   *  UTILS  *
   ***********/
  /**
   * Transforms a given path to either use the default assets folder or rely on the absolute path given
   * @param path
   * @return string
   */
  private urlTransform(path: string): string {
    if (this.useAssetsFolder && looksLikeRelativePath(path) && !path.startsWith('blob'))
      return "assets/" + path;
    return path;

    function looksLikeRelativePath(path: string): boolean {
      return !(/^(https?:[/]|assets)[/]\b/).test(path);
    }
  }

  /**
   * Given an audio file path and a parsed alignment object,
   * build a Sprite object
   * @param audio
   * @param alignment
   */
  private buildSprite(audio: string, alignment: Alignment) {
    return new Sprite({
      src: [audio],
      sprite: alignment,
      rate: this.playback_rate
    });
  }

  /**
   * Add escape characters to query selector param
   * @param id
   */
  tagToQuery(id: string): string {
    id = id.replace(".", "\\.")
    id = id.replace("#", "\\#")
    return "#" + id
  }

  /**
   * Return HTML element of word closest to second s
   *
   * @param s seconds
   */
  returnWordClosestTo(s: number): HTMLElement {
    let keys = Object.keys(this.processed_alignment)
    // remove 'all' sprite as it's not a word.
    keys.pop()
    for (let i = 1; i < keys.length; i++) {
      if (s * 1000 > this.processed_alignment[keys[i]][0]
        && this.processed_alignment[keys[i + 1]]
        && s * 1000 < this.processed_alignment[keys[i + 1]][0]) {
        return this.el.shadowRoot.querySelector(this.tagToQuery(keys[i]))
      }
    }
  }


  /*************
   *   AUDIO   *
   *************/

  /**
   * Change playback between .75 and 1.25. To change the playback options,
   * change the HTML in the function renderControlPanel
   *
   * @param ev
   */
  changePlayback(ev: Event): void {
    let inputEl = ev.currentTarget as HTMLInputElement
    this.playback_rate = parseInt(inputEl.value) / 100
    this.audio_howl_sprites.sound.rate(this.playback_rate)
  }

  /**
   *  Go back s milliseconds
   *
   * @param s
   */

  goBack(s: number): void {
    this.autoScroll = false;
    if (this.play_id) {
      this.audio_howl_sprites.goBack(this.play_id, s)
    }
    setTimeout(() => this.autoScroll = true, 100)
  }

  /**
   * Go to seek
   *
   * @param seek number
   *
   */
  goTo(seek: number): void {
    if (this.play_id === undefined) {
      this.play();
      this.pause();
    }
    this.autoScroll = false;
    seek = seek / 1000
    this.audio_howl_sprites.goTo(this.play_id, seek)
    setTimeout(() => this.autoScroll = true, 100)
  }

  /**
   * Go to seek from id
   *
   * @param ev
   */
  goToSeekAtEl(ev: MouseEvent): string {
    let el = ev.currentTarget as HTMLElement
    let tag = el.id;
    let seek = this.processed_alignment[tag][0]
    this.goTo(seek)
    return tag
  }

  /**
   * Go to seek from progress bar
   */
  goToSeekFromProgress(ev: MouseEvent): void {
    let el = ev.currentTarget as HTMLElement;
    let client_rect = el.getBoundingClientRect()
    // get offset of clicked element
    let offset = client_rect.left
    // get width of clicked element
    let width = client_rect.width
    // get click point
    let click = ev.pageX - offset
    // get seek in milliseconds
    let seek = ((click / width) * this.duration) * 1000
    this.goTo(seek)
  }


  /**
   * Pause audio.
   */
  pause(): void {
    this.playing = false;
    this.audio_howl_sprites.pause()
  }


  /**
   * Play the current audio, or start a new play of all
   * the audio
   *
   *
   */
  play() {
    this.playing = true;
    // If already playing once, continue playing
    if (this.play_id !== undefined) {
      this.play_id = this.audio_howl_sprites.play(this.play_id)
    } else {
      // else, start a new play
      this.play_id = this.audio_howl_sprites.play('all')
    }
    // animate the progress bar
    this.animateProgress()

  }

  /**
   * Seek to an element with id 'id', then play it
   *
   * @param ev
   */
  playSprite(ev: MouseEvent): void {
    let tag = this.goToSeekAtEl(ev)
    if (!this.playing) {
      this.audio_howl_sprites.play(tag)
    }
  }


  /**
   * Stop the sound and remove all active reading styling
   */
  stop(): void {
    this.playing = false;
    this.audio_howl_sprites.stop()
    this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))

    if (!this.autoScroll) {
      this.autoScroll = true;
      this.showGuide = false;
    }

  }

  /**
   * toggle the visibility of translation text
   */
  toggleTextTranslation(): void {
    this.el.shadowRoot.querySelectorAll('.translation').forEach(translation => translation.classList.toggle('invisible'))
    this.el.shadowRoot.querySelectorAll('.sentence__translation').forEach(translation => translation.classList.toggle('invisible'))

  }

  /*************
   * ANIMATION *
   *************/

  /**
   * Remove highlighting from every other word and add it to el
   *
   * @param el
   */
  addHighlightingTo(el: HTMLElement): void {
    this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
    el.classList.add('reading')
  }

  /**
   * Animate the progress through the overlay svg
   */
  animateProgressWithOverlay(): void {
    // select svg container
    let wave__container: any = this.el.shadowRoot.querySelector('#overlay__object')
    // use svg container to grab fill and trail
    let fill: HTMLElement = wave__container.contentDocument.querySelector('#progress-fill')
    let trail = wave__container.contentDocument.querySelector('#progress-trail')
    let base = wave__container.contentDocument.querySelector('#progress-base')
    fill.classList.add('stop-color--' + this.theme)
    base.classList.add('stop-color--' + this.theme)

    // push them to array to be changed in step()
    this.audio_howl_sprites.sounds.push(fill)
    this.audio_howl_sprites.sounds.push(trail)
    // When this sound is finished, remove the progress element.
    this.audio_howl_sprites.sound.once('end', () => {
      this.audio_howl_sprites.sounds.forEach(x => {
        x.setAttribute("offset", '0%');
      });
      this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
      this.playing = false;
      // }
    }, this.play_id);
  }

  /**
   * Animate the progress if no svg overlay is provided
   *
   * @param play_id
   * @param tag
   */
  animateProgressDefault(play_id: number, tag: string): void {
    let elm = document.createElement('div');
    elm.className = 'progress theme--' + this.theme;
    elm.id = play_id.toString();
    elm.dataset.sprite = tag;
    let query = this.tagToQuery(tag);
    this.el.shadowRoot.querySelector(query).appendChild(elm);
    this.audio_howl_sprites.sounds.push(elm);

    // When this sound is finished, remove the progress element.
    this.audio_howl_sprites.sound.once('end', () => {
      // this.audio_howl_sprites = [];
      this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
      this.playing = false;
      // }
    }, this.play_id);
  }

  /**
   * Animate progress, either by default or with svg overlay.
   */
  animateProgress(play_id = this.play_id): void {
    // Start animating progress
    if (this.svgOverlay) {
      // either with svg overlay
      this.animateProgressWithOverlay();
    } else {
      // or default progress bar
      this.animateProgressDefault(play_id, 'all');
    }
  }


  /**
   * Change fill colour to match theme
   */
  changeFill(): void {
    // Get theme contrast from the computed color of a word
    let contrast_el = this.el.shadowRoot.querySelector('.sentence__word')
    let contrast = window.getComputedStyle(contrast_el).color

    // select svg container
    let wave__container: any = this.el.shadowRoot.querySelector('#overlay__object')

    // use svg container to grab fill and trail
    let fill = wave__container.contentDocument.querySelector('#progress-fill')
    let base = wave__container.contentDocument.querySelector('#progress-base')

    // select polygon
    let polygon = wave__container.contentDocument.querySelector('#polygon')
    polygon.setAttribute('stroke', contrast)

    base.setAttribute('stop-color', contrast)
    fill.setAttribute('stop-color', contrast)
  }

  /**
   * Get Images
   */
  @Method()
  async getImages(): Promise<object> {
    return this.images
  }

  /**
  * Get Translations
  */
  @Method()
  async getTranslations(): Promise<object> {
    return this.translations
  }

  /**
   * Change theme
   */
  @Method()
  async changeTheme(): Promise<void> {
    if (this.theme === 'light') {
      this.theme = 'dark'
    } else {
      this.theme = 'light'
    }
  }

  /**
   * Return the Sentence Container of Word
   * Currently the 3rd parent up the tree node
   * @param element
   * @private
   */
  private static _getSentenceContainerOfWord(element: HTMLElement): HTMLElement {
    return element.parentElement.parentElement.parentElement
  }

  /**
   * Make Fullscreen
   */
  private toggleFullscreen(): void {
    if (!this.fullscreen) {
      let elem: any = this.el.shadowRoot.getElementById('read-along-container');
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
      this.el.shadowRoot.getElementById('read-along-container')
        .classList.add('read-along-container--fullscreen');
    } else {
      let document: any = this.el.ownerDocument
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
      this.el.shadowRoot.getElementById('read-along-container')
        .classList.remove('read-along-container--fullscreen');
    }
    this.fullscreen = !this.fullscreen
  }

  /*************
   * SCROLLING *
   *************/

  hideGuideAndScroll(): void {
    let reading_el: HTMLElement = this.el.shadowRoot.querySelector('.reading')
    // observe when element is scrolled to, then remove the scroll guide and unobserve
    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true
        }, 100)
        intersectionObserver.unobserve(reading_el)
      }
    })
    intersectionObserver.observe(reading_el)
    this.scrollTo(reading_el)
  }

  //for when you visually align content
  inParagraphContentOverflow(element: HTMLElement): boolean {
    let para_el = ReadAlongComponent._getSentenceContainerOfWord(element);
    let para_rect = para_el.getBoundingClientRect()
    let el_rect = element.getBoundingClientRect()

    // element being read is left of the words being viewed
    let inOverflowLeft = el_rect.right < para_rect.left;
    // element being read is right of the words being viewed
    let inOverflowRight = el_rect.right > para_rect.right;

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true
        }, 100)
        intersectionObserver.unobserve(element)
      }
    })
    intersectionObserver.observe(element)
    // if not in overflow, return false
    return (inOverflowLeft || inOverflowRight)
  }

  inPageContentOverflow(element: HTMLElement): boolean {
    let page_el = this.el.shadowRoot.querySelector('#' + this.current_page)
    let page_rect = page_el.getBoundingClientRect()
    let el_rect = element.getBoundingClientRect()

    // element being read is below/ahead of the words being viewed
    let inOverflowBelow = el_rect.top + el_rect.height > page_rect.top + page_rect.height
    // element being read is above/behind of the words being viewed
    let inOverflowAbove = el_rect.top + el_rect.height < 0

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true
        }, 100)
        intersectionObserver.unobserve(element)
      }
    })
    intersectionObserver.observe(element)

    // if not in overflow, return false
    return (inOverflowAbove || inOverflowBelow)
  }

  inPage(element: HTMLElement): boolean {
    let sent_el = ReadAlongComponent._getSentenceContainerOfWord(element)
    let sent_rect = sent_el.getBoundingClientRect()
    let el_rect = element.getBoundingClientRect()
    // element being read is below/ahead of the words being viewed
    let inOverflowBelow = el_rect.top + el_rect.height > sent_rect.top + sent_rect.height
    // element being read is above/behind of the words being viewed
    let inOverflowAbove = el_rect.top + el_rect.height < 0


    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true
        }, 100)
        intersectionObserver.unobserve(element)
      }
    })
    intersectionObserver.observe(element)

    // if not in overflow, return false
    return (inOverflowAbove || inOverflowBelow)
  }

  scrollToPage(pg_id: string): void {
    let page_container: any = this.el.shadowRoot.querySelector('.pages__container')
    let next_page: any = this.el.shadowRoot.querySelector('#' + pg_id)
    page_container.scrollBy({
      top: this.pageScrolling.match("vertical") != null ? (next_page.offsetTop - page_container.scrollTop) : 0,
      left: this.pageScrolling.match("vertical") != null ? 0 : (next_page.offsetLeft - page_container.scrollLeft),
      behavior: 'smooth'
    });
    next_page.scrollTo(0, 0)//reset to top of the page
  }

  scrollByHeight(el: HTMLElement): void {

    let sent_container = ReadAlongComponent._getSentenceContainerOfWord(el) //get the direct parent sentence container


    let anchor = el.parentElement.getBoundingClientRect()
    sent_container.scrollBy({
      top: sent_container.getBoundingClientRect().height - anchor.height, // negative value acceptable
      left: 0,
      behavior: 'smooth'
    })

  }

  //scrolling within the visually aligned paragraph
  scrollByWidth(el: HTMLElement): void {

    let sent_container = ReadAlongComponent._getSentenceContainerOfWord(el) //get the direct parent sentence container


    let anchor = el.getBoundingClientRect()
    sent_container.scrollTo({
      left: anchor.left - 10, // negative value acceptable
      top: 0,
      behavior: 'smooth'
    })

  }

  scrollTo(el: HTMLElement): void {

    el.scrollIntoView({
      behavior: 'smooth'
    });
  }

  /****
   * AUDIO HANDLING
   *
   */
  audioFailedToLoad() {

    this.isLoaded = true;
    this.assetsStatus.AUDIO = ERROR_LOADING;

  }

  audioLoaded() {

    this.isLoaded = true;
    this.assetsStatus.AUDIO = LOADED;

  }

  /*************
   * LIFECYCLE *
   *************/

  /**
   * When the component is disconnected, stop all audio.
   *
   */

  disconnectedCallback() {
    this.stop()
  }

  /**
   * When the component updates, change the fill of the progress bar.
   * This is because the fill colour is determined by a computed CSS
   * value set by the Web Component's theme. When the @prop theme changes and
   * the component updates, we have to update the fill with the new
   * computed CSS value.
   */
  componentDidUpdate() {
    if (this.svgOverlay) {
      this.changeFill()
    }
  }

  /**
   * Using this Lifecycle hook to handle backwards compatibility of component attribute
   */
  async componentWillLoad() {
    // The backward compatible behaviour used to be audio, alignment and text files outside assets
    // and only image files inside assets.
    // See version 0.1.0, where it only looks in assets/ for images, nothing else.
    // TO maintain backwards compatibility handle assets url
    //this.audio = this.urlTransform(this.audio)
    //this.alignment = this.urlTransform(this.alignment)
    //this.text = this.urlTransform(this.text)
    //this.cssUrl = this.urlTransform(this.cssUrl)
    // TO maintain backwards compatibility language code
    if (this.language.length < 3) {
      if (this.language.match("fr") != null) {
        this.language = "fra"
      } else {
        this.language = "eng"
      }
    }

    // Parse the text to be displayed
    this.parsed_text = await parseRAS(this.href)
    this.images = {}
    this.translations = {}
    for (const [i, page] of this.parsed_text.entries()) {
      if ('img' in page) {
        this.images[i] = page.img
      } else {
        this.images[i] = null
      }
    }
    // this.parsed_text.map((page, i) => page.img ? [i, page.img] : [i, null])
    this.assetsStatus.XML = this.parsed_text.length ? LOADED : ERROR_LOADING

  }

  /**
   * Lifecycle hook: after component loads, build the Sprite and parse the files necessary.
   * Then subscribe to the _reading$ Subject in order to update CSS styles when new element
   * is being read
   */
  componentDidLoad() {
    this.processed_alignment = extractAlignment(this.parsed_text)
    this.alignment_failed = (Object.keys(this.processed_alignment).length == 0)
    // load basic Howl
    this.audio_howl_sprites = new Howl({
      src: [this.audio],
      preload: false,
      // onloaderror: this.audioFailedToLoad.bind(this),
      // onload: this.audioLoaded.bind(this)

    })
    // Once loaded, get duration and build Sprite
    this.audio_howl_sprites.once('load', () => {
      this.processed_alignment['all'] = [0, this.audio_howl_sprites.duration() * 1000];
      this.duration = this.audio_howl_sprites.duration();
      this.audio_howl_sprites = this.buildSprite(this.audio, this.processed_alignment);
      // Once Sprites are built, subscribe to reading subject and update element class
      // when new distinct values are emitted
      this.reading$ = this.audio_howl_sprites._reading$.pipe(
        distinctUntilChanged()
      ).subscribe(el_tag => {
        // Only highlight when playing
        if (this.playing) {
          // Turn tag to query
          let query = this.tagToQuery(el_tag);
          // select the element with that tag
          let query_el: HTMLElement = this.el.shadowRoot.querySelector(query);
          // Remove all elements with reading class
          this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
          // Add reading to the selected el
          query_el.classList.add('reading')

          // Scroll horizontally (to different page) if needed
          let current_page = ReadAlongComponent._getSentenceContainerOfWord(query_el).parentElement.id

          if (current_page !== this.current_page) {
            if (this.current_page !== undefined) {
              this.scrollToPage(current_page)
            }
            this.current_page = current_page
          }

          //if the user has scrolled away from the from the current page bring them page
          if (query_el.getBoundingClientRect().left < 0 || this.el.shadowRoot.querySelector("#" + current_page).getBoundingClientRect().left !== 0) {
            this.scrollToPage(current_page)
          }

          // scroll vertically (through paragraph) if needed
          if (this.inPageContentOverflow(query_el)) {
            if (this.autoScroll) {
              query_el.scrollIntoView(false);
              this.scrollByHeight(query_el)
            }
          }// scroll horizontal (through paragraph) if needed
          if (this.inParagraphContentOverflow(query_el)) {
            if (this.autoScroll) {
              query_el.scrollIntoView(false);
              this.scrollByWidth(query_el)
            }
          }
        }
      })
      this.isLoaded = true;
      this.assetsStatus.AUDIO = LOADED;
    })
    this.audio_howl_sprites.load()
  }

  /**********
   *  LANG  *
   **********/

  /**
   * Any text used in the Web Component should be at least bilingual in English and French.
   * To add a new term, add a new key to the translations object. Then add 'eng' and 'fr' keys
   * and give the translations as values.
   *
   * @param word
   * @param lang
   */
  returnTranslation(word: string, lang?: InterfaceLanguage): string {
    if (lang === undefined) lang = this.language;
    let translations: { [message: string]: Translation } = {
      "speed": {
        "eng": "Playback Speed",
        "fra": "Vitesse de Lecture"
      },
      "re-align": {
        "eng": "Re-align with audio",
        "fra": "Réaligner avec l'audio"
      },
      "audio-error": {
        "eng": "Error: The audio file could not be loaded",
        "fra": "Erreur: le fichier audio n'a pas pu être chargé"
      },
      "text-error": {
        "eng": "Error: The text file could not be loaded",
        "fra": "Erreur: le fichier texte n'a pas pu être chargé"
      },
      "alignment-error": {
        "eng": "Error: No alignments were found",
        "fra": "Erreur: aucun alignement n'a été trouvé"
      },
      "loading": {
        "eng": "Loading...",
        "fra": "Chargement en cours"
      },
      "add-line": {
        "eng": "Add line",
        "fra": "Ajouter une ligne" 
      },
      "remove-line": {
        "eng": "Remove line",
        "fra": "Suprimer la ligne" 
      },
      "line-placeholder": {
        "eng": "Type your text here",
        "fra": "Écrivez votre texte ici" 
      }
    }
    if (translations[word])
      return translations[word][lang]
    return word;
  }

  /**********
   *  EDIT  *
   **********/


  addLine(sentence_element: Element){
    if (!this.hasTextTranslations) {
      this.hasTextTranslations = true
    }
    let newTranslation = {}
    
    newTranslation[sentence_element.id] = ""
    this.translations = {...this.translations, ...newTranslation}
  }

  removeLine(sentence_element: Element){
    
    let newTranslation = {}
    newTranslation[sentence_element.id] = null
    this.translations = {...this.translations, ...newTranslation}
  }

  updateTranslation(sentence_id: string, text: string) {
    this.translations[sentence_id] = text
  }

  async handleFiles(event: any, props) {
    // const reader = new FileReader()
    let imageURL = URL.createObjectURL(event)
    let pageIndex = this.parsed_text.map((page: Page) => page.id).indexOf(props.pageData.id)
    props.pageData.img = imageURL
    let newImage = {}
    newImage[pageIndex] = imageURL
    this.images = {...this.images, ...newImage}  // Using spread operator as advised https://stenciljs.com/docs/reactive-data#updating-an-object
  }

  deleteImage(props){
    let pageIndex = this.parsed_text.map((page: Page) => page.id).indexOf(props.pageData.id)
    delete props.pageData.img
    let newImage = {}
    newImage[pageIndex] = null
    this.images = {...this.images, ...newImage}  // Using spread operator as advised https://stenciljs.com/docs/reactive-data#updating-an-object
  }

  /**********
   * RENDER *
   **********/

  /**
   * The Guide element
   */
  Guide = (): Element =>
    <button class={'scroll-guide__container ripple ui-button theme--' + this.theme}
      onClick={() => this.hideGuideAndScroll()}>
      <span class={'scroll-guide__text theme--' + this.theme}>
        {this.returnTranslation('re-align', this.language)}
      </span>
    </button>

  /**
   * Render svg overlay
   */
  Overlay = (): Element => <object onClick={(e) => this.goToSeekFromProgress(e)} id='overlay__object'
    type='image/svg+xml' data={this.svgOverlay} />

  /**
   * Remove image at given page
   *
   * @param props
   */
  RemoveImg = (props: { pageData: Page }): Element => {
    return (<button data-cy="delete-button" aria-label="Delete"
    title="Delete image"
    onClick={() => this.deleteImage(props)}
    id="img-remover"
    class={"ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons">delete</i>
  </button>)
  }

  /**
   * Render image at path 'url' in assets folder.
   *
   * @param props
   */
  Img = (props: { url: string }): Element => {
    return (<div class={"image__container page__col__image theme--" + this.theme}>
      <img alt={"image"} class="image" src={this.urlTransform(props.url)} />
    </div>)
  }

  ImgPlaceHolder = (props: { pageData: Page }): Element => {
    return (<div class={"image__container page__col__image theme--" + this.theme}>
      <div class='drop-area'>
        <form class="my-form">
          <p class={"theme--" + this.theme}>Upload an image for this page with the file dialog below</p>
          <input type="file" class='fileElem' id={"fileElem--" + props.pageData.id} accept="image/*" onChange={($event: any) => this.handleFiles($event.target.files[0], props)} />
          <label class="button" htmlFor={"fileElem--" + props.pageData.id}>Select some files</label>
        </form>
      </div>

    </div>)
  }


  /**
   * Page Counter element
   *
   * @param props
   *
   * Shows currentPage / pgCount
   */
  PageCount = (props: { pgCount: number, currentPage: number }): Element =>
    <div class={"page__counter color--" + this.theme}>
      Page
      {' '}
      <span data-cy="page-count__current">{props.currentPage}</span>
      {' / '}
      <span data-cy="page-count__total">{props.pgCount}</span>
    </div>

  /**
   * Page element
   *
   * @param props
   *
   * Show 'Page' or vertically scrollable text content.
   * Text content on 'Page' breaks is separated horizontally.
   */
  Page = (props: { pageData: Page }): Element =>
    <div
      class={'page page__container page--multi animate-transition  theme--' + this.theme + " " + (props.pageData.attributes["class"] ? props.pageData.attributes["class"].value : "")}
      id={props.pageData['id']}>
      { /* Display the PageCount only if there's more than 1 page */
        this.parsed_text.length > 1 ? <this.PageCount pgCount={this.parsed_text.length}
          currentPage={this.parsed_text.indexOf(props.pageData) + 1} /> : null
      }
      <span id="image-container">
      {
        this.mode === "EDIT" && props.pageData.img ? <this.RemoveImg pageData={props.pageData}/> : null
      }
      { /* Display an Img if it exists on the page */
        props.pageData.img ? <this.Img url={props.pageData.img} /> : null
      }
      </span>
      {
        this.mode === "EDIT" && !props.pageData.img ? <this.ImgPlaceHolder pageData={props.pageData} /> : null
      }
      <div class={"page__col__text paragraph__container theme--" + this.theme}>
        { /* Here are the Paragraph children */
          props.pageData.paragraphs.map((paragraph: Element) => {

            return <this.Paragraph sentences={Array.from(paragraph.childNodes)} attributes={paragraph.attributes} />
          }
          )
        }
      </div>
    </div>

  /**
   * Paragraph element
   *
   * @param props
   *
   * A paragraph element with one or more sentences
   */
  Paragraph = (props: { sentences: Node[], attributes: NamedNodeMap }): Element =>
    <div
      class={'paragraph sentence__container theme--' + this.theme + " " + (props.attributes["class"] ? props.attributes["class"].value : "")}>
      {
        /* Here are the Sentence children */
        props.sentences.map((sentence: Element) =>
          (sentence.childNodes.length > 0) &&
          <this.Sentence sentenceData={sentence} />)
      }
    </div>

  /**
   * Sentence element
   *
   * @param props
   *
   * A sentence element with one or more words
   */
  Sentence = (props: { sentenceData: Element }): Element => {
    let words: ChildNode[] = Array.from(props.sentenceData.childNodes)
    let sentenceID: string = props.sentenceData.id
    if ((!this.hasTextTranslations) && props.sentenceData.hasAttribute('class')) {
      this.hasTextTranslations = /translation/.test(props.sentenceData.getAttribute('class'));
    }
    let nodeProps = {};
    if (props.sentenceData.hasAttribute("xml:lang")) {
      nodeProps['lang'] = props.sentenceData.getAttribute('xml:lang')
    }
    if (props.sentenceData.hasAttribute("lang")) {
      nodeProps['lang'] = props.sentenceData.getAttribute('lang')
    }

    return <div {...nodeProps}
      class={'sentence' + " " + props.sentenceData.getAttribute('class')}>
      {
        /* Here are the Word and NonWordText children */
        words.map((child: Element, c) => {

          if (child.nodeName === '#text') {
            return <this.NonWordText text={child.textContent} attributes={child.attributes}
              id={(props.sentenceData.hasAttribute('id') ? props.sentenceData.getAttribute('id') : "P") + 'text' + c} />
          } else if (child.nodeName === 'w') {
            return <this.Word text={child.textContent} id={child['id']} attributes={child.attributes} />
          } else if (child) {
            let cnodeProps = {};
            if (child.hasAttribute('xml:lang')) cnodeProps['lang'] = props.sentenceData.getAttribute('xml:lang')
            if (child.hasAttribute('lang')) cnodeProps['lang'] = props.sentenceData.getAttribute('lang')
            return <span {...cnodeProps} class={'sentence__text theme--' + this.theme + (' ' + child.className)}
              id={child.id ? child.id : 'text_' + c}>{child.textContent}</span>
          }
        })
      }
      {(() => {
       if (this.mode === 'EDIT') {
          if (sentenceID in this.translations && sentenceID in this.translations && this.translations[sentenceID] !== null) {
            return <span class="sentence__translation">
              <button data-cy="remove-translation-button" onClick={() => this.removeLine(props.sentenceData)}>{this.returnTranslation('remove-line', this.language)}</button>
              <p data-cy="translation-line" class="sentence__text" onInput={(e: any) => {this.updateTranslation(sentenceID, e.currentTarget.innerText)}} contentEditable data-placeholder={this.returnTranslation('line-placeholder', this.language)}></p>
              </span>
          } else {
            return <button data-cy="add-translation-button" class="sentence__translation" onClick={() => this.addLine(props.sentenceData)}>{this.returnTranslation('add-line', this.language)}</button>
          }
        }
       else {
          return null
       }
   })()
   }
    </div>
  }

  /**
   * A non-Word text element
   *
   * @param props
   *
   * This is an element that is a child to a Sentence element,
   * but cannot be clicked and is not a word. This is usually
   * inter-Word punctuation or other text.
   */
  NonWordText = (props: { text: string, id: string, attributes: NamedNodeMap }): Element => {
    let nodeProps = {};
    if (props.attributes && props.attributes['xml:lang']) nodeProps['lang'] = props.attributes['xml:lang'].value
    if (props.attributes && props.attributes['lang']) nodeProps['lang'] = props.attributes['lang'].value

    return <span {...nodeProps} class={'sentence__text theme--' + this.theme} id={props.id}>{props.text}</span>
  }


  /**
   * A Word text element
   *
   * @param props
   *
   * This is a clickable, audio-aligned Word element
   */
  Word = (props: { id: string, text: string, attributes: NamedNodeMap }): Element => {
    let nodeProps = {};
    if (props.attributes && props.attributes['xml:lang']) nodeProps['lang'] = props.attributes['xml:lang'].value
    if (props.attributes && props.attributes['lang']) nodeProps['lang'] = props.attributes['lang'].value

    return <span {...nodeProps}
      class={'sentence__word theme--' + this.theme + " " + (props && props.attributes["class"] ? props.attributes["class"].value : "")}
      id={props.id} onClick={(ev) => this.playSprite(ev)}>{props.text}</span>
  }
  /**
   * Render controls for ReadAlong
   */

  PlayControl = (): Element => <button data-cy="play-button" disabled={!this.isLoaded} aria-label="Play"
    title="Play audio recording"
    onClick={() => {
      this.playing ? this.pause() : this.play()
    }}
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons">{this.playing ? 'pause' : 'play_arrow'}</i>
  </button>

  ReplayControl = (): Element => <button data-cy="replay-button" disabled={!this.isLoaded} aria-label="Rewind"
    title="Replay audio recording"
    onClick={() => this.goBack(5)}
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons">replay_5</i>
  </button>

  StopControl = (): Element => <button data-cy="stop-button" disabled={!this.isLoaded} aria-label="Stop"
    title="Stop audio recording"
    onClick={() => this.stop()}
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons">stop</i>
  </button>

  PlaybackSpeedControl = (): Element => <div>
    <h5
      class={"control-panel__buttons__header color--" + this.theme}>{this.returnTranslation('speed', this.language)}</h5>
    <input type="range" min="75" max="125" value={this.playback_rate * 100} class="slider control-panel__control"
      id="myRange" onInput={(v) => this.changePlayback(v)} />
  </div>

  StyleControl = (): Element => <button aria-label="Change theme" onClick={() => this.changeTheme()}
    title="Change theme"
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons-outlined">style</i>
  </button>

  FullScreenControl = (): Element => <button aria-label="Full screen mode" onClick={() => this.toggleFullscreen()}
    title="Full screen mode"
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons" aria-label="Full screen mode">{this.fullscreen ? 'fullscreen_exit' : 'fullscreen'}</i>
  </button>

  TextTranslationDisplayControl = (): Element => <button data-cy="translation-toggle" aria-label="Toggle Translation"
    title="Toggle translation"
    onClick={() => this.toggleTextTranslation()}
    class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
    <i class="material-icons-outlined">subtitles</i>
  </button>

  ControlPanel = (): Element => <div data-cy="control-panel"
    class={"control-panel theme--" + this.theme + " background--" + this.theme}>
    <div class="control-panel__buttons--left">
      <this.PlayControl />
      <this.ReplayControl />
      <this.StopControl />
    </div>

    <div class="control-panel__buttons--center">
      <this.PlaybackSpeedControl />
    </div>

    <div class="control-panel__buttons--right">
      {this.hasTextTranslations && <this.TextTranslationDisplayControl />}
      <this.StyleControl />
      <this.FullScreenControl />
    </div>
  </div>


  /**
   * Render main component
   */
  render(): Element {
    return (
      <div id='read-along-container' class='read-along-container'>
        <h1 class="slot__header">
          <slot name="read-along-header" />
        </h1>
        <h3 class="slot__subheader">
          <slot name="read-along-subheader" />
        </h3>
        {
          this.assetsStatus.AUDIO &&
          <p data-cy="audio-error"
            class={"alert status-" + this.assetsStatus.AUDIO + (this.assetsStatus.AUDIO == LOADED ? ' fade' : '')}>
            <span class="material-icons-outlined">
                {this.assetsStatus.AUDIO == ERROR_LOADING
                ? 'error'
                : (this.assetsStatus.AUDIO > 0 ? 'done' : 'pending_actions')}
            </span>
            <span>{this.assetsStatus.AUDIO == ERROR_LOADING
                 ? this.returnTranslation('audio-error', this.language)
                 : (this.assetsStatus.XML > 0
                                           ? 'AUDIO'
                                           : this.returnTranslation('loading', this.language))}
            </span>
          </p>
        }

        {
          this.assetsStatus.XML &&
          <p data-cy="text-error"
            class={"alert status-" + this.assetsStatus.XML + (this.assetsStatus.XML == LOADED ? ' fade' : '')}>
            <span class="material-icons-outlined">
              {this.assetsStatus.XML == ERROR_LOADING
                  ? 'error'
                  : (this.assetsStatus.XML > 0 ? 'done' : 'pending_actions')}
            </span>
            <span>
              {this.assetsStatus.XML == ERROR_LOADING
              ? this.returnTranslation('text-error', this.language)
              : "XML"}
            </span>
          </p>
        }

        {
          this.alignment_failed && this.assetsStatus.XML !== ERROR_LOADING &&
          <p data-cy="alignment-error" class="alert status-2">
            <span class="material-icons-outlined">error</span>
            <span>
              {this.returnTranslation('alignment-error', this.language)}
            </span>
          </p>
        }
        <div data-cy="text-container" class={"pages__container theme--" + this.theme + " " + this.pageScrolling}>

          {this.showGuide ? <this.Guide /> : null}
          {this.assetsStatus.XML == LOADED && this.parsed_text.map((page) =>
            <this.Page pageData={page}>
            </this.Page>
          )}
          {this.isLoaded == false && <div class="loader" />}

        </div>
        {this.alignment_failed ||
          <div onClick={(e) => this.goToSeekFromProgress(e)} id='all' data-cy="progress-bar"
            class={"overlay__container theme--" + this.theme + " background--" + this.theme}>
            {this.svgOverlay ? <this.Overlay /> : null}
          </div>}
        {this.assetsStatus.AUDIO == LOADED && <this.ControlPanel />}

        {this.cssUrl && this.cssUrl.match(".css") != null && <link href={this.cssUrl} rel="stylesheet" />}
      </div>

    )
  }
}
