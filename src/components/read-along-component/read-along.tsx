import { Component, Element, Prop, State } from '@stencil/core';
import { distinctUntilChanged } from 'rxjs/operators';
import { Howl } from 'howler';
import { parseSMIL, parseTEI, Sprite } from '../../utils/utils'
// import { parse } from 'querystring';

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
  processed_text: Array<JSX.Element>;

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
  duration: number;

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

  play_id: number;
  playback_rate: number = 1;

  @State() fullscreen: boolean = false;

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
   * TODO: Refactor this ugliness
   */
  playPause(id?): void {
    // if main sprite is playing and play/pause is for main sprite, then pause it
    if (this.playing && id === 'all') {
      this.playing = false;
      this.audio_howl_sprites.pause()
    } else {
      // if playing a smaller sprite, seek main sprite to there and play it
      if (id !== 'all') {
        let path = id.composedPath();
        var tag = path[0].id;
        let seek = this.processed_alignment[tag][0]
        this.goTo(seek)
        this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
        this.el.shadowRoot.querySelector(this.tagToQuery(tag)).classList.add('reading')
        if (!this.playing) {
          var play_id = this.audio_howl_sprites.play(tag)
        }
        // if main sprite is selected, but not playing then set up reading$ highlighter sbject
        // and play the main sprite
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
          if (this.el.shadowRoot.querySelectorAll('.reading').length > 0) {
            let reading_el_id = this.el.shadowRoot.querySelector(".reading").id
            this.goTo(this.processed_alignment[reading_el_id][0])
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
            this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
            this.playing = false;
          }
        }, this.play_id);
      }
    }
  }

  /**
   * Remove highlighting from every other word and add it closest to second s
   * 
   * @param s seconds
   */
  highlightClosestTo(s) {
    let keys = Object.keys(this.processed_alignment)
    for (var i = 1; i < keys.length; i++) {
      if (s * 1000 > this.processed_alignment[keys[i]][0] && s * 1000 < this.processed_alignment[keys[i + 1]][0]) {
        this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
        this.el.shadowRoot.querySelector(this.tagToQuery(keys[i])).classList.add('reading')
        break;
      }
    }
  }

  /**
   * Go to seek
   * 
   * @param s number
   */
  goTo(ev): void {
    let seek = ev
    if (typeof (ev) !== 'number') {
      // get composed path
      let path = ev.composedPath()
      // query select the progress bar
      let progress_el = path[2].querySelector('#all')
      // get offset of clicked element
      let offset = progress_el.offsetLeft
      // get width of clicked element
      let width = progress_el.offsetWidth
      // get click point
      let click = ev.pageX - offset
      // get seek
      seek = (click / width) * this.duration

      this.highlightClosestTo(seek)
    } else {
      seek = seek / 1000
    }
    this.audio_howl_sprites.goTo(this.play_id, seek)
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
   * Change playback between .75 and 1.25
   */
  changePlayback(v): void {
    // let notches = [.75, .875, 1, 1.125, 1.25]
    // let window = 0.05
    let path = v.composedPath()
    let absolute_rate = path[0].value / 100
    // for (let notch of notches) {
    // console.log(absolute_rate)
    // console.log(notch)
    // if (absolute_rate <= notch + window && absolute_rate > notch) {
    //   this.playback_rate = notch
    //   break;
    // }
    this.playback_rate = absolute_rate
    // }
    // console.log(this.playback_rate)

    this.audio_howl_sprites.sound.rate(this.playback_rate)
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
   * Make Fullscreen
   */
  private toggleFullscreen() {
    if (!this.fullscreen) {
      var elem: any = this.el.shadowRoot.getElementById('sentence')
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
      this.el.shadowRoot.getElementById('sentence').classList.add('read-along-container--fullscreen')
    } else {
      var document: any = this.el.ownerDocument
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
      this.el.shadowRoot.getElementById('sentence').classList.remove('read-along-container--fullscreen')
    }
    this.fullscreen = !this.fullscreen
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
      this.duration = this.audio_howl_sprites.duration();
      this.audio_howl_sprites = this.buildSprite(this.audio, this.processed_alignment);
    })
    this.processed_text = this.renderText()
  }

  // RENDER FUNCTIONS

  /**
   * Turn parsed TEI-style text into JSX.Element
   */
  private renderText() {
    let parsed = parseTEI(this.text)
    let sent_els = parsed.map((s) =>
      <div class="sentence" id={s['id']}>
        {Array.from(s.childNodes).map((child) => {
          if (child.nodeName === '#text') {
            return <span class={'sentence__text theme--' + this.theme} id='text'>{child['textContent']}</span>
          } else if (child.nodeName === 'w') {
            return <span class={'sentence__word theme--' + this.theme} id={child['id']} onClick={(ev) => this.playPause(ev)}>{child['textContent']}</span>
          }

        })}
      </div>)
    return sent_els
  }

  render_settings() {
    return (
      <div class="settings">
        <hr class="settings__divider"></hr>
        <div class="settings__option__container">
          <h5 class={"settings__option__header color--" + this.theme}>Playback speed</h5>
          <input type="range" min="75" max="125" value={this.playback_rate * 100} class="slider settings__option__setting" id="myRange" onInput={(v) => this.changePlayback(v)} />
        </div>
      </div>)
  }

  render() {
    return (
      <div id='read-along-container' class='read-along-container'>
        <h1 class="slot__header">
          <slot name="read-along-header" />
        </h1>
        <h3 class="slot__subheader">
          <slot name="read-along-subheader" />
        </h3>
        <div id="sentence" class={'sentence__container animate-transition theme--' + this.theme}>
          <div class="sentence__container__buttons">
            <button onClick={() => this.changeTheme()} class={"settings__option__setting ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons-outlined">style</i>
            </button>
            <button onClick={() => this.toggleFullscreen()} class={"settings__option__setting ripple theme--" + this.theme + " background--" + this.theme}>
              <i class="material-icons">{this.fullscreen ? 'fullscreen_exit' : 'fullscreen'}</i>
            </button>
          </div>
          {this.renderText()}
        </div>
        <div id='all' class={"theme--" + this.theme} onClick={(e) => this.goTo(e)}></div>
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
          {this.render_settings()}
        </div>
      </div >
    )
  }
}
