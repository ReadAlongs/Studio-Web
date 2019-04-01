import { Component, Element, Prop, State } from '@stencil/core';
import { distinctUntilChanged } from 'rxjs/operators';
import { Howl } from 'howler';
import { parseSMIL, parseTEI, Sprite } from '../../utils/utils'

@Component({
  tag: 'read-along',
  styleUrl: '../../scss/styles.scss',
  shadow: true
})
export class ReadAlongComponent {
  @Element() el: HTMLElement;

  /**
   * The text as TEI
   */
  @Prop() text: string;
  processed_text: Array<string[]>;

  /**
   * The alignment as SMIL
   */
  @Prop() alignment: string;
  processed_alignment: object;

  /**
   * The audio file
   */
  @Prop() audio: string;
  audio_howl_sprites: Howl;
  reading$;

  /**
   * Image
   */
  @Prop() image: string;

  /**
  * Theme to use: ['light', 'dark'] defaults to 'dark'
  */
  @Prop() theme: string = 'light';

  @State() playing: boolean = false;

  play_id: number;

  /**
   * Add escape characters to query selector param
   * @param id string
   */
  tagToQuery(id): string {
    id = id.replace(".", "\\.")
    id = id.replace("#", "\\#")
    return "#" + id
  }

  /**
   * Play a sprite from the audio, and subscribe to the sprite's 'reading' subject 
   * in order to asynchronously apply styles as the sprite is played
   * @param id string
   */
  play(id): void {
    if (id !== 'all') {
      var tag = id.path[0].id;
    } else {
      var tag = id
      // subscribe to reading subject and update element class
      this.reading$ = this.audio_howl_sprites._reading$.pipe(
        distinctUntilChanged()
      ).subscribe(x => {
        if (x) {
          let query = this.tagToQuery(x);
          this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
          this.el.shadowRoot.querySelector(query).classList.add('reading')
        }
      })
    }
    if (id === 'all') {
      this.playing = true;
      // If already playing once, continue playing
      if (this.play_id) {
        this.audio_howl_sprites.play(this.play_id)
        // else, start a new play
      } else {
        var play_id = this.audio_howl_sprites.play(tag)
        this.play_id = play_id
      }
    } else {
      var play_id = this.audio_howl_sprites.play(tag)
    }


    // Create a progress element and begin visually tracking it.
    var elm = document.createElement('div');
    elm.className = 'progress theme--' + this.theme;
    elm.id = play_id;
    elm.dataset.sprite = tag;
    let query = this.tagToQuery(tag);
    this.el.shadowRoot.querySelector(query).appendChild(elm);
    this.audio_howl_sprites.sounds.push(elm);

    // When this sound is finished, remove the progress element.
    this.audio_howl_sprites.sound.once('end', () => {
      var index = this.audio_howl_sprites.sounds.indexOf(elm);
      if (index >= 0) {
        this.audio_howl_sprites.sounds.splice(index, 1);
        this.el.shadowRoot.querySelector(query).removeChild(elm);
        this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
      }
    }, play_id);
  }

  /**
   * Pause a sprite from the audio, and subscribe to the sprite's 'reading' subject 
   * in order to asynchronously apply styles as the sprite is played
   * @param id string
   */
  pause() {
    this.playing = false;
    this.audio_howl_sprites.pause()
  }

  /**
   *  Go back s milliseconds
   * 
   * @param id string
   * @param s number
   */

  goBack(s): void {
    if (this.play_id) {
      this.audio_howl_sprites.goBack(this.play_id, s)
    }
  }

  /**
   * Stop the sound and remove all active reading styling
   */
  stop(): void {
    this.playing = false;
    this.audio_howl_sprites.stop()
    this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
    if (this.reading$) {
      // unsubscribe to Subject
      this.reading$.unsubscribe()
    }
  }

  /**
   * Parse TEI-style text
   */
  private getText(): Array<string[]> {
    return parseTEI(this.text)
  }

  /**
   * Parse SMIL alignments
   */
  private getAlignments(): object {
    return parseSMIL(this.alignment)
  }

  /**
   * Given an audio file path and a parsed alignment object,
   * build a Sprite object
   * @param audio string
   * @param alignment object
   */
  private buildSprite(audio, alignment) {
    return new Sprite({
      src: [audio],
      sprite: alignment,
    });
  }

  /**
   * Lifecycle hook: Before component loads, build the Sprite and parse the files necessary
   */
  componentWillLoad() {
    this.processed_alignment = this.getAlignments()
    // load basic Howl
    this.audio_howl_sprites = new Howl({
      src: [this.audio],
      preload: true
    })
    // Once loaded, get duration and build Sprite
    this.audio_howl_sprites.once('load', () => {
      this.processed_alignment['all'] = [0, this.audio_howl_sprites.duration() * 1000];
      this.audio_howl_sprites = this.buildSprite(this.audio, this.processed_alignment);
    })
    this.processed_text = this.getText()
  }

  render() {
    // TODO: refactor control panel as its own component so we don't need to re-render the entire readalong
    // on state changes
    if (this.playing) {
      return (
        <div>
          <h1 class="slot__header">
            <slot name="read-along-header" />
          </h1>
          <h3 class="slot__subheader">
            <slot name="read-along-subheader" />
          </h3>
          <div class={'sentence theme--' + this.theme}>
            {this.processed_text.map((seg) =>
              <span class={'sentence__word theme--' + this.theme} id={seg[0]} onClick={(ev) => this.play(ev)}>{seg[1]} </span>
            )}
          </div>
          <div id='all' class={"theme--" + this.theme}></div>
          <div class={"control-panel theme--" + this.theme + " background--" + this.theme}>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.pause()}>pause</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.goBack(5)}>replay_5</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.stop()}>stop</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.play('all')}>style</i>
            </button>
          </div>
        </div>
      )
    } else {
      return (
        <div>
          <h1 class="slot__header">
            <slot name="read-along-header" />
          </h1>
          <h3 class="slot__subheader">
            <slot name="read-along-subheader" />
          </h3>
          <div class={'sentence theme--' + this.theme}>
            {this.processed_text.map((seg) =>
              <span class={'sentence__word theme--' + this.theme} id={seg[0]} onClick={(ev) => this.play(ev)}>{seg[1]} </span>
            )}
          </div>
          <div id='all' class={"theme--" + this.theme}></div>
          <div class={"control-panel theme--" + this.theme + " background--" + this.theme}>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.play('all')}>play_arrow</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.goBack(5)}>replay_5</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.stop()}>stop</i>
            </button>
            <button class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons" onClick={() => this.play('all')}>style</i>
            </button>
          </div>
        </div>
      )
    }

  }
}
