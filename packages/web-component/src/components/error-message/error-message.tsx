import { Component, Prop, h, Event, EventEmitter, State } from "@stencil/core";
import { MatIcon } from "../../utils/mat-icon";

@Component({
  tag: "error-message",
  styles: `
    error-message {
      display: block;
    }
  `,
})
export class ErrorMessage {
  /**
   * The message to display to the user.
   */
  @Prop() msg: string;

  /**
   * Cypress data-test-id value.
   */
  @Prop() data_cy: string;

  /**
   * The on-screen duration of the error message. Zero disables this
   * functionality, the message remains on the screen.
   */
  @Prop() timeout?: number = 0;

  /**
   * Event get emitted when the timer expires.
   */
  @Event() expired: EventEmitter;

  timer: any = 0;

  @State() open = true;

  componentDidLoad(): void {
    if (this.timeout <= 0) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = 0;
      this.expired.emit();
      this.open = false;
    }, this.timeout);
  }

  disconnectedCallback(): void {
    this.open = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    }
  }

  render(): Element {
    if (!this.open) {
      return;
    }

    return (
      <p data-test-id={this.data_cy} class="alert status-error">
        <MatIcon>error_outline</MatIcon> {this.msg}
      </p>
    );
  }
}
