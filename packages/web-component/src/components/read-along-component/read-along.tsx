import { Howl } from "howler";
import { Subject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

import {
  Component,
  Element,
  h,
  Listen,
  Method,
  Prop,
  State,
} from "@stencil/core";

import {
  parseRAS,
  Sprite,
  extractPages,
  extractAlignment,
  isFileAvailable,
} from "../../utils/utils";
import {
  Alignment,
  Page,
  InterfaceLanguage,
  ReadAlongMode,
} from "../../index.d";
import { web_component as eng_strings } from "../../i18n/messages.eng.json";
import { web_component as fra_strings } from "../../i18n/messages.fra.json";
import { web_component as spa_strings } from "../../i18n/messages.spa.json";

const LOADING = 0;
const LOADED = 1;
const ERROR_PARSING = 2;
const ERROR_LOADING = 3;

interface ASSETS_STATUS {
  AUDIO: number;
  RAS: number;
}

@Component({
  tag: "read-along",
  styleUrl: "../../scss/styles.scss",
  shadow: true,
  assetsDirs: ["assets"],
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
  @Prop({ mutable: true, reflect: true }) theme: string = "light";

  /**
   * Language  of the interface. In 639-3 code.
   * Options are "eng" (English), "fra" (French) or "spa" (Spanish)
   */
  @Prop({ mutable: true, reflect: true }) language: InterfaceLanguage = "eng";

  /**
   * i18n strings dicts
   */
  i18nStrings = { eng: eng_strings, fra: fra_strings, spa: spa_strings };

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

  /**
   * Select whether scrolling between pages should be "smooth" (default nicely
   * animated, good for fast computers) or "auto" (choppy but much less compute
   * intensive)
   */
  @Prop() scrollBehaviour: "smooth" | "auto" = "smooth";

  /**
   * Show text translation  on at load time
   */
  @Prop() displayTranslation = true;

  /**
   * Control the range of the playback rate: allow speeds
   * from 100 - playback-rate-range to 100 + playback-rate-range.
   */
  @Prop() playbackRateRange: number = 15;

  /**
   * Auto Pause at end of every page
   */
  @Prop() autoPauseAtEndOfPage? = false;

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
  @State() hasLoaded: number = 0;
  showGuide: boolean = false;

  parsed_text;
  dropAreas;
  current_page;
  hasTextTranslations: boolean = false;
  @State() images: { [key: string]: string | null };
  @State() translations: { [key: string]: string | null };
  latestTranslation: string; // when a new translation line is added, this is populated with the added HTMLElement's ID which is queried and focused after the component re-renders
  assetsStatus: ASSETS_STATUS = {
    AUDIO: LOADING,
    RAS: LOADING,
  };
  alignment_failed: boolean = false;
  isScrolling: boolean = false;
  scrollTimer = null;

  handleScrollEvent() {
    this.isScrolling = true;
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      this.isScrolling = false;
    }, 125);
  }
  isAutoPaused: boolean = false;
  endOfPageTags: { [key: string]: number } = {};
  finalTaggedWord: string;
  /************
   *  LISTENERS  *
   ************/

  @Listen("wheel", { target: "window" })
  wheelHandler(event: MouseEvent): void {
    // only show guide if there is an actual highlighted element
    if (this.el.shadowRoot.querySelector(".reading")) {
      if (
        event["path"][0].classList.contains("sentence__word") ||
        event["path"][0].classList.contains("sentence__container") ||
        event["path"][0].classList.contains("sentence")
      ) {
        if (this.autoScroll) {
          let reading_el: HTMLElement =
            this.el.shadowRoot.querySelector(".reading");
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
    if (
      this.useAssetsFolder &&
      looksLikeRelativePath(path) &&
      !path.startsWith("blob")
    )
      return "assets/" + path;
    return path;

    function looksLikeRelativePath(path: string): boolean {
      return !/^(https?:[/][/]|assets[/]|data:)/.test(path);
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
      rate: this.playback_rate,
    });
  }

  /**
   * Add escape characters to query selector param
   * @param id
   */
  tagToQuery(id: string): string {
    id = id.replace(".", "\\.");
    id = id.replace("#", "\\#");
    return "#" + id;
  }

  /**
   * Return HTML element of word closest to second s
   *
   * @param s seconds
   */
  returnWordClosestTo(s: number): HTMLElement {
    let keys = Object.keys(this.processed_alignment);
    // remove 'all' sprite as it's not a word.
    keys.pop();
    for (let i = 1; i < keys.length; i++) {
      if (
        s * 1000 > this.processed_alignment[keys[i]][0] &&
        this.processed_alignment[keys[i + 1]] &&
        s * 1000 < this.processed_alignment[keys[i + 1]][0]
      ) {
        return this.el.shadowRoot.querySelector(this.tagToQuery(keys[i]));
      }
    }
  }

  /**
   * Return the file path given the asset_type
   */
  getPathFromAssetType(asset_type: string) {
    if (asset_type === "AUDIO") {
      return this.audio;
    } else if (asset_type === "RAS") {
      return this.href;
    } else {
      return "Asset Path Not Supported";
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
    let inputEl = ev.currentTarget as HTMLInputElement;
    this.playback_rate = parseInt(inputEl.value) / 100;
    this.audio_howl_sprites.sound.rate(this.playback_rate);
  }

  /**
   *  Go back s milliseconds
   *
   * @param s
   */

  goBack(s: number): void {
    this.autoScroll = false;
    if (this.play_id) {
      this.audio_howl_sprites.goBack(this.play_id, s);
    }
    setTimeout(() => (this.autoScroll = true), 100);
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
    seek = seek / 1000;
    this.audio_howl_sprites.goTo(this.play_id, seek);
    setTimeout(() => (this.autoScroll = true), 100);
  }

  /**
   * Go to seek from id
   *
   * @param ev
   */
  goToSeekAtEl(ev: MouseEvent): string {
    let el = ev.currentTarget as HTMLElement;
    let tag = el.id;
    let seek = this.processed_alignment[tag][0];
    this.goTo(seek);
    return tag;
  }

  /**
   * Go to seek from progress bar
   */
  goToSeekFromProgress(ev: MouseEvent): void {
    let el = ev.currentTarget as HTMLElement;
    let client_rect = el.getBoundingClientRect();
    // get offset of clicked element
    let offset = client_rect.left;
    // get width of clicked element
    let width = client_rect.width;
    // get click point
    let click = ev.pageX - offset;
    // get seek in milliseconds
    let seek = (click / width) * this.duration * 1000;
    this.goTo(seek);
  }

  /**
   * Pause audio.
   */
  pause(): void {
    this.playing = false;
    this.audio_howl_sprites.pause();
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
      this.play_id = this.audio_howl_sprites.play(this.play_id);
    } else {
      // else, start a new play
      this.play_id = this.audio_howl_sprites.play("all");
    }
    // animate the progress bar
    this.animateProgress();
  }

  /**
   * Seek to an element with id 'id', then play it
   *
   * @param ev
   */
  playSprite(ev: MouseEvent): void {
    let tag = this.goToSeekAtEl(ev);
    if (!this.playing) {
      this.audio_howl_sprites.play(tag);
    }
  }

  /**
   * Stop the sound and remove all active reading styling
   */
  stop(): void {
    this.playing = false;
    this.audio_howl_sprites.stop();
    this.el.shadowRoot
      .querySelectorAll(".reading")
      .forEach((x) => x.classList.remove("reading"));

    if (!this.autoScroll) {
      this.autoScroll = true;
      this.showGuide = false;
    }
  }

  /**
   * toggle the visibility of translation text
   */
  toggleTextTranslation(): void {
    this.el.shadowRoot
      .querySelectorAll(".translation")
      .forEach((translation) => translation.classList.toggle("invisible"));
    this.el.shadowRoot
      .querySelectorAll(".sentence__translation")
      .forEach((translation) => translation.classList.toggle("invisible"));
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
    this.el.shadowRoot
      .querySelectorAll(".reading")
      .forEach((x) => x.classList.remove("reading"));
    el.classList.add("reading");
  }

  /**
   * Animate the progress through the overlay svg
   */
  animateProgressWithOverlay(): void {
    // select svg container
    let wave__container: any =
      this.el.shadowRoot.querySelector("#overlay__object");
    // use svg container to grab fill and trail
    let fill: HTMLElement =
      wave__container.contentDocument.querySelector("#progress-fill");
    let trail =
      wave__container.contentDocument.querySelector("#progress-trail");
    let base = wave__container.contentDocument.querySelector("#progress-base");
    fill.classList.add("stop-color--" + this.theme);
    base.classList.add("stop-color--" + this.theme);

    // push them to array to be changed in step()
    this.audio_howl_sprites.sounds.push(fill);
    this.audio_howl_sprites.sounds.push(trail);
    // When this sound is finished, remove the progress element.
    this.audio_howl_sprites.sound.once(
      "end",
      () => {
        this.audio_howl_sprites.sounds.forEach((x) => {
          x.setAttribute("offset", "0%");
        });
        this.el.shadowRoot
          .querySelectorAll(".reading")
          .forEach((x) => x.classList.remove("reading"));
        this.playing = false;
        // }
      },
      this.play_id
    );
  }

  /**
   * Animate the progress if no svg overlay is provided
   *
   * @param play_id
   * @param tag
   */
  animateProgressDefault(play_id: number, tag: string): void {
    let elm = document.createElement("div");
    elm.className = "progress theme--" + this.theme;
    elm.id = play_id.toString();
    elm.dataset.sprite = tag;
    let query = this.tagToQuery(tag);
    this.el.shadowRoot.querySelector(query).appendChild(elm);
    this.audio_howl_sprites.sounds.push(elm);

    // When this sound is finished, remove the progress element.
    this.audio_howl_sprites.sound.once(
      "end",
      () => {
        // this.audio_howl_sprites = [];
        this.el.shadowRoot
          .querySelectorAll(".reading")
          .forEach((x) => x.classList.remove("reading"));
        this.playing = false;
        // }
      },
      this.play_id
    );
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
      this.animateProgressDefault(play_id, "all");
    }
  }

  /**
   * Change fill colour to match theme
   */
  changeFill(): void {
    // Get theme contrast from the computed color of a word
    let contrast_el = this.el.shadowRoot.querySelector(".sentence__word");
    let contrast = window.getComputedStyle(contrast_el).color;

    // select svg container
    let wave__container: any =
      this.el.shadowRoot.querySelector("#overlay__object");

    // use svg container to grab fill and trail
    let fill = wave__container.contentDocument.querySelector("#progress-fill");
    let base = wave__container.contentDocument.querySelector("#progress-base");

    // select polygon
    let polygon = wave__container.contentDocument.querySelector("#polygon");
    polygon.setAttribute("stroke", contrast);

    base.setAttribute("stop-color", contrast);
    fill.setAttribute("stop-color", contrast);
  }

  /**
   * Get Images
   */
  @Method()
  async getImages(): Promise<object> {
    return this.images;
  }

  /**
   * Get Translations
   */
  @Method()
  async getTranslations(): Promise<object> {
    return this.translations;
  }

  /**
   * Change theme
   */
  @Method()
  async changeTheme(): Promise<void> {
    if (this.theme === "light") {
      this.theme = "dark";
    } else {
      this.theme = "light";
    }
  }

  /**
   * Return the Sentence Container of Word
   * Currently the 3rd parent up the tree node
   * @param element
   * @private
   */
  private static _getSentenceContainerOfWord(
    element: HTMLElement
  ): HTMLElement {
    return element.parentElement.parentElement.parentElement;
  }

  /**
   * Make Fullscreen
   */
  private toggleFullscreen(): void {
    if (!this.fullscreen) {
      let elem: any = this.el.shadowRoot.getElementById("read-along-container");
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
      this.el.shadowRoot
        .getElementById("read-along-container")
        .classList.add("read-along-container--fullscreen");
    } else {
      let document: any = this.el.ownerDocument;
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        document.msExitFullscreen();
      }
      this.el.shadowRoot
        .getElementById("read-along-container")
        .classList.remove("read-along-container--fullscreen");
    }
    this.fullscreen = !this.fullscreen;
  }

  /*************
   * SCROLLING *
   *************/

  hideGuideAndScroll(): void {
    let reading_el: HTMLElement = this.el.shadowRoot.querySelector(".reading");
    // observe when element is scrolled to, then remove the scroll guide and unobserve
    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true;
        }, 100);
        intersectionObserver.unobserve(reading_el);
      }
    });
    intersectionObserver.observe(reading_el);
    this.scrollTo(reading_el);
  }

  //for when you visually align content
  inParagraphContentOverflow(element: HTMLElement): boolean {
    let para_el = ReadAlongComponent._getSentenceContainerOfWord(element);
    let para_rect = para_el.getBoundingClientRect();
    let el_rect = element.getBoundingClientRect();

    // element being read is left of the words being viewed
    let inOverflowLeft = el_rect.right < para_rect.left;
    // element being read is right of the words being viewed
    let inOverflowRight = el_rect.right > para_rect.right;

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true;
        }, 100);
        intersectionObserver.unobserve(element);
      }
    });
    intersectionObserver.observe(element);
    // if not in overflow, return false
    return inOverflowLeft || inOverflowRight;
  }

  inPageContentOverflow(element: HTMLElement): boolean {
    let page_el = this.el.shadowRoot.querySelector("#" + this.current_page);
    let page_rect = page_el.getBoundingClientRect();
    let el_rect = element.getBoundingClientRect();

    // element being read is below/ahead of the words being viewed
    let inOverflowBelow =
      el_rect.top + el_rect.height > page_rect.top + page_rect.height;
    // element being read is above/behind of the words being viewed
    let inOverflowAbove = el_rect.top + el_rect.height < 0;

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true;
        }, 100);
        intersectionObserver.unobserve(element);
      }
    });
    intersectionObserver.observe(element);

    // if not in overflow, return false
    return inOverflowAbove || inOverflowBelow;
  }

  inPage(element: HTMLElement): boolean {
    let sent_el = ReadAlongComponent._getSentenceContainerOfWord(element);
    let sent_rect = sent_el.getBoundingClientRect();
    let el_rect = element.getBoundingClientRect();
    // element being read is below/ahead of the words being viewed
    let inOverflowBelow =
      el_rect.top + el_rect.height > sent_rect.top + sent_rect.height;
    // element being read is above/behind of the words being viewed
    let inOverflowAbove = el_rect.top + el_rect.height < 0;

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true;
        }, 100);
        intersectionObserver.unobserve(element);
      }
    });
    intersectionObserver.observe(element);

    // if not in overflow, return false
    return inOverflowAbove || inOverflowBelow;
  }

  scrollToPage(pg_id: string): void {
    let page_container: any =
      this.el.shadowRoot.querySelector(".pages__container");
    let next_page: any = this.el.shadowRoot.querySelector("#" + pg_id);
    page_container.scrollBy({
      top:
        this.pageScrolling.match("vertical") != null
          ? next_page.offsetTop - page_container.scrollTop
          : 0,
      left:
        this.pageScrolling.match("vertical") != null
          ? 0
          : next_page.offsetLeft - page_container.scrollLeft,
      behavior: this.scrollBehaviour,
    });
    next_page.scrollTo(0, 0); //reset to top of the page
  }

  scrollByHeight(el: HTMLElement): void {
    let sent_container = ReadAlongComponent._getSentenceContainerOfWord(el); //get the direct parent sentence container

    let anchor = el.parentElement.getBoundingClientRect();

    let intersectionObserver = new IntersectionObserver(
      (entries) => {
        let [entry] = entries;
        if (entry.isIntersecting) {
          intersectionObserver.unobserve(el);
        } else {
          sent_container.scrollTo({
            top: sent_container.getBoundingClientRect().height - anchor.height, // negative value
            // acceptable
            left: 0,
            behavior: this.scrollBehaviour,
          });
        }
      },
      {
        root: sent_container,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );
    intersectionObserver.observe(el);
  }

  //scrolling within the visually aligned paragraph
  scrollByWidth(el: HTMLElement): void {
    let sent_container = ReadAlongComponent._getSentenceContainerOfWord(el); //get the direct parent sentence container

    let anchor = el.getBoundingClientRect();
    sent_container.scrollTo({
      left: anchor.left - 10, // negative value acceptable
      top: 0,
      behavior: this.scrollBehaviour,
    });
  }

  scrollTo(el: HTMLElement): void {
    el.scrollIntoView({
      behavior: this.scrollBehaviour,
    });
  }

  /*************
   * LIFECYCLE *
   *************/

  /**
   * When the component is disconnected, stop all audio.
   *
   */

  disconnectedCallback() {
    this.stop();
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
      this.changeFill();
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
        this.language = "fra";
      } else if (this.language.match("es") !== null) {
        this.language = "spa";
      } else {
        this.language = "eng";
      }
    }

    // Make sure scroll-behaviour is valid
    if (this.scrollBehaviour !== "smooth" && this.scrollBehaviour !== "auto") {
      console.log("Invalid scroll-behaviour value, using default (smooth)");
      this.scrollBehaviour = "smooth";
    }

    // Make sure playback-rate-range is valid
    if (
      isNaN(this.playbackRateRange) ||
      this.playbackRateRange < 0 ||
      this.playbackRateRange > 99
    ) {
      console.log("Invalid playback-rate-range value, using default (15).");
      this.playbackRateRange = 15;
    }

    // TODO: if parseRAS has an error, we need ERROR_PARSING
    // Parse the text to be displayed
    const text = this.el.querySelector("read-along > text");
    if (text) this.parsed_text = extractPages(text);
    else this.parsed_text = await parseRAS(this.href);
    if (this.parsed_text === null) {
      this.parsed_text = [];
      this.assetsStatus.RAS = ERROR_LOADING;
    } else if (this.parsed_text.length === 0) {
      this.assetsStatus.RAS = ERROR_PARSING;
    } else {
      this.images = {};
      this.translations = {};
      for (const [i, page] of this.parsed_text.entries()) {
        if ("img" in page) {
          var imageURL = this.urlTransform(page.img);
          this.images[i] = this.urlTransform(page.img);
          if (/^(https?:[/]|assets)[/]\b/.test(imageURL)) {
            let isAvailable = await isFileAvailable(imageURL);
            if (!isAvailable) {
              this.images[i] = null;
            }
          }
        } else {
          this.images[i] = null;
        }
        //get the ids for the last word on each the page
        if ("paragraphs" in page) {
          try {
            const paragraphs = (page as Page).paragraphs;
            const sentence =
              paragraphs[paragraphs.length - 1].querySelector("s:last-of-type");
            const word = sentence.querySelector("w:last-of-type");
            this.endOfPageTags[word.id] = parseFloat(word.getAttribute("dur"));
            this.finalTaggedWord = word.id;
          } catch (err) {}
        }
      }
      // this.parsed_text.map((page, i) => page.img ? [i, page.img] : [i, null])

      this.assetsStatus.RAS = LOADED;
    }
    this.hasLoaded += 1;
  }

  /**
   * Lifecycle hook: after component loads, build the Sprite and parse the files necessary.
   * Then subscribe to the _reading$ Subject in order to update CSS styles when new element
   * is being read
   */
  componentDidLoad() {
    const bcSansFontCssUrl =
      "https://unpkg.com/@bcgov/bc-sans@1.0.1/css/BCSans.css";
    const iconsFontCssUrl =
      "https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined&display=swap";
    let iconElement = document.querySelector(`link[href="${iconsFontCssUrl}"]`);
    let fontElement = document.querySelector(
      `link[href="${bcSansFontCssUrl}"]`
    );

    // Only inject the element if it's not yet present
    if (!iconElement) {
      iconElement = document.createElement("link");
      iconElement.setAttribute("rel", "stylesheet");
      iconElement.setAttribute("href", iconsFontCssUrl);
      document.head.appendChild(iconElement);
    }
    if (!fontElement) {
      fontElement = document.createElement("link");
      fontElement.setAttribute("rel", "stylesheet");
      fontElement.setAttribute("href", bcSansFontCssUrl);
      document.head.appendChild(fontElement);
    }
    this.processed_alignment = extractAlignment(this.parsed_text);
    this.alignment_failed = Object.keys(this.processed_alignment).length == 0;
    // load basic Howl
    this.audio_howl_sprites = new Howl({
      src: [this.audio],
      preload: false,
    });
    // Once loaded, get duration and build Sprite
    this.audio_howl_sprites.once("load", () => {
      this.processed_alignment["all"] = [
        0,
        this.audio_howl_sprites.duration() * 1000,
      ];
      this.duration = this.audio_howl_sprites.duration();
      this.audio_howl_sprites = this.buildSprite(
        this.audio,
        this.processed_alignment
      );
      // Once Sprites are built, subscribe to reading subject and update element class
      // when new distinct values are emitted
      this.reading$ = this.audio_howl_sprites._reading$
        .pipe(distinctUntilChanged())
        .subscribe((el_tag) => {
          // Only highlight when playing
          if (this.playing) {
            //if auto pause is active and not on last word of the read along pause the audio
            if (
              this.autoPauseAtEndOfPage &&
              el_tag in this.endOfPageTags &&
              this.finalTaggedWord !== el_tag
            ) {
              //wait for the audio of the last word
              if (!this.isAutoPaused)
                setTimeout(
                  () => this.pause(),
                  this.endOfPageTags[el_tag] * 1000 - 150
                );
              this.isAutoPaused = !this.isAutoPaused;
            }
            // Turn tag to query
            let query = this.tagToQuery(el_tag);
            // select the element with that tag
            let query_el: HTMLElement = this.el.shadowRoot.querySelector(query);
            // Remove all elements with reading class
            this.el.shadowRoot
              .querySelectorAll(".reading")
              .forEach((x) => x.classList.remove("reading"));
            // Add reading to the selected el
            query_el.classList.add("reading");

            // Scroll horizontally (to different page) if needed
            let current_page =
              ReadAlongComponent._getSentenceContainerOfWord(query_el)
                .parentElement.id;

            if (current_page !== this.current_page) {
              if (this.current_page !== undefined && !this.isScrolling) {
                this.scrollToPage(current_page);
              }
              this.current_page = current_page;
            }
            const leftEdge =
              Math.ceil(
                this.el.shadowRoot
                  .querySelector(".pages__container")
                  .getBoundingClientRect().left
              ) + 1;
            const pageLeftEdge = Math.ceil(
              this.el.shadowRoot
                .querySelector("#" + this.current_page)
                .getBoundingClientRect().left
            );

            //if the user has scrolled away from the from the current page bring them page
            if (
              query_el.getBoundingClientRect().left < 0 ||
              pageLeftEdge !== leftEdge
            ) {
              if (!this.isScrolling) this.scrollToPage(current_page);
            }

            // scroll vertically (through paragraph) if needed
            if (this.inPageContentOverflow(query_el)) {
              if (this.autoScroll) {
                query_el.scrollIntoView(false);
                if (!this.isScrolling) this.scrollByHeight(query_el);
              }
            } // scroll horizontal (through paragraph) if needed
            if (this.inParagraphContentOverflow(query_el)) {
              if (this.autoScroll) {
                query_el.scrollIntoView(false);
                if (!this.isScrolling) this.scrollByWidth(query_el);
              }
            }
          }
        });
      this.hasLoaded += 1;
      this.assetsStatus.AUDIO = LOADED;
    });
    // Handle load errors
    this.audio_howl_sprites.once("loaderror", () => {
      this.hasLoaded += 1;
      this.assetsStatus.AUDIO = ERROR_LOADING;
    });
    this.audio_howl_sprites.load();
  }

  componentDidRender(): void {
    //if creator does not want the translation to show at load time
    if (
      !this.displayTranslation &&
      this.parsed_text &&
      this.parsed_text.length > 0
    ) {
      this.toggleTextTranslation();
      this.displayTranslation = true;
    }

    if (this.latestTranslation) {
      // Add focus to the latest translation line that was added
      let newLine: HTMLElement = this.el.shadowRoot.querySelector(
        this.latestTranslation
      );
      newLine.focus();
      this.latestTranslation = "";
    }
  }

  /**********
   *  LANG  *
   **********/

  /**
   * Helper function for getI18nString()
   * @param key  the key of the string to lookup
   * @returns the requested string found i18n/messages.{this.language}.json
   */
  getRawI18nString(key: string): string {
    if (
      this.i18nStrings[this.language] &&
      this.i18nStrings[this.language][key]
    ) {
      return this.i18nStrings[this.language][key];
    } else if (this.i18nStrings.eng[key]) {
      // Fallback to English if the string does not exist for this.language
      return this.i18nStrings.eng[key];
    } else {
      // Last fallback in case it's not found anywhere, because we never want to just fail
      return key;
    }
  }

  /**
   * Any text used in the Web Component should be at least bilingual in English and French.
   * To add a new term, add a new key to each messages.*.json file in ../../i18n
   * and give the translations as values.
   *
   * Subsitution semantics: given substitution = { "STR1": "value1", "STR2": "value2" },
   * the text "foo <STR1> bar <STR2> baz" will replaced by "foo value1 bar value2 baz".
   *
   * @param key  short name for the text to fetch
   * @param substitutions  optional list of subtitutions to perform
   * @returns  the string in language this.language for key
   */
  getI18nString(
    key: string,
    substitutions: { readonly [index: string]: string } = {}
  ): string {
    let result: string = this.getRawI18nString(key);
    for (const [sub_key, value] of Object.entries(substitutions)) {
      result = result.replace("<" + sub_key + ">", value);
    }
    return result;
  }

  /**********
   *  EDIT  *
   **********/

  addLine(sentence_element: Element) {
    if (!this.hasTextTranslations) {
      this.hasTextTranslations = true;
    }
    let newTranslation = {};

    newTranslation[sentence_element.id] = "";
    this.translations = { ...this.translations, ...newTranslation };
    this.latestTranslation = "#" + sentence_element.id + "translation";
  }

  removeLine(sentence_element: Element) {
    let newTranslation = {};
    newTranslation[sentence_element.id] = null;
    this.translations = { ...this.translations, ...newTranslation };
  }

  updateTranslation(sentence_id: string, text: string) {
    this.translations[sentence_id] = text;
  }

  async handleFiles(event: any, pageIndex: number) {
    // const reader = new FileReader()
    let imageURL = URL.createObjectURL(event);
    let newImage = {};
    newImage[pageIndex] = imageURL;
    this.images = { ...this.images, ...newImage }; // Using spread operator as advised https://stenciljs.com/docs/reactive-data#updating-an-object
  }

  deleteImage(pageIndex: number) {
    let newImage = {};
    newImage[pageIndex] = null;
    this.images = { ...this.images, ...newImage }; // Using spread operator as advised https://stenciljs.com/docs/reactive-data#updating-an-object
  }

  /**********
   * RENDER *
   **********/

  /**
   * The Guide element
   */
  Guide = (): Element => (
    <button
      class={"scroll-guide__container ripple ui-button theme--" + this.theme}
      onClick={() => this.hideGuideAndScroll()}
    >
      <span class={"scroll-guide__text theme--" + this.theme}>
        {this.getI18nString("re-align")}
      </span>
    </button>
  );

  /**
   * Render svg overlay
   */
  Overlay = (): Element => (
    <object
      onClick={(e) => this.goToSeekFromProgress(e)}
      id="overlay__object"
      type="image/svg+xml"
      data={this.svgOverlay}
    />
  );

  /**
   * Remove image at given page
   *
   * @param props
   */
  RemoveImg = (props: { pageIndex: number }): Element => {
    return (
      <button
        data-cy="delete-button"
        aria-label="Delete"
        title="Delete image"
        onClick={() => this.deleteImage(props.pageIndex)}
        id="img-remover"
        class={"ripple theme--" + this.theme + " background--" + this.theme}
      >
        <i class="material-icons">delete</i>
      </button>
    );
  };

  /**
   * Render image at path 'url' in assets folder.
   *
   * @param props
   */
  Img = (props: { imgURL: string }): Element => {
    return (
      <div class={"image__container page__col__image theme--" + this.theme}>
        <img alt={"image"} class="image" src={props.imgURL} />
      </div>
    );
  };

  ImgPlaceHolder = (props: { pageID: string; pageIndex: number }): Element => {
    return (
      <div class={"image__container page__col__image theme--" + this.theme}>
        <div class="drop-area">
          <form class="my-form">
            <p class={"theme--" + this.theme}>
              {this.getI18nString("upload-image")}
            </p>
            <input
              type="file"
              class="fileElem"
              id={"fileElem--" + props.pageID}
              accept="image/*"
              onChange={($event: any) =>
                this.handleFiles($event.target.files[0], props.pageIndex)
              }
            />
            <label class="button" htmlFor={"fileElem--" + props.pageID}>
              {this.getI18nString("choose-file")}
            </label>
          </form>
        </div>
      </div>
    );
  };

  /**
   * Page Counter element
   *
   * @param props
   *
   * Shows currentPage / pgCount
   */
  PageCount = (props: { pgCount: number; currentPage: number }): Element => (
    <div class={"page__counter color--" + this.theme}>
      {this.getI18nString("page")}{" "}
      <span data-cy="page-count__current">{props.currentPage}</span>
      {" / "}
      <span data-cy="page-count__total">{props.pgCount}</span>
    </div>
  );

  ImgContainer = (props: { pageIndex: number; pageID: string }): Element => (
    <div class="image__container">
      <span id="image-container">
        {this.mode === "EDIT" &&
        props.pageIndex in this.images &&
        this.images[props.pageIndex] !== null ? (
          <this.RemoveImg pageIndex={props.pageIndex} />
        ) : null}
        {
          /* Display an Img if it exists on the page */
          props.pageIndex in this.images &&
          this.images[props.pageIndex] !== null ? (
            <this.Img imgURL={this.images[props.pageIndex]} />
          ) : null
        }
      </span>
      {this.mode === "EDIT" &&
      !(
        props.pageIndex in this.images && this.images[props.pageIndex] !== null
      ) ? (
        <this.ImgPlaceHolder
          pageID={props.pageID}
          pageIndex={props.pageIndex}
        />
      ) : null}
    </div>
  );

  /**
   * Page element
   *
   * @param props
   *
   * Show 'Page' or vertically scrollable text content.
   * Text content on 'Page' breaks is separated horizontally.
   */
  Page = (props: { pageData: Page }): Element => (
    <div
      class={
        "page page__container page--multi animate-transition  theme--" +
        this.theme +
        " " +
        (props.pageData.attributes["class"]
          ? props.pageData.attributes["class"].value
          : "")
      }
      id={props.pageData["id"]}
    >
      {
        /* Display the PageCount only if there's more than 1 page */
        this.parsed_text.length > 1 ? (
          <this.PageCount
            pgCount={this.parsed_text.length}
            currentPage={this.parsed_text.indexOf(props.pageData) + 1}
          />
        ) : null
      }
      <this.ImgContainer
        pageID={props.pageData.id}
        pageIndex={this.parsed_text.indexOf(props.pageData)}
      ></this.ImgContainer>
      <div class={"page__col__text paragraph__container theme--" + this.theme}>
        {
          /* Here are the Paragraph children */
          props.pageData.paragraphs.map((paragraph: Element) => {
            return (
              <this.Paragraph
                sentences={Array.from(paragraph.childNodes)}
                attributes={paragraph.attributes}
              />
            );
          })
        }
      </div>
    </div>
  );

  /**
   * Paragraph element
   *
   * @param props
   *
   * A paragraph element with one or more sentences
   */
  Paragraph = (props: {
    sentences: Node[];
    attributes: NamedNodeMap;
  }): Element => (
    <div
      class={
        "paragraph sentence__container theme--" +
        this.theme +
        " " +
        (props.attributes["class"] ? props.attributes["class"].value : "")
      }
    >
      {
        /* Here are the Sentence children */
        props.sentences.map(
          (sentence: Element) =>
            sentence.childNodes.length > 0 && (
              <this.Sentence sentenceData={sentence} />
            )
        )
      }
    </div>
  );

  /**
   * Sentence element
   *
   * @param props
   *
   * A sentence element with one or more words
   */
  Sentence = (props: { sentenceData: Element }): Element => {
    let words: ChildNode[] = Array.from(props.sentenceData.childNodes);
    let sentenceID: string = props.sentenceData.id;
    if (!this.hasTextTranslations && props.sentenceData.hasAttribute("class")) {
      this.hasTextTranslations = /translation/.test(
        props.sentenceData.getAttribute("class")
      );
    }
    let nodeProps = {};
    if (props.sentenceData.hasAttribute("xml:lang")) {
      nodeProps["lang"] = props.sentenceData.getAttribute("xml:lang");
    }
    if (props.sentenceData.hasAttribute("lang")) {
      nodeProps["lang"] = props.sentenceData.getAttribute("lang");
    }

    return (
      <div
        {...nodeProps}
        class={
          "sentence" +
          " " +
          (props.sentenceData.hasAttribute("class")
            ? props.sentenceData.getAttribute("class")
            : "")
        }
      >
        {
          /* Here are the Word and NonWordText children */
          words.map((child: Element, c) => {
            if (child.nodeName === "#text") {
              return (
                <this.NonWordText
                  text={child.textContent}
                  attributes={child.attributes}
                  id={
                    (props.sentenceData.hasAttribute("id")
                      ? props.sentenceData.getAttribute("id")
                      : "P") +
                    "text" +
                    c
                  }
                />
              );
            } else if (child.nodeName === "w" || child.nodeName === "W") {
              /* It may be uppercase for embedded markup, because in
                   that case it has been parsed as "HTML".  See
                   https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeName */
              return (
                <this.Word
                  text={child.textContent}
                  id={child["id"]}
                  attributes={child.attributes}
                />
              );
            } else if (child) {
              let cnodeProps = {};
              if (child.hasAttribute("xml:lang"))
                cnodeProps["lang"] =
                  props.sentenceData.getAttribute("xml:lang");
              if (child.hasAttribute("lang"))
                cnodeProps["lang"] = props.sentenceData.getAttribute("lang");
              return (
                <span
                  {...cnodeProps}
                  class={
                    "sentence__text theme--" +
                    this.theme +
                    (" " + child.className)
                  }
                  id={child.id ? child.id : "text_" + c}
                >
                  {child.textContent}
                </span>
              );
            }
          })
        }
        {(() => {
          if (
            this.mode === "EDIT" &&
            !/translation/.test(props.sentenceData.getAttribute("class"))
          ) {
            if (
              sentenceID in this.translations &&
              sentenceID in this.translations &&
              this.translations[sentenceID] !== null
            ) {
              return (
                <span class="sentence__translation">
                  <button
                    title="Remove translation"
                    aria-label="Remove translation"
                    data-cy="remove-translation-button"
                    onClick={() => this.removeLine(props.sentenceData)}
                    class="sentence__translation__button remove"
                  >
                    <i class="material-icons">remove</i>
                  </button>
                  <p
                    id={sentenceID + "translation"}
                    data-cy="translation-line"
                    class="sentence__text editable__translation"
                    onInput={(e: any) => {
                      this.updateTranslation(
                        sentenceID,
                        e.currentTarget.innerText
                      );
                    }}
                    contentEditable
                    onKeyDown={(event) => {
                      if (event.key == "Enter") event.preventDefault();
                    }}
                    data-placeholder={this.getI18nString("line-placeholder")}
                  ></p>
                </span>
              );
            } else {
              return (
                <button
                  title={this.getI18nString("add-translation")}
                  aria-label="Add translation"
                  data-cy="add-translation-button"
                  class="sentence__translation sentence__translation__button"
                  onClick={() => this.addLine(props.sentenceData)}
                >
                  <i class="material-icons">add</i>
                </button>
              );
            }
          } else {
            return null;
          }
        })()}
      </div>
    );
  };

  /**
   * A non-Word text element
   *
   * @param props
   *
   * This is an element that is a child to a Sentence element,
   * but cannot be clicked and is not a word. This is usually
   * inter-Word punctuation or other text.
   */
  NonWordText = (props: {
    text: string;
    id: string;
    attributes: NamedNodeMap;
  }): Element => {
    let nodeProps = {};
    if (props.attributes && props.attributes["xml:lang"])
      nodeProps["lang"] = props.attributes["xml:lang"].value;
    if (props.attributes && props.attributes["lang"])
      nodeProps["lang"] = props.attributes["lang"].value;

    return (
      <span
        {...nodeProps}
        class={"sentence__text theme--" + this.theme}
        id={props.id}
      >
        {props.text}
      </span>
    );
  };

  /**
   * A Word text element
   *
   * @param props
   *
   * This is a clickable, audio-aligned Word element
   */
  Word = (props: {
    id: string;
    text: string;
    attributes: NamedNodeMap;
  }): Element => {
    let nodeProps = {};
    if (props.attributes && props.attributes["xml:lang"])
      nodeProps["lang"] = props.attributes["xml:lang"].value;
    if (props.attributes && props.attributes["lang"])
      nodeProps["lang"] = props.attributes["lang"].value;

    return (
      <span
        {...nodeProps}
        class={
          "sentence__word theme--" +
          this.theme +
          " " +
          (props && props.attributes["class"]
            ? props.attributes["class"].value
            : "")
        }
        id={props.id}
        onClick={(ev) => this.playSprite(ev)}
      >
        {props.text}
      </span>
    );
  };
  /**
   * Render controls for ReadAlong
   */

  PlayControl = (): Element => (
    <button
      data-cy="play-button"
      disabled={this.hasLoaded < 2}
      aria-label="Play"
      title={this.getI18nString("play-tooltip")}
      onClick={() => {
        this.playing ? this.pause() : this.play();
      }}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons">{this.playing ? "pause" : "play_arrow"}</i>
    </button>
  );

  ReplayControl = (): Element => (
    <button
      data-cy="replay-button"
      disabled={this.hasLoaded < 2}
      aria-label="Rewind"
      title={this.getI18nString("rewind-tooltip")}
      onClick={() => this.goBack(5)}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons">replay_5</i>
    </button>
  );

  StopControl = (): Element => (
    <button
      data-cy="stop-button"
      disabled={this.hasLoaded < 2}
      aria-label="Stop"
      title={this.getI18nString("stop-tooltip")}
      onClick={() => this.stop()}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons">stop</i>
    </button>
  );

  PlaybackSpeedControl = (): Element => (
    <div>
      <h5
        class={"control-panel__buttons__header color--" + this.theme}
        id="speed-slider-label"
      >
        {this.getI18nString("speed")}
      </h5>
      <input
        type="range"
        min={100 - this.playbackRateRange}
        max={100 + this.playbackRateRange}
        value={this.playback_rate * 100}
        class="slider control-panel__control"
        id="myRange"
        aria-labelledby="speed-slider-label"
        onInput={(v) => {
          console.log("v", v);
          this.changePlayback(v);
        }}
      />
    </div>
  );

  StyleControl = (): Element => (
    <button
      aria-label="Change theme"
      onClick={() => this.changeTheme()}
      title={this.getI18nString("theme-tooltip")}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons-outlined">style</i>
    </button>
  );

  FullScreenControl = (): Element => (
    <button
      aria-label="Full screen mode"
      onClick={() => this.toggleFullscreen()}
      title={this.getI18nString("full-screen-tooltip")}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons" aria-label="Full screen mode">
        {this.fullscreen ? "fullscreen_exit" : "fullscreen"}
      </i>
    </button>
  );

  TextTranslationDisplayControl = (): Element => (
    <button
      data-cy="translation-toggle"
      aria-label="Toggle Translation"
      title={this.getI18nString("translation-tooltip")}
      onClick={() => this.toggleTextTranslation()}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons-outlined">subtitles</i>
    </button>
  );

  ErrorMessage = (props: { msg: string; data_cy: string }): Element => (
    <p data-cy={props.data_cy} class="alert status-error">
      <span class="material-icons">error_outline</span> {props.msg}
    </p>
  );

  ControlPanel = (): Element => (
    <div
      data-cy="control-panel"
      class={
        "control-panel theme--" + this.theme + " background--" + this.theme
      }
    >
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
  );

  /**
   * Render main component
   */
  render(): Element {
    return (
      <div id="read-along-container" class="read-along-container">
        <div id="title__slot__container">
          <h1 class="slot__header">
            <slot name="read-along-header" />
          </h1>
          <h3 class="slot__subheader">
            <slot name="read-along-subheader" />
          </h3>
        </div>

        {Object.entries(this.assetsStatus).map((asset) => {
          let assetType = asset[0];
          let code = asset[1];
          if (code === ERROR_PARSING) {
            let path = this.getPathFromAssetType(assetType);
            return (
              <this.ErrorMessage
                msg={this.getI18nString("parse-error", {
                  FILETYPE: assetType,
                  FILENAME: path,
                })}
                data_cy={assetType + "-error"}
              />
            );
          }
          if (code === ERROR_LOADING) {
            let path = this.getPathFromAssetType(assetType);
            return (
              <this.ErrorMessage
                msg={this.getI18nString("loading-error", {
                  FILETYPE: assetType,
                  FILENAME: path,
                })}
                data_cy={assetType + "-error"}
              />
            );
          }
        })}

        {this.alignment_failed && this.assetsStatus.RAS === LOADED && (
          <this.ErrorMessage
            msg={this.getI18nString("alignment-error")}
            data_cy="alignment-error"
          />
        )}

        <div
          onScroll={() => {
            this.handleScrollEvent();
          }}
          data-cy="text-container"
          class={
            "pages__container" +
            " theme--" +
            this.theme +
            " " +
            this.pageScrolling
          }
        >
          {this.showGuide ? <this.Guide /> : null}
          {this.assetsStatus.RAS == LOADED &&
            this.parsed_text.map((page) => (
              <this.Page pageData={page}></this.Page>
            ))}
          {this.hasLoaded < 2 && <div class="loader" />}
        </div>

        {this.alignment_failed || (
          <div
            onClick={(e) => this.goToSeekFromProgress(e)}
            id="all"
            data-cy="progress-bar"
            class={
              "overlay__container theme--" +
              this.theme +
              " background--" +
              this.theme
            }
          >
            {this.svgOverlay ? <this.Overlay /> : null}
          </div>
        )}
        {this.assetsStatus.AUDIO == LOADED && <this.ControlPanel />}

        {this.cssUrl && this.cssUrl.match(".css") != null && (
          <link href={this.cssUrl} rel="stylesheet" />
        )}
      </div>
    );
  }
}
