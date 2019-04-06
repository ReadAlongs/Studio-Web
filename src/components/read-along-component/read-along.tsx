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
  @Prop({ mutable: true }) theme: string = 'light';

  /**
   * Whether audio is playing or not
   */
  @State() playing: boolean = false;
  @State() settings: boolean = false;

  play_id: number;
  playback_rate: number = 1;

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
  playPause(id?): void {
    if (this.playing) {
      this.playing = false;
      this.audio_howl_sprites.pause()
    } else {

      if (id !== 'all') {
        var tag = id.path[0].id;
        var play_id = this.audio_howl_sprites.play(tag)
      } else {
        var tag = id
        // subscribe to reading subject and update element class
        this.reading$ = this.audio_howl_sprites._reading$.pipe(
          distinctUntilChanged()
        ).subscribe(x => {
          if (this.playing) {
            let query = this.tagToQuery(x);
            this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
            this.el.shadowRoot.querySelector(query).classList.add('reading')
          }
        })
        this.playing = true;
        // If already playing once, continue playing
        if (this.play_id) {
          this.audio_howl_sprites.play(this.play_id)
          // else, start a new play
        } else {
          var play_id = this.audio_howl_sprites.play(tag)
          this.play_id = play_id
        }

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
          this.el.shadowRoot.querySelector(query).classList.remove('reading')
        }
      }, play_id);


    }
  }

  /**
   * Go to seek
   * 
   * @param s number
   */
  goTo(s): void {
    console.log(s)
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
   * Change theme
   */
  changeTheme(): void {
    if (this.theme === 'light') {
      this.theme = 'dark'
    } else {
      this.theme = 'light'
    }
  }

  /**
   * Toggle settigs
   * 
   */
  toggleSettings(): void {
    this.settings = !this.settings;
    console.log(this.settings)
  }

  /**
   * Change playback between .75 and 1.25
   */
  changePlayback(v): void {
    this.playback_rate = v.path[0].value / 100
    this.audio_howl_sprites.sound.rate(this.playback_rate)
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
      rate: this.playback_rate
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

  render_settings() {
    if (this.settings) {
      return (
        <div class="settings">
          <hr class="settings__divider"></hr>
          <div class="settings__option__container">
            <h5 class={"settings__option__header color--" + this.theme}>Playback speed</h5>
            <input type="range" min="75" max="125" value={this.playback_rate * 100} class="slider settings__option__setting" id="myRange" onInput={(v) => this.changePlayback(v)} />
          </div>
          <h5 class={"settings__option__header color--" + this.theme}>Change style</h5>
          <button onClick={() => this.changeTheme()} class={"settings__option__setting ripple theme--" + this.theme + " background--" + this.theme}>
            <i class="material-icons-outlined">style</i>
          </button>
        </div>)
    } else { <div><p>hello</p></div> }
  }

  render() {
    return (
      <div class='read-along-container'>
        <h1 class="slot__header">
          <slot name="read-along-header" />
        </h1>
        <h3 class="slot__subheader">
          <slot name="read-along-subheader" />
        </h3>
        <div class={'sentence animate-transition theme--' + this.theme}>
          {this.processed_text.map((seg) =>
            <span class={'sentence__word theme--' + this.theme} id={seg[0]} onClick={(ev) => this.playPause(ev)}>{seg[1]} </span>
          )}
        </div>
        <div id='all' class={"theme--" + this.theme}></div>
        <div class={"control-panel theme--" + this.theme + " background--" + this.theme}>
          <button onClick={() => this.playPause('all')} class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
            <i class="material-icons">{this.playing ? 'pause' : 'play_arrow'}</i>
          </button>
          <button onClick={() => this.goBack(5)} class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
            <i class="material-icons">replay_5</i>
          </button>
          <button onClick={() => this.stop()} class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
            <i class="material-icons">stop</i>
          </button>
          <button onClick={() => this.toggleSettings()} class={"control-panel__control ripple theme--" + this.theme + " background--" + this.theme}>
            <i class="material-icons-outlined">settings</i>
          </button>
          {this.render_settings()}
        </div>
      </div >
    )
  }
}
