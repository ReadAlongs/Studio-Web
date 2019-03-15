import { Component, Prop } from '@stencil/core';
// import { Sprite } from '../../utils/sprite';
import { Howl } from 'howler';
import { parseSMIL, parseTEI } from '../../utils/utils'

@Component({
  tag: 'read-along',
  styleUrl: 'read-along.scss',
  shadow: true
})
export class ReadAlongComponent {
  /**
   * The text as TEI
   */
  @Prop() text: string;

  /**
   * The alignment as SMIL
   */
  @Prop() alignment: string;

  /**
   * The audio file
   */
  @Prop() audio: string;

  /**
   * Image
   */
  @Prop() image: string;

  play(sprites?, id?) {
    var tag = id.path[0].id
    if (sprites) {
      var sound = new Howl({
        src: [this.audio],
        sprite: sprites
      })
      sound.play(tag)
    } else {
      var sound = new Howl({
        src: [this.audio]
      })
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

  render() {
    let text = this.getText();
    let alignments = this.getAlignments();
    if (this.image) {
      return <img id='waveform' src={this.image} onClick={() => this.play(alignments)}></img>
    } else {
      return (
        <div>
          {text.map((seg) =>
            <span id={seg[0]} onClick={(ev) => this.play(alignments, ev)}>{seg[1]} </span>
          )}
        </div>
      )
    }
  }
}
