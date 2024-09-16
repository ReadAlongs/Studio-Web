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
  Watch,
} from "@stencil/core";

import {
  parseRAS,
  Sprite,
  extractPages,
  extractAlignment,
  isFileAvailable,
  getUserPreferences,
  USER_PREFERENCE_VERSION,
  setUserPreferences,
  extractMeta,
  sentenceIsAligned,
} from "../../utils/utils";
import {
  Alignment,
  Page,
  InterfaceLanguage,
  ReadAlongMode,
  UserPreferences,
  ScrollBehaviour,
  RASMeta,
  RASAnnotation,
} from "../../index.d";
import { web_component as eng_strings } from "../../i18n/messages.eng.json";
import { web_component as fra_strings } from "../../i18n/messages.fra.json";
import { web_component as spa_strings } from "../../i18n/messages.spa.json";
import { PACKAGE_VERSION } from "../../version";
import unidecode from "unidecode";
import librarySlugify from "@sindresorhus/slugify";
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
  audio_howl: Howl;
  audio_howl_sprites: any;
  reading$ = new Subject<string>(); // An RxJs Subject for the current item being read.
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
   * DEPRECATED
   * Will be removed in version 2.0.0
   * Toggle the use of an assets folder. Defaults to undefined.
   * Previously (<1.2.0) defaulted to 'true'.
   * .readalong files should just contain base filenames
   * not the full paths to the images.
   */

  @Prop() useAssetsFolder?: boolean;

  /**
   * Define a path for where the image assets are located
   * This should be used instead of use-assets-folder.
   * Defaults to 'assets/'. The empty string means that
   * image paths will not have a prefix added to them.
   * Use of the forward slash is optional.
   */

  @Prop() imageAssetsFolder: string = "assets/";

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
  @Prop({ mutable: true, reflect: true }) scrollBehaviour: ScrollBehaviour =
    "smooth";

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
  @Prop({ mutable: true, reflect: true }) autoPauseAtEndOfPage? = false;

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

  @State() parsed_text;
  dropAreas;
  current_page;
  hasTextTranslations: boolean = false;
  @State() images: { [key: string]: string | null };
  /**
   * key: sentence-id
   * value: id of annotations/translation
   */
  @State() sentenceAnnotations: { [key: string]: string[] };
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
  autoPauseTimer: any;
  endOfPageTags: Alignment = {};
  finalTaggedWord: string;
  @State() settingsVisible: boolean = false;
  @State() userPreferencesDirty: boolean = false;
  meta: RASMeta = {};
  @State() annotations: RASAnnotation[] = [];
  @State() annotationsMenuVisible: boolean = false;
  @Watch("audio_howl_sprites")
  /************
   *  LISTENERS  *
   ************/
  @Listen("wheel", { target: "window" })
  wheelHandler(event: MouseEvent): void {
    // only show guide if there is an actual highlighted element
    if (this.el.shadowRoot.querySelector(".reading")) {
      if (
        event["path"] &&
        event["path"].length > 0 &&
        (event["path"][0].classList.contains("sentence__word") ||
          event["path"][0].classList.contains("sentence__container") ||
          event["path"][0].classList.contains("sentence"))
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
  // handle cases where user presses esc to cancel full screen
  @Listen("fullscreenchange")
  fullScreenHandler() {
    this.fullscreen = window.document.fullscreenElement != null;
  }
  @Listen("keydown")
  handleKeyDown(event: KeyboardEvent) {
    //dismiss setting modal user pressing escape
    if (event.key === "Escape" && this.settingsVisible) {
      this.settingsVisible = false;
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
    // Frankenstein of combined useAssetsFolder v1.1.1 functionality and imageAssetsFolder v2.0.0 functionality
    // TODO: delete this first if statement and all occurrences of useAssetsFolder for v2.0.0
    if (this.useAssetsFolder !== undefined) {
      // Old v1.1.1 functionality
      if (
        this.useAssetsFolder &&
        looksLikeRelativePath(path) &&
        !path.startsWith("blob")
      ) {
        return "assets/" + path;
      } else {
        return path;
      }
    } else if (
      this.imageAssetsFolder &&
      looksLikeRelativePath(path) &&
      !path.startsWith("blob")
    ) {
      if (this.imageAssetsFolder && !this.imageAssetsFolder.endsWith("/")) {
        this.imageAssetsFolder += "/";
      }
      return this.imageAssetsFolder + path;
    }
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

  /**
   * toggle the setting pane visiblilty
   */
  toggleSettings() {
    //pause audio if playing and setting modal is being presented

    if (this.playing) {
      this.pause();
    }

    this.settingsVisible = !this.settingsVisible;
  }
  /**
   * toggle (override) scrolling animation
   */
  toggleScrollBehavior(): void {
    this.scrollBehaviour = this.scrollBehaviour === "auto" ? "smooth" : "auto";
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
    //allow display to bring the selected portion into view
    this.autoScroll = true;
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
    if (this.playing) {
      this.playing = false;
      this.audio_howl_sprites.pause();
    }
  }

  /**
   * Play the current audio, or start a new play of all
   * the audio
   *
   *
   */
  play() {
    //do not attempt to play if sprites are not initialized
    if (this.audio_howl_sprites === undefined) return;
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
    this.play_id = undefined;
    if (this.audio_howl_sprites) {
      this.audio_howl_sprites.stop();
    }

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
      .querySelectorAll(".translation, .sentence__translation, [annotation-id]")
      .forEach((translation) => translation.classList.toggle("invisible"));
  }

  /**
   * Toggle the visibility of annotation layers (sentences)
   * if id is set to * it toggles all layers
   * @param annotationId
   */
  toggleTextAnnotation(annotationId: string): void {
    this.el.shadowRoot
      .querySelectorAll(
        "[annotation-id" +
          (annotationId === "*" ? "]" : '="' + annotationId + '"]'),
      )
      .forEach((annotationElem) =>
        annotationElem.classList.toggle("invisible"),
      );
    this.annotations = this.annotations.map((annotationObj) => {
      if (annotationObj.id == annotationId || annotationId === "*")
        annotationObj.isVisible = !annotationObj.isVisible;
      return annotationObj;
    });
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
      this.play_id,
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
      this.play_id,
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
    } else if (play_id) {
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
   * Get Current Word
   */
  @Method()
  async getCurrentWord(): Promise<Subject<string>> {
    return this.reading$;
  }

  /**
   * Get Images
   */
  @Method()
  async getImages(): Promise<object> {
    return this.images;
  }

  /**
   * Update Single Sprite
   */
  @Method()
  async updateSpriteAlignments(alignment: Alignment): Promise<void> {
    this.stop();
    this.processed_alignment = alignment;
    this.attachScrollingLogicToAudio();
  }

  /**
   * Get ReadAlong Element
   */
  @Method()
  async getReadAlongElement(): Promise<Element> {
    return this.el;
  }

  /**
   * Get Alignments
   */
  @Method()
  async getAlignments(): Promise<Alignment> {
    return this.processed_alignment;
  }

  /**
   * get Pages
   */
  @Method()
  async getPages(): Promise<Page[]> {
    return this.parsed_text as Page[];
  }

  /**
   * get Pages
   */
  @Method()
  async getMeta(): Promise<RASMeta> {
    return this.meta;
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
    element: HTMLElement,
  ): HTMLElement {
    return element.parentElement.parentElement.parentElement;
  }

  /**
   * Make Fullscreen
   */
  private toggleFullscreen(): void {
    let fullScreenPromise;
    if (!this.fullscreen) {
      let elem: any = this.el.shadowRoot.getElementById("read-along-container");

      if (elem.requestFullscreen) {
        fullScreenPromise = elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        fullScreenPromise = elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        fullScreenPromise = elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        fullScreenPromise = elem.msRequestFullscreen();
      }
      fullScreenPromise.then(() => {
        this.fullscreen = true;
        this.el.shadowRoot
          .getElementById("read-along-container")
          .classList.add("read-along-container--fullscreen");
      });
    } else {
      let document: any = this.el.ownerDocument;
      if (document.exitFullscreen) {
        fullScreenPromise = document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        /* Firefox */
        fullScreenPromise = document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        fullScreenPromise = document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        fullScreenPromise = document.msExitFullscreen();
      }
      fullScreenPromise.then(() => {
        this.fullscreen = false;
        this.el.shadowRoot
          .getElementById("read-along-container")
          .classList.remove("read-along-container--fullscreen");
      });
    }
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
    //even if it is barely above the view
    let inOverflowAbove = el_rect.top < page_rect.top;

    let intersectionObserver = new IntersectionObserver((entries) => {
      let [entry] = entries;
      if (entry.isIntersecting) {
        setTimeout(() => {
          this.showGuide = false;
          this.autoScroll = true;
        }, 100);
        // IT IS VISIBLE
        inOverflowAbove = inOverflowBelow = false;
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
      },
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
    //set theme based on system default mode (dark/light)
    if (window.matchMedia) {
      if (window.matchMedia("prefers-color-scheme: dark").matches) {
        this.theme = "dark";
      } else {
        this.theme = "light";
      }
    }
    //load user preferences
    const userPreferences: UserPreferences | null = getUserPreferences();
    if (
      userPreferences !== null &&
      userPreferences.version === USER_PREFERENCE_VERSION
    ) {
      this.language = userPreferences.language;
      this.scrollBehaviour = userPreferences.scrollBehaviour;
      this.autoPauseAtEndOfPage = userPreferences.autoPauseAtEndOfPage;
      this.theme = userPreferences.theme || this.theme;
    }
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
      console.error("Invalid scroll-behaviour value, using default (smooth)");
      this.scrollBehaviour = "smooth";
    }

    // Make sure playback-rate-range is valid
    if (
      isNaN(this.playbackRateRange) ||
      this.playbackRateRange < 0 ||
      this.playbackRateRange > 99
    ) {
      console.error("Invalid playback-rate-range value, using default (15).");
      this.playbackRateRange = 15;
    }

    // TODO: if parseRAS has an error, we need ERROR_PARSING
    // Parse the text to be displayed
    const text = this.el.querySelector("read-along > text");
    if (text) {
      this.parsed_text = extractPages(text);
      this.meta = extractMeta(this.el);
    } else {
      const doc = await parseRAS(this.href);

      this.parsed_text = doc.pages;
      this.meta = doc.meta;
    }
    if (this.parsed_text === null) {
      this.parsed_text = [];
      this.assetsStatus.RAS = ERROR_LOADING;
    } else if (this.parsed_text.length === 0) {
      this.assetsStatus.RAS = ERROR_PARSING;
    } else {
      this.images = {};
      this.sentenceAnnotations = {};
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
            const sentences = paragraphs[
              paragraphs.length - 1
            ].querySelectorAll(
              "s:not(.translation), s:not(.sentence__translation)",
            ); //get non-translation sentences in the last paragraph
            const word =
              sentences[sentences.length - 1].querySelector("w:last-of-type"); //get the last word of the last sentence
            if (word) {
              this.endOfPageTags[word.id] = [
                parseFloat(word.getAttribute("time")), //in seconds
                parseFloat(word.getAttribute("dur")) * 1000, // in milliseconds
              ];
              this.finalTaggedWord = word.id; // do not pause on the last word of the read-along
            }
          } catch (err) {
            console.error("para loading", err);
          }
          //get the translations
          page.paragraphs
            .map((paragraph) => paragraph.querySelectorAll("s"))
            .forEach((sentences) => {
              if (sentences.length) {
                sentences.forEach((sentence) => {
                  let translation: { [key: string]: string[] } = {};
                  if (sentence.id && sentenceIsAligned(sentence)) {
                    translation[sentence.id] = [];

                    this.sentenceAnnotations = {
                      ...this.sentenceAnnotations,
                      ...translation,
                    };
                  } else {
                    if ((sentence as Element).hasAttribute("sentence-id")) {
                      const sentenceID = (sentence as Element).getAttribute(
                        "sentence-id",
                      );
                      translation[sentenceID] =
                        this.sentenceAnnotations[sentenceID] ?? [];
                      translation[sentenceID].push(
                        sentence.hasAttribute("annotation-id")
                          ? sentence.getAttribute("annotation-id")
                          : sentence.id,
                      );
                      this.sentenceAnnotations = {
                        ...this.sentenceAnnotations,
                        ...translation,
                      };
                    }
                  }
                });
              }
            });
        }
      }
      // this.parsed_text.map((page, i) => page.img ? [i, page.img] : [i, null])
      /**
       * parse defined annotations information from the .readalong meta
       * annotations-id defines the id of each layer
       * annotations-labels defines the display label for each layer
       * annotations-label-{locale} defines the localized display label for each layer
       * all lists are delimited by comma
       */
      if (this.meta["annotations-ids"]) {
        const delimiter = ",";
        const labels: string[] | undefined = this.meta[
          "annotations-labels-" + this.language
        ]
          ? this.meta["annotations-labels-" + this.language]
          : this.meta["annotations-labels"];
        const annotationNames = labels ? labels[0].split(delimiter) : [];
        this.meta["annotations-ids"][0]
          .split(delimiter)
          .forEach((annotation, l) => {
            this.annotations.push({
              isVisible: this.mode === "EDIT", //hide by default in non edit mode
              name: annotationNames[l].trim() ?? annotation.trim(),
              id: annotation.trim(),
            });
          });
      }
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
      `link[href="${bcSansFontCssUrl}"]`,
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
    this.audio_howl = new Howl({
      src: [this.audio],
      preload: false,
    });
    // Once loaded, get duration and build Sprite
    this.audio_howl.once("load", () => {
      this.attachScrollingLogicToAudio();
    });
    // Handle load errors
    this.audio_howl.once("loaderror", () => {
      this.hasLoaded += 1;
      this.assetsStatus.AUDIO = ERROR_LOADING;
    });
    this.audio_howl.load();
  }

  attachScrollingLogicToAudio(): void {
    this.processed_alignment["all"] = [0, this.audio_howl.duration() * 1000];
    this.duration = this.audio_howl.duration();
    this.audio_howl_sprites = this.buildSprite(
      this.audio,
      this.processed_alignment,
    );
    // Once Sprites are built, subscribe to reading subject and update element class
    // when new distinct values are emitted
    this.audio_howl_sprites._reading$
      .pipe(distinctUntilChanged())
      .subscribe((el_tag) => {
        // Update the main reading tag subject
        this.reading$.next(el_tag);
        //if stop
        if (el_tag == "") return;

        //if auto pause is active and not on last word of the read along pause the audio
        if (
          this.playing &&
          this.autoPauseAtEndOfPage &&
          el_tag in this.endOfPageTags &&
          this.finalTaggedWord !== el_tag
        ) {
          //clear previous timeout if active
          if (this.autoPauseTimer) window.clearTimeout(this.autoPauseTimer);
          //pause 25ms before end of word
          this.autoPauseTimer = window.setTimeout(() => {
            this.pause();
          }, this.endOfPageTags[el_tag][1] - 25);
        }
        // Turn tag to query
        let query = this.tagToQuery(el_tag);
        if (query === undefined) return; // not go any further if tag does not exist in the DOM
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
          ReadAlongComponent._getSentenceContainerOfWord(query_el).parentElement
            .id;

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
              .getBoundingClientRect().left,
          ) + 1;
        const pageLeftEdge = Math.ceil(
          this.el.shadowRoot
            .querySelector("#" + this.current_page)
            .getBoundingClientRect().left,
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
            query_el.scrollIntoView({ block: "start", inline: "nearest" });
            if (!this.isScrolling) this.scrollByHeight(query_el);
          }
        } // scroll horizontal (through paragraph) if needed
        if (this.inParagraphContentOverflow(query_el)) {
          if (this.autoScroll) {
            query_el.scrollIntoView(false);
            if (!this.isScrolling) this.scrollByWidth(query_el);
          }
        }
      });
    this.hasLoaded += 1;
    this.assetsStatus.AUDIO = LOADED;
  }

  componentDidRender(): void {
    //if creator does not want the translation to show at load time
    if (
      this.mode !== "EDIT" &&
      !this.displayTranslation &&
      this.parsed_text &&
      this.parsed_text.length > 0
    ) {
      this.toggleTextTranslation();
      this.displayTranslation = true;
    }

    if (this.latestTranslation) {
      try {
        // Add focus to the latest translation line that was added
        let newLine: HTMLElement = this.el.shadowRoot.querySelector(
          this.latestTranslation,
        );
        if (newLine) {
          newLine.focus();
          newLine.setAttribute(
            "placeholder",
            this.getI18nString("placeholder"),
          );
          this.latestTranslation = undefined;
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  /**
   * Is the App ready to start playing
   * This could be expressed as one line
   * but because there are multiple states involved
   * breaking it down to make it easier to track
   */
  isReadyToPlay(): boolean {
    //not ready if still audio & alignment is not loaded
    if (this.hasLoaded < 2) return false;

    //not ready if
    if (this.audio_howl_sprites === undefined) return false;

    //not ready if
    if (this.audio_howl_sprites.sound === undefined) return false;

    return true; //it is ready
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
    substitutions: { readonly [index: string]: string } = {},
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

  removeLine(sentence_element: Element) {
    let newTranslation = {};
    // remove translation and delete the node
    const ID = sentence_element.id;
    this.parsed_text = [
      ...this.parsed_text.map((page) => {
        if (ID.includes(page.id)) {
          page.paragraphs = page.paragraphs.map((para) => {
            if (ID.includes(para.id)) {
              para.removeChild(sentence_element);
            }
            return para;
          });
        }
        return page;
      }),
    ];
    const sentenceID = sentence_element.getAttribute("sentence-id");
    newTranslation[sentenceID] = this.sentenceAnnotations[sentenceID].filter(
      (s) => s != ID && s != sentence_element.getAttribute("annotation-id"),
    );
    this.sentenceAnnotations = {
      ...this.sentenceAnnotations,
      ...newTranslation,
    };
    this.hasTextTranslations =
      Object.values(this.sentenceAnnotations).filter((s) => s.length > 0)
        .length > 0;
  }

  updateTranslation(sentence_id: string, text: string) {
    this.parsed_text = [
      ...this.parsed_text.map((page) => {
        if (sentence_id.includes(page.id)) {
          page.paragraphs = page.paragraphs.map((para) => {
            if (sentence_id.includes(para.id)) {
              para.querySelector(`#${sentence_id}`).textContent =
                text.trim().length < 1 ? "---" : text.trim();
            }
            return para;
          });
        }
        return page;
      }),
    ];
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

  /**
   *
   * @param sentence_element
   * @param layerID
   */
  addAnnotation(sentence_element: Element, layerID: string | undefined) {
    const sentence_id = sentence_element.id;
    const annotation = document.createElementNS(null, "s");

    annotation.setAttribute("do-not-align", "true");
    annotation.setAttribute("xml:lang", this.language);
    annotation.id =
      sentence_id +
      (layerID ? "an" : "tr") +
      (1 + this.sentenceAnnotations[sentence_id].length)
        .toString()
        .padStart(2, "0");
    annotation.setAttribute("sentence-id", sentence_id);
    if (layerID) {
      annotation.setAttribute("annotation-id", layerID);
    } else {
      annotation.className = "sentence__translation editable__translation";
    }

    annotation.textContent = layerID ?? " "; //placeholder is possible since we are using span
    this.parsed_text = [
      ...this.parsed_text.map((page) => {
        if (sentence_id.includes(page.id)) {
          return {
            ...page,
            paragraphs: [
              ...page.paragraphs.map((para) => {
                if (sentence_id.includes(para.id)) {
                  const sentence_annotations = para.querySelectorAll(
                    ":scope > [sentence-id=" + sentence_id + "]",
                  );
                  if (sentence_annotations.length > 0) {
                    sentence_annotations
                      .item(sentence_annotations.length - 1)
                      .after(annotation);
                  } else
                    para.querySelector("#" + sentence_id).after(annotation);
                }

                return para;
              }),
            ],
          };
        }
        return page;
      }),
    ];
    const translation = this.sentenceAnnotations[sentence_element.id];
    translation.push(layerID ?? annotation.id);
    this.sentenceAnnotations = {
      ...this.sentenceAnnotations,
      [sentence_element.id]: translation,
    };
    this.latestTranslation = "#" + annotation.id;
  }

  /**
   *
   */
  updateAnnotationMeta() {
    const annotationLabels = [
      this.annotations.reduce(
        (result, row) => result + (result.length > 0 ? ", " : "") + row.name,
        "",
      ),
    ];
    let localeAnnotationLabel = {};
    localeAnnotationLabel["annotations-labels-" + this.language] =
      annotationLabels;
    this.meta = {
      ...this.meta,
      "annotations-id": [
        this.annotations.reduce(
          (result, row) => result + (result.length > 0 ? ", " : "") + row.id,
          "",
        ),
      ],
      "annotations-labels": annotationLabels,
      ...localeAnnotationLabel,
    };
  }
  /**
   *
   */
  createNewAnnotationLayer() {
    const name = (
      this.el.shadowRoot.querySelector(
        "#newAnnotationLayerName",
      ) as HTMLInputElement
    )?.value;
    //do nothing
    if (name === undefined || name.trim().length < 1) return;
    // Adapted from https://byby.dev/js-slugify-string
    const id = librarySlugify(
      String(unidecode(name.trim()))
        .normalize("NFC") // split accented characters into their base characters and diacritical marks
        .trim() // trim leading or trailing whitespace
        .toLowerCase() // convert to lowercase
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/-+/g, "-"), // remove consecutive hyphens
    );
    //check for uniqueness of id
    if (this.annotations.filter((row) => row.id == id).length > 0) return;
    //update annotations
    this.annotations = [
      ...this.annotations,
      {
        isVisible: true,
        name: name,
        id: id,
      },
    ];
    this.updateAnnotationMeta();
    (
      this.el.shadowRoot.querySelector(
        "#newAnnotationLayerName",
      ) as HTMLInputElement
    ).value = "";
  }
  /**
   *
   * @param id
   * @returns boolean
   */
  hasAnnotationLayer(id: string): boolean {
    let layerFound = false;
    for (let translation of Object.values(this.sentenceAnnotations)) {
      layerFound = translation.includes(id);
      if (layerFound) break;
    }
    return layerFound;
  }
  /**
   *
   * @param id
   */
  deleteAnnotationLayer(id: string) {
    //only delete when there is no instance of the layer

    if (!this.hasAnnotationLayer(id)) {
      this.annotations = this.annotations.filter(
        (annotation) => annotation.id != id,
      );
      this.updateAnnotationMeta();
    }
  }
  /**
   *
   * @param el Element
   */

  toggleAnnotationMenuItemMode(el: Element) {
    el.parentElement.childNodes.forEach((childNode) => {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const elem = childNode as Element;
        const className = elem.className;
        elem.className = className.includes("d-none")
          ? className.replace("d-none", "")
          : className + " d-none";
      }
    });
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
            ),
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
    const isAnnotationSentence =
      (props.sentenceData.hasAttribute("class") &&
        /translation/.test(props.sentenceData.getAttribute("class"))) ||
      props.sentenceData.hasAttribute("annotation-id");
    if (
      !this.hasTextTranslations &&
      /translation/.test(props.sentenceData.getAttribute("class"))
    ) {
      this.hasTextTranslations = true;
    }
    let nodeProps = { id: sentenceID };
    let editingProps = {};
    //attributes of sentence you want to retain
    for (const attr of [
      "annotation-id",
      "do-not-align",
      "lang",
      "sentence-id",
    ]) {
      if (props.sentenceData.hasAttribute(attr)) {
        nodeProps[attr] = props.sentenceData.getAttribute(attr);
      }
    }
    if (props.sentenceData.hasAttribute("xml:lang")) {
      nodeProps["lang"] = props.sentenceData.getAttribute("xml:lang");
    }
    if (this.mode === "EDIT") {
      if (isAnnotationSentence) {
        editingProps["onBlur"] = (e: any) => {
          this.updateTranslation(sentenceID, e.currentTarget.innerText);
          e.currentTarget.removeAttribute("dirty");
        };

        editingProps["contentEditable"] = true;
        editingProps["onKeyDown"] = (event) => {
          if (event.key == "Enter") {
            this.updateTranslation(
              sentenceID,
              event.currentTarget.innerText.trim(),
            );
            event.currentTarget.removeAttribute("dirty");
            event.preventDefault();
          } else if (
            event.currentTarget.innerText.trim() !==
            props.sentenceData.textContent
          ) {
            event.currentTarget.setAttribute("dirty", true);
          }
        };
        nodeProps["data-test-id"] = "annotation-layer";

        nodeProps["placeholder"] = nodeProps["title"] =
          nodeProps["annotation-id"];
      }
    }

    return (
      <div
        {...nodeProps}
        class={
          "sentence" +
          " " +
          (props.sentenceData.hasAttribute("class")
            ? props.sentenceData.getAttribute("class")
            : "") +
          (nodeProps["annotation-id"] && this.mode !== "EDIT"
            ? " invisible"
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
                  attributes={{ ...child.attributes, ...editingProps }}
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
                  attributes={child.attributes}
                  id={child["id"]}
                />
              );
            } else if (child) {
              let cnodeProps = editingProps;
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
            this.sentenceAnnotations &&
            this.annotations
          ) {
            if (
              !isAnnotationSentence &&
              sentenceIsAligned(props.sentenceData)
            ) {
              return (
                <span>
                  <button
                    title={this.getI18nString("add-translation")}
                    aria-label="Add translation"
                    data-test-id="add-translation-button"
                    class="sentence__translation sentence__translation__button"
                    onClick={(e) => {
                      if (this.annotations.length) {
                        const menu = (
                          e.currentTarget as Element
                        ).parentNode.querySelector("ul");
                        menu.className =
                          "annotation-menu" +
                          (menu.className.includes("invisible")
                            ? ""
                            : " invisible");
                      } else this.addAnnotation(props.sentenceData, undefined);
                    }}
                    disabled={
                      (this.annotations.length === 0 &&
                        this.sentenceAnnotations[props.sentenceData.id]
                          .length == 1) ||
                      (this.annotations.length > 0 &&
                        this.annotations.length ===
                          this.sentenceAnnotations[props.sentenceData.id]
                            .length)
                    }
                  >
                    <i class="material-icons">add</i>
                  </button>
                  {this.annotations && (
                    <ul class={"annotation-menu invisible"}>
                      <li>
                        <button
                          onClick={(e) =>
                            ((
                              e.currentTarget as Element
                            ).parentElement.parentElement.className =
                              "annotation-menu invisible")
                          }
                          title={this.getI18nString("close")}
                          class={
                            " theme--" +
                            this.theme +
                            " background--" +
                            this.theme
                          }
                          data-test-id="sentence-annotation-menu-button-close"
                        >
                          <i class="material-icons">close</i>
                        </button>
                      </li>
                      {this.annotations
                        .filter(
                          (annotation) =>
                            !this.sentenceAnnotations[sentenceID].includes(
                              annotation.id,
                            ),
                        )
                        .map((annotation) => {
                          return (
                            <li>
                              <button
                                class={
                                  "control-panel__control ripple theme--" +
                                  this.theme +
                                  " background--" +
                                  this.theme
                                }
                                onClick={(e) => {
                                  (
                                    e.currentTarget as Element
                                  ).parentNode.parentElement.className =
                                    "annotation-menu invisible";
                                  this.addAnnotation(
                                    props.sentenceData,
                                    annotation.id,
                                  );
                                }}
                                data-test-id={
                                  "add-sentence-annotation-" + annotation.id
                                }
                              >
                                <i class="material-icons-outlined">layers</i>
                                {annotation.name}
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </span>
              );
            } else if (isAnnotationSentence) {
              return (
                <span>
                  <button
                    title={this.getI18nString("remove-translation")}
                    onClick={() => {
                      this.removeLine(props.sentenceData);
                    }}
                    class={
                      "sentence__translation sentence__translation_button sentence__translation__button__remove theme--" +
                      this.theme +
                      " background--" +
                      this.theme
                    }
                    data-test-id={"remove-annotation-" + sentenceID}
                  >
                    <i class="material-icons">delete</i>
                  </button>
                </span>
              );
            }
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
    let nodeProps = { ...props.attributes };
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
      disabled={!this.isReadyToPlay()}
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
      tabindex={1}
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

  TextAnnotationsControl = (): Element => (
    <button
      data-test-id="annotations-toggle"
      aria-label="Toggle Annotations"
      title={this.getI18nString("annotations-tooltip")}
      onClick={() =>
        (this.annotationsMenuVisible = !this.annotationsMenuVisible)
      }
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
      id="toggleAnnotations"
    >
      <i class="material-icons-outlined">layers</i>
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

  ToggleSettingsControl = (): Element => (
    <button
      data-test-id={"settings-button"}
      title={this.getI18nString("configuration-tooltip")}
      onClick={() => this.toggleSettings()}
      id={"settings-button"}
      class={
        "control-panel__control ripple theme--" +
        this.theme +
        " background--" +
        this.theme
      }
    >
      <i class="material-icons" aria-label="Show settings">
        settings
      </i>
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
        {this.annotations.length > 0 ||
        (this.mode === "EDIT" && !this.hasTextTranslations) ||
        this.annotations.length > 0 ? (
          <this.TextAnnotationsControl />
        ) : (
          this.hasTextTranslations && <this.TextTranslationDisplayControl />
        )}
        {/* enable fullscreen button if supported*/}
        {window.document.fullscreenEnabled && <this.FullScreenControl />}
        <this.ToggleSettingsControl />
      </div>
    </div>
  );

  Settings = (): Element => (
    <div
      id={"settings"}
      data-test-id={"settings"}
      class={"settings  theme--" + this.theme}
    >
      <button
        class={"close"}
        data-test-id={"settings-close-button"}
        onClick={() => {
          this.toggleSettings();
        }}
      >
        &times;{" "}
      </button>
      <h3>{this.getI18nString("settings")}</h3>
      <p>
        <label>
          <select
            title={this.getI18nString("language")}
            onChange={(e) => {
              this.language = (e.target as HTMLSelectElement)
                .value as InterfaceLanguage;
              this.userPreferencesDirty = true;
            }}
            data-test-id="settings-language"
            tabindex={2}
          >
            <option selected={this.language == "eng"} value="eng">
              {this.getI18nString("eng")}
            </option>
            <option selected={this.language == "fra"} value="fra">
              {this.getI18nString("fra")}
            </option>
            <option selected={this.language == "spa"} value="spa">
              {this.getI18nString("spa")}
            </option>
          </select>
          {this.getI18nString("language")}
        </label>
      </p>
      <p
        onClick={() => {
          this.changeTheme();
          this.userPreferencesDirty = true;
        }}
        tabindex={3}
      >
        <this.StyleControl />
        {this.getI18nString("theme-tooltip")}
      </p>

      <p
        onClick={() => {
          this.toggleScrollBehavior();
          this.userPreferencesDirty = true;
        }}
        tabindex={4}
      >
        <button
          class={
            "control-panel__control  ripple theme--" +
            this.theme +
            " background--" +
            this.theme
          }
          title={this.getI18nString("page-animation")}
          data-test-id={"settings-scroll-behavior"}
        >
          <i class="material-icons-outlined">
            {this.scrollBehaviour === "smooth"
              ? "check_box"
              : "check_box_outline_blank"}
          </i>
        </button>
        {this.getI18nString("page-animation")}
      </p>
      <p
        onClick={() => {
          this.autoPauseAtEndOfPage = !this.autoPauseAtEndOfPage;
          this.userPreferencesDirty = true;
        }}
        tabindex={5}
      >
        <button
          class={
            "control-panel__control  ripple theme--" +
            this.theme +
            " background--" +
            this.theme
          }
          title={this.getI18nString("auto-pause")}
          data-test-id={"settings-auto-pause"}
        >
          <i class="material-icons-outlined">
            {this.autoPauseAtEndOfPage
              ? "check_box"
              : "check_box_outline_blank"}
          </i>
        </button>
        {this.getI18nString("auto-pause")}
      </p>
      <p class="version">
        @readalongs/web-component version: {PACKAGE_VERSION}
      </p>
      <div class="footer">
        <button
          type="button"
          class={
            "control-panel__control  ripple theme--" +
            this.theme +
            " background--" +
            this.theme
          }
          title={this.getI18nString("save-settings")}
          onClick={() => {
            setUserPreferences({
              version: USER_PREFERENCE_VERSION,
              autoPauseAtEndOfPage: this.autoPauseAtEndOfPage,
              scrollBehaviour: this.scrollBehaviour,
              language: this.language,
              theme: this.theme,
            });
            this.userPreferencesDirty = false;
          }}
          data-test-id={"settings-save"}
          disabled={!this.userPreferencesDirty}
          tabindex={6}
        >
          {this.getI18nString("save-settings")}
        </button>

        <div></div>
        <button
          onClick={() => this.toggleSettings()}
          class={
            "control-panel__control  ripple theme--" +
            this.theme +
            " background--" +
            this.theme
          }
          tabindex={7}
        >
          {this.getI18nString("close")}
        </button>
      </div>
    </div>
  );

  AnnotationsMenu = (): Element => {
    return (
      <div
        id="annotationsMenu"
        class={
          "annotations-menu  theme--" +
          this.theme +
          "  background--" +
          this.theme
        }
      >
        {/*<h3 class={"theme--" + this.theme}> {this.getI18nString("annotation-layers")}</h3> */}
        {this.annotations.map((annotation) => (
          <span>
            <button
              data-test-id={"toggle-annotation-" + annotation.id}
              class={
                "ripple theme--" + this.theme + " background--" + this.theme
              }
              onClick={() => this.toggleTextAnnotation(annotation.id)}
            >
              <i class="material-icons-outlined">
                {" "}
                {annotation.isVisible ? "check_box" : "check_box_outline_blank"}
              </i>{" "}
              {annotation.name}
            </button>
            {this.mode === "EDIT" && (
              <button
                data-test-id={"edit-annotation-" + annotation.id}
                class={
                  "ripple theme--" +
                  this.theme +
                  " background--" +
                  this.theme +
                  " icon-only annotation__layer__button__edit"
                }
                title={this.getI18nString("edit-layer")}
                onClick={(e) => {
                  this.toggleAnnotationMenuItemMode(e.currentTarget as Element);
                }}
              >
                <i class="material-icons-outlined">edit</i>
              </button>
            )}
            {this.mode === "EDIT" &&
              !this.hasAnnotationLayer(annotation.id) && (
                <button
                  data-test-id={"remove-annotation-" + annotation.id}
                  class={
                    "ripple theme--" +
                    this.theme +
                    " background--" +
                    this.theme +
                    " icon-only annotation__layer__button__remove"
                  }
                  title={this.getI18nString("delete-layer")}
                  onClick={() => this.deleteAnnotationLayer(annotation.id)}
                >
                  <i class="material-icons-outlined">delete</i>
                </button>
              )}
            <span class="d-none">
              <input
                type="text"
                value={annotation.name}
                class={"edit-annotation"}
                data-test-id={"edit-annotation-name-" + annotation.id}
                onKeyDown={(e) => {
                  if (e.key == "Enter") {
                    (
                      (e.currentTarget as Element).parentElement.querySelector(
                        "button.annotation__layer__button__save",
                      ) as HTMLElement
                    ).click();
                  }
                }}
              />
              <button
                data-test-id={"save-annotation-" + annotation.id}
                class={
                  "ripple theme--" +
                  this.theme +
                  " background--" +
                  this.theme +
                  " icon-only annotation__layer__button__save"
                }
                title={this.getI18nString("save-layer")}
                onClick={(e) => {
                  this.annotations = [
                    ...this.annotations.map((ann) => {
                      if (ann.id === annotation.id) {
                        ann.name = (
                          e.currentTarget as Element
                        ).parentElement.querySelector("input").value;
                      }
                      return ann;
                    }),
                  ];
                  this.toggleAnnotationMenuItemMode(
                    (e.currentTarget as Element).parentElement,
                  );
                }}
              >
                <i class="material-icons-outlined">save</i>
              </button>
            </span>
          </span>
        ))}
        <button
          data-test-id="toggle-all-annotations"
          class={"ripple theme--" + this.theme + " background--" + this.theme}
          onClick={() => this.toggleTextAnnotation("*")}
        >
          <i class="material-icons-outlined">layers</i> All
        </button>
        {this.mode === "EDIT" && (
          <span class={" background--" + this.theme}>
            <input
              type="text"
              id="newAnnotationLayerName"
              placeholder={this.getI18nString("create-layer")}
              onKeyDown={(e) => {
                if (e.key == "Enter") this.createNewAnnotationLayer();
              }}
              data-test-id="create-new-annotation-text"
            />
            <button
              data-test-id="create-new-annotation-button"
              class={
                "ripple theme--" +
                this.theme +
                " background--" +
                this.theme +
                "  icon-only"
              }
              onClick={() => this.createNewAnnotationLayer()}
              title={this.getI18nString("create-layer")}
            >
              <i class="material-icons-outlined">add</i>
            </button>
          </span>
        )}
      </div>
    );
  };

  /**
   * Render main component
   */
  render(): Element {
    return (
      <div
        id="read-along-container"
        data-mode={this.mode}
        class="read-along-container"
      >
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
        {this.settingsVisible && (
          <div
            class="settings-background"
            onClick={() => (this.settingsVisible = false)}
          ></div>
        )}
        {this.settingsVisible && <this.Settings />}

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
        {this.annotationsMenuVisible && <this.AnnotationsMenu />}
        {this.assetsStatus.AUDIO == LOADED && <this.ControlPanel />}

        {this.cssUrl && this.cssUrl.match(".css") != null && (
          <link href={this.cssUrl} rel="stylesheet" />
        )}
      </div>
    );
  }
}
