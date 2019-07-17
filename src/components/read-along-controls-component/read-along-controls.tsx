import { Component, Prop, State } from '@stencil/core'

@Component({
  tag: 'read-along-controls',
  styleUrl: '../../scss/styles.scss',
})
export class MyComponent {
  @Prop() name: string
  @State() isVisible: boolean = true

  render () {
    return <p>I am {this.name}!</p>
  }
}