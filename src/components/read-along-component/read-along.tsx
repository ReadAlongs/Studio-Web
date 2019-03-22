import { Component, Element, Prop } from '@stencil/core';
import { distinctUntilChanged } from 'rxjs/operators';
import { Howl } from 'howler';
import { parseSMIL, parseTEI, Sprite } from '../../utils/utils'

@Component({
  tag: 'read-along',
  styleUrl: 'scss/styles.scss',
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
    var play_id = this.audio_howl_sprites.play(tag)

    // Create a progress element and begin visually tracking it.
    var elm = document.createElement('div');
    elm.className = 'progress';
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
   * Stop the sound and remove all active reading styling
   */
  stop(): void {
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
    return (
      <div>
        <div class='sentence' id='all'>
          {this.processed_text.map((seg) =>
            <span class='sentence__word' id={seg[0]} onClick={(ev) => this.play(ev)}>{seg[1]} </span>
          )}
        </div>
        <div class="control-panel">
          <button class="control-panel__control ripple">
            <i class="material-icons" onClick={() => this.play('all')}>play_arrow</i>
          </button>
          <button class="control-panel__control ripple">
            <i class="material-icons" onClick={() => this.stop()}>stop</i>
          </button>
          <button class="control-panel__control ripple">
            <i class="material-icons">loop</i>
          </button>
        </div>
      </div>
    )
  }
}
