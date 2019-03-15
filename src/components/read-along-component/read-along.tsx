import { Component, Prop } from '@stencil/core';
// import { Sprite } from '../../utils/sprite';
import { Howl, Howler } from 'howler';
import { parseSMIL, parseTEI } from '../../utils/utils'

@Component({
  tag: 'read-along',
  styleUrl: 'scss/styles.scss',
  shadow: true
})
export class ReadAlongComponent {
  /**
   * The text as TEI
   */
  @Prop() text: string;
  processed_text;

  /**
   * The alignment as SMIL
   */
  @Prop() alignment: string;
  processed_alignment;

  /**
   * The audio file
   */
  @Prop() audio: string;
  audio_howl: Howl;

  /**
   * Image
   */
  @Prop() image: string;

  play(id?) {
    if (id) {
      var tag = id.path[0].id
      this.audio_howl.play(tag)
    } else {
      this.audio_howl.play()
    }
  }

  // parse TEI text
  private getText() {
    return parseTEI(this.text)
  }

  // parse alignments
  private getAlignments() {
    return parseSMIL(this.alignment)
  }

  componentWillLoad(){
    this.processed_alignment = this.getAlignments()
    this.processed_text = this.getText()
    this.audio_howl = new Howl({
      src: [this.audio],
      sprite: this.processed_alignment
    })
  }

  render() {
    if (this.image) {
      return <img id='waveform' src={this.image} onClick={() => this.play(false)}></img>
    } else {
      return (
        <div>
          <div class='sentence'>
            {this.processed_text.map((seg) =>
              <span class='sentence__word ripple' id={seg[0]} onClick={(ev) => this.play(ev)}>{seg[1]} </span>
            )}
          </div>
          <div class="control-panel">
            <button class="control-panel__control ripple">
              <i class="material-icons" onClick={() => this.play(false)}>play_arrow</i>
            </button>
            <button class="control-panel__control ripple">
              <i class="material-icons">pause</i>
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
