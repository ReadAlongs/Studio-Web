import { Component, Element, Prop } from '@stencil/core';
import { distinctUntilChanged } from 'rxjs/operators';
// import { Sprite } from '../../utils/sprite';
import { Howl } from 'howler';
import { parseSMIL, parseTEI, Sprite } from '../../utils/utils'
import ResizeObserver from "resize-observer-polyfill";

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
  sprites: string[];
  test_sprite;

  /**
   * Image
   */
  @Prop() image: string;

  ro: ResizeObserver;

  playAllSprites(): void {
    this.sprites.forEach(s => this.audio_howl_sprites.play(s))
  }

  tagToQuery(id) {
    id = id.replace(".", "\\.")
    id = id.replace("#", "\\#")
    return "#" + id
  }

  play(id): void {
    if (id !== 'all') {
      var tag = id.path[0].id;
    } else {
      var tag = id
    }
    var play_id = this.audio_howl_sprites.play(tag)

    // subscribe to reading subject and update element class
    this.audio_howl_sprites._reading$.pipe(
      distinctUntilChanged()
    ).subscribe(x => {
      if (x) {
        let query = this.tagToQuery(x);
        this.el.shadowRoot.querySelectorAll(".reading").forEach(x => x.classList.remove('reading'))
        this.el.shadowRoot.querySelector(query).classList.add('reading')
      }
    })

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
      }
    }, play_id);

  }

  pause(): void {
    this.audio_howl_sprites.pause()
  }

  // parse TEI text
  private getText(): Array<string[]> {
    return parseTEI(this.text)
  }

  // parse alignments
  private getAlignments(): object {
    return parseSMIL(this.alignment)
  }

  private buildSprite(audio, alignment) {
    return new Sprite({
      src: [audio],
      sprite: alignment,
    });
  }

  componentWillLoad() {
    this.processed_alignment = this.getAlignments()
    this.audio_howl_sprites = new Howl({
      src: [this.audio],
      preload: true
    })
    this.audio_howl_sprites.once('load', () => {
      this.processed_alignment['all'] = [0, this.audio_howl_sprites.duration() * 1000];
      this.audio_howl_sprites = this.buildSprite(this.audio, this.processed_alignment);
      this.sprites = Object.keys(this.processed_alignment)
    })
    this.processed_text = this.getText()
  }

  render() {
    if (this.image) {
      return (
        <div>
          <div id='all'>
            <img id='waveform' src={this.image} onClick={() => this.play('all')}></img>
          </div>
          <div class='sentence' id='s'>
            {this.processed_text.map((seg) =>
              <span class='sentence__word' id={seg[0]} onClick={(ev) => this.play(ev)}>{seg[1]} </span>
            )}
          </div>
          <div class="control-panel">
            <button class="control-panel__control ripple">
              <i class="material-icons" onClick={() => this.play('all')}>play_arrow</i>
            </button>
            <button class="control-panel__control ripple">
              <i class="material-icons" onClick={() => this.pause()}>pause</i>
            </button>
            <button class="control-panel__control ripple">
              <i class="material-icons">loop</i>
            </button>
          </div>
        </div>
      )
    } else {
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
              <i class="material-icons" onClick={() => this.pause()}>stop</i>
            </button>
            <button class="control-panel__control ripple">
              <i class="material-icons">loop</i>
            </button>
          </div>
        </div>
      )
    }
  }
}
