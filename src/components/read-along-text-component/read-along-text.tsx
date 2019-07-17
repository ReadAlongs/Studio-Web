import { Component, Prop, State } from '@stencil/core'

@Component({
  tag: 'read-along-text',
  styleUrl: '../../scss/styles.scss',
})
export class ReadAlongProgressComponent {
  @Prop() name: string
  @State() isVisible: boolean = true

  render () {
    return <p>I am {this.name}!</p>
  }
}